import { auth, https, config } from "firebase-functions";
import { firestore } from "firebase-admin";
import { HttpsError } from "firebase-functions/lib/providers/https";
import { TwitterUserCredential, Tweet } from "../../core/src/models/twitterTypes";
import {
  UserMediaTweets,
  PostedMedia,
  DesignInfo,
  DreamInfo,
  PostedTweet,
  DesignList,
  HostedMedia,
} from "../../core/src/models/types";
import { assertIsDesignInfo, assertIsContributor, assertDreamInfo } from "../../core/src/models/assert";
import { assertIsDefined, assertIsArray, assertIsString, assertIsBoolean } from "../../core/src/utilities/assert";
import { getPlainText } from "../../core/src/twitter/utility";
import { includePartRegex } from "../../core/src/utilities/systemUtility";
import Twitter from "twitter-lite";
import DocumentReference = firestore.DocumentReference;
import FieldValue = firestore.FieldValue;
import { postDesignInfoToAlgolia, postDreamInfoToAlgolia, getDesignIndex, getDreamIndex } from "./algolia";
import { getOrCreateContributorRef, users, designs, dreams, getExcludeTags, designLists } from "./firestore";
import { createFirebaseUrl } from "./storage";
import path from "path";

export const initUser = auth.user().onCreate(async user => {
  await users.doc(user.uid).create({
    favs: [],
    downloaded: [],
  });
});

export const deleteUser = auth.user().onDelete(async user => {
  await users.doc(user.uid).delete();
});

export const getTweetImages = https.onCall(
  async (data: TwitterUserCredential, context): Promise<UserMediaTweets> => {
    if (!context.auth) {
      throw new HttpsError("unauthenticated", "認証されていません");
    }
    const twitterConfig = config().twitter;
    assertIsDefined(twitterConfig);
    const key = twitterConfig.key;
    const secret = twitterConfig.secret;
    assertIsDefined(key);
    assertIsDefined(secret);
    const client = new Twitter({
      consumer_key: key,
      consumer_secret: secret,
      access_token_key: data.token,
      access_token_secret: data.secret,
    });
    const res = await client.get<Tweet[]>("statuses/user_timeline", {
      count: 200,
      trim_user: true,
      exclude_replies: true,
      include_rts: false,
      tweet_mode: "extended",
    });
    const posts: PostedMedia[] = [];
    for (const tweet of res) {
      if (!tweet.extended_entities?.media) {
        continue;
      }
      const createdAt = new Date(tweet.created_at);
      const fromSwitch =
        tweet.source === '<a href="https://www.nintendo.com/countryselector" rel="nofollow">Nintendo Switch Share</a>';
      for (const media of tweet.extended_entities.media) {
        posts.push({
          imageUrls: {
            thumb1: media.media_url_https + "?name=thumb",
            thumb2: media.media_url_https + "?name=small",
            large: media.media_url_https + "?name=large",
          },
          post: {
            contributor: tweet.user.id_str,
            postId: tweet.id_str,
            platform: "Twitter",
            fromSwitch,
          },
          createdAt,
        });
      }
    }
    return {
      posts,
      sinceId: res[res.length - 1].id_str,
    };
  }
);

export const getTweets = https.onCall(
  async (data: TwitterUserCredential, context): Promise<PostedTweet[]> => {
    if (!context.auth) {
      throw new HttpsError("unauthenticated", "認証されていません");
    }
    const twitterConfig = config().twitter;
    assertIsDefined(twitterConfig);
    const key = twitterConfig.key;
    const secret = twitterConfig.secret;
    assertIsDefined(key);
    assertIsDefined(secret);
    const client = new Twitter({
      consumer_key: key,
      consumer_secret: secret,
      access_token_key: data.token,
      access_token_secret: data.secret,
    });
    const res = await client.get<Tweet[]>("statuses/user_timeline", {
      count: 200,
      trim_user: true,
      exclude_replies: true,
      include_rts: false,
      tweet_mode: "extended",
    });
    return res
      .filter(t => t.extended_entities?.media)
      .map(t => {
        const fromSwitch =
          t.source === '<a href="https://www.nintendo.com/countryselector" rel="nofollow">Nintendo Switch Share</a>';
        return {
          postId: t.id_str,
          contributor: t.user.id_str,
          platform: "Twitter",
          fromSwitch,
          imageUrls:
            t.extended_entities?.media
              ?.filter(m => m.type === "photo")
              .map(m => ({
                thumb1: m.media_url_https + "?name=thumb",
                thumb2: m.media_url_https + "?name=small",
                large: m.media_url_https + "?name=large",
              })) ?? [],
          tags: t.entities?.hashtags.map(h => h.text) ?? [],
          text: getPlainText(t.full_text),
        };
      });
  }
);

