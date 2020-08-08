import { auth, https, config } from "firebase-functions";
import { firestore } from "firebase-admin";
import { HttpsError } from "firebase-functions/lib/providers/https";
import { TwitterUserCredential, Tweet } from "../../core/src/models/twitterTypes";
import { UserMediaTweets, PostedMedia, DesignInfo, DreamInfo } from "../../core/src/models/types";
import { assertIsDesignInfo, assertIsContributor, assertDreamInfo } from "../../core/src/models/assert";
import { assertIsDefined, assertIsArray, assertIsString } from "../../core/src/utilities/assert";
import { getPlainText } from "../../core/src/twitter/utility";
import { includePartRegex } from "../../core/src/utilities/systemUtility";
import Twitter from "twitter-lite";
import DocumentReference = firestore.DocumentReference;
import FieldValue = firestore.FieldValue;
import { postDesignInfoToAlgolia, postDreamInfoToAlgolia, getDesignIndex, getDreamIndex } from "./algolia";
import { getOrCreateContributorRef, users, designs, dreams } from "./firestore";

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

export const registerDesignInfo = https.onCall(async (data: DesignInfo, context) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "認証されていません");
  }
  if (data === undefined || data === null) {
    throw new HttpsError("data-loss", "データが指定されていません");
  }

  const contributor = data.post.contributor;
  try {
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
  const conId = "Twitter:" + userId;
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
        if (conRef.id === conId) {
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

  const copy: DreamInfo = {
    islandName: data.islandName,
    dreamId: data.dreamId,
    tags: [],
    imageUrls: [],
    post: {
      contributor: await getOrCreateContributorRef(contributor),
      postId: data.post.postId,
      fromSwitch: data.post.fromSwitch,
      platform: data.post.platform,
      text: data.post.text,
    },
    createdAt: FieldValue.serverTimestamp(),
  };

  for (const urls of data.imageUrls) {
    copy.imageUrls.push({
      thumb1: urls.thumb1,
      thumb2: urls.thumb2,
      large: urls.large,
    });
  }

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
