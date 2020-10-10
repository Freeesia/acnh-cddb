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
import { getOrCreateContributorRef, users, designs, dreams, getExcludeTags, designLists, db } from "./firestore";
import { createFirebaseUrl } from "./storage";
import path from "path";
import escape from "escape-html";
import axios from "axios";

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
    let sinceId = data.maxId ?? "";
    const posts: PostedMedia[] = [];
    for (let i = 0; i < 10 && posts.length < 20; i++) {
      const params: any = {
        count: 200,
        trim_user: true,
        exclude_replies: true,
        include_rts: false,
        tweet_mode: "extended",
      };
      if (sinceId) {
        params.max_id = sinceId;
      }
      const res = await client.get<Tweet[]>("statuses/user_timeline", params);
      for (const tweet of res) {
        if (!tweet.extended_entities?.media || tweet.id_str === sinceId) {
          continue;
        }
        const createdAt = new Date(tweet.created_at);
        const fromSwitch =
          tweet.source ===
          '<a href="https://www.nintendo.com/countryselector" rel="nofollow">Nintendo Switch Share</a>';
        for (const media of tweet.extended_entities.media) {
          posts.push({
            id: media.id_str,
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
      sinceId = res[res.length - 1].id_str;
    }
    return {
      posts,
      sinceId,
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
    tags: data.tags ?? [],
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

export const createListOgp = https.onRequest(async (req, res) => {
  const host = req.header("x-forwarded-host");
  if (!host) {
    res.redirect("/");
    return;
  }
  const path = req.path.split("/");
  const id = path[path.length - 1];
  const [r, doc] = await Promise.all([axios.get<string>(`${req.protocol}://${host}`), designLists.doc(id).get()]);
  const list = doc.data() as DesignList;
  const html = r.data
    .replace("<meta property=og:type content=website>", "<meta property=og:type content=article>")
    .replace(
      /<meta property=og:url content=.*?>/,
      `<meta property=og:url content=${req.protocol}://${host}${req.path} />`
    )
    .replace(/<meta property=og:title content=".*?">/, `<meta property=og:title content="${escape(list.name)}">`)
    .replace(
      /<meta property=og:description content=".*?">/,
      `<meta property=og:description content="${escape(list.description)}">`
    );
  res.set("Cache-Control", "public, max-age=600, s-maxage=3600").status(200).send(html);
});

export const changeOnlyMyself = https.onCall(async (data: boolean, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "認証されていません");
  }
  const uid = context.auth.uid;
  const twitterIds = context.auth.token.firebase.identities["twitter.com"];
  if (!Array.isArray(twitterIds)) {
    throw new HttpsError("unavailable", "Twiiter以外のIDは操作出来ません");
  }
  await db.runTransaction(async t => {
    t.update(
      db.doc("management/twitter"),
      "excludeContributors",
      data ? FieldValue.arrayUnion(...twitterIds) : FieldValue.arrayRemove(...twitterIds)
    );
    t.update(db.doc("users/" + uid), "onlyMyself", data);
  });
});