export const registerDesignInfo = https.onCall(async (data: DesignInfo, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "認証されていません");
  }
  if (data === undefined || data === null) {
    throw new HttpsError("data-loss", "データが指定されていません");
  }

  const contributor = data.post.contributor;
  try {
    if (data.post.platform === "Hosted") {
      const media = (data as unknown) as HostedMedia;
      const ext = path.extname(media.path);
      const dir = path.dirname(media.path);
      const base = path.basename(media.path, ext);
      const [thumb1, thumb2] = await Promise.all([
        createFirebaseUrl(path.join(dir, "thumbs", base + "_270x150" + ext)),
        createFirebaseUrl(path.join(dir, "thumbs", base + "_680x480" + ext)),
      ]);
      data.imageUrls.thumb1 = thumb1;
      data.imageUrls.thumb2 = thumb2;
    }
    assertIsDesignInfo(data);
    assertIsContributor(contributor);
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpsError("data-loss", e.message);
    } else {
      throw new HttpsError("unknown", e);
    }
  }

  const copy: DesignInfo = {
    title: data.title,
    designId: data.designId,
    dominantColors: data.dominantColors,
    dominantColorTypes: data.dominantColorTypes,
    designType: data.designType,
    tags: [],
    imageUrls: {
      large: data.imageUrls.large,
      thumb1: data.imageUrls.thumb1,
      thumb2: data.imageUrls.thumb2,
    },
    post: {
      contributor: await getOrCreateContributorRef(contributor),
      postId: data.post.postId,
      fromSwitch: data.post.fromSwitch,
      platform: data.post.platform,
    },
    createdAt: FieldValue.serverTimestamp(),
  };

  if (data.author) {
    copy.author = {
      authorName: data.author.authorName,
      islandName: data.author.islandName,
      authorId: data.author.authorId,
    };
  }

  const docRef = designs.doc(copy.designId);

  await docRef.set(copy);
  const doc = await docRef.get();
  assertIsDefined(doc.createTime);
  copy.createdAt = doc.createTime;

  await postDesignInfoToAlgolia(copy);
});

export const unregisterDesignInfo = https.onCall(async (data: string[], context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "認証されていません");
  }
  const userId = context.auth.token.firebase.identities["twitter.com"];
  if (!userId) {
    throw new HttpsError("unavailable", "Twiiter以外のデザインは削除できません");
  }
  const cons = ["Twitter:" + userId, "Hosted:" + context.auth.uid];
  const ids: string[] = [];
  try {
    assertIsDefined(data);
    assertIsArray(data, "data");
    await Promise.all(
      data.map(async id => {
        assertIsString(id, "");
        const docRef = designs.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) {
          return;
        }
        const conRef = doc.get("post.contributor") as DocumentReference;
        if (cons.includes(conRef.id)) {
          ids.push(id);
        }
      })
    );
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpsError("data-loss", e.message);
    } else {
      throw new HttpsError("unknown", e);
    }
  }
  const designsIndex = getDesignIndex();
  await Promise.all([designsIndex.deleteObjects(ids), Promise.all([ids.map(id => designs.doc(id).delete())])]);
});

export const registerDreamInfo = https.onCall(async (data: DreamInfo, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "認証されていません");
  }
  if (data === undefined || data === null) {
    throw new HttpsError("data-loss", "データが指定されていません");
  }

  const contributor = data.post.contributor;
  try {
    assertDreamInfo(data);
    assertIsContributor(contributor);
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpsError("data-loss", e.message);
    } else {
      throw new HttpsError("unknown", e);
    }
  }

  const excludeTags = includePartRegex(await getExcludeTags());

  const copy: DreamInfo = {
    islandName: data.islandName,
    dreamId: data.dreamId,
    tags: data.tags.filter(t => !excludeTags.test(t) && data.islandName !== t),
    imageUrls: data.imageUrls.map(u => ({
      thumb1: u.thumb1,
      thumb2: u.thumb2,
      large: u.large,
    })),
    post: {
      contributor: await getOrCreateContributorRef(contributor),
      postId: data.post.postId,
      fromSwitch: data.post.fromSwitch,
      platform: data.post.platform,
      text: data.post.text,
    },
    createdAt: FieldValue.serverTimestamp(),
  };

  const docRef = dreams.doc(copy.dreamId);

  await docRef.set(copy);
  const doc = await docRef.get();
  assertIsDefined(doc.createTime);
  copy.createdAt = doc.createTime;

  await postDreamInfoToAlgolia(copy);
});

export const unregisterDreamInfo = https.onCall(async (data: string, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "認証されていません");
  }
  const userId = context.auth.token.firebase.identities["twitter.com"];
  if (!userId) {
    throw new HttpsError("unavailable", "Twiiter以外のデザインは削除できません");
  }
  try {
    assertIsDefined(data);
    assertIsString(data, "data");
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpsError("data-loss", e.message);
    } else {
      throw new HttpsError("unknown", e);
    }
  }
  const docRef = dreams.doc(data);
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new HttpsError("not-found", `存在しないID:${data}が指定されました`);
  }
  const conRef = doc.get("post.contributor") as DocumentReference;
  if (conRef.id !== "Twitter:" + userId) {
    throw new HttpsError("permission-denied", "自分が投稿した夢番地のみ削除できます");
  }
  const dreamIndex = getDreamIndex();
  await Promise.all([dreamIndex.deleteObject(data), dreams.doc(data).delete()]);
});

export const createDesignList = https.onCall(async (data: any, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "認証されていません");
  }
  try {
    assertIsDefined(data);
    assertIsString(data.name, "name");
    assertIsString(data.description, "description");
    assertIsBoolean(data.isPublic, "isPublic");
  } catch (e) {
    if (e instanceof Error) {
      throw new HttpsError("data-loss", e.message);
    } else {
      throw new HttpsError("unknown", e);
    }
  }
  const list: DesignList = {
    name: data.name,
    description: data.description,
    isPublic: data.isPublic,
    owner: context.auth.uid,
    designs: [],
    createdAt: FieldValue.serverTimestamp(),
  };
  if (typeof data.design === "string") {
    list.designs.push(designs.doc(data.design));
  }
  const res = await designLists.add(list);
  return res.id;
});

export const createListOgp = https.onRequest((req, res) => {
  const path = req.path.split("/");
  const id = path[path.length - 1];
  const list = await designLists.doc(id).get();
  const html = `<!DOCTYPE html><html lang=ja><head><meta charset=utf-8><meta http-equiv=X-UA-Compatible content="IE=edge"><meta name=viewport content="width=device-width,initial-scale=1"><meta property=og:title content="あつまれ マイデザの🌳"><meta property=og:type content=website><meta property=og:description content="あつまれ マイデザの🌳はSNS上に公開されているマイデザインを集めたデータベースサイトです"><meta property=og:url content=https://acnh-cddb.web.app/ ><meta property=og:site_name content="あつまれ マイデザの🌳"><meta property=og:image content=https://acnh-cddb.web.app/img/ogp_image.png><meta name=twitter:card content=summary><!--[if IE]><link rel="icon" href="/favicon.ico" /><![endif]--><title>あつまれ マイデザの🌳</title><link rel=stylesheet href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900"><link rel=stylesheet href="https://fonts.googleapis.com/css?family=Material+Icons"><link href=/css/main.2f75a4e6.css rel=prefetch><link href=/js/chunk-7aec1aca.931744ee.js rel=prefetch><link href=/js/chunk-cd7ac4ac.2d07de59.js rel=prefetch><link href=/js/lang-en-json.4c84f330.js rel=prefetch><link href=/js/lang-ko-json.31626357.js rel=prefetch><link href=/js/lang-zh-json.241b2f3d.js rel=prefetch><link href=/js/main.d3090222.js rel=prefetch><link href=/js/md-en.2d69baec.js rel=prefetch><link href=/js/md-ja.01c06eeb.js rel=prefetch><link href=/js/md-ko.ec7f76dd.js rel=prefetch><link href=/js/md-zh.6eab3ff3.js rel=prefetch><link href=/css/chunk-vendors.672e26ea.css rel=preload as=style><link href=/js/chunk-vendors.46cfbfeb.js rel=preload as=script><link href=/js/index.1dfeff49.js rel=preload as=script><link href=/css/chunk-vendors.672e26ea.css rel=stylesheet><script src=/js/chunk-vendors.46cfbfeb.js defer></script><script src=/js/index.1dfeff49.js defer></script><link rel=icon type=image/png sizes=32x32 href=/img/icons/favicon-32x32.png><link rel=icon type=image/png sizes=16x16 href=/img/icons/favicon-16x16.png><link rel=manifest href=/manifest.json><meta name=theme-color content=#7cb894><meta name=apple-mobile-web-app-capable content=no><meta name=apple-mobile-web-app-status-bar-style content=default><meta name=apple-mobile-web-app-title content="あつまれ マイデザの🌳"><link rel=apple-touch-icon href=/img/icons/apple-touch-icon-152x152.png><link rel=mask-icon href=/img/icons/safari-pinned-tab.svg color=#7cb894><meta name=msapplication-TileImage content=/img/icons/msapplication-icon-144x144.png><meta name=msapplication-TileColor content=#7cb894></head><body><noscript><strong>We're sorry but あつまれ マイデザの🌳 doesn't work properly without JavaScript enabled. Please enable it to continue.</strong></noscript><div id=app></div></body></html>`;
});
