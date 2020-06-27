import { auth, https, config } from "firebase-functions";
import { initializeApp, firestore } from "firebase-admin";
import { HttpsError } from "firebase-functions/lib/providers/https";
import { TwitterUserCredential, Tweet } from "../../core/src/models/twitterTypes";
import { UserMediaTweets, PostedMedia, DesignInfo, Contributor } from "../../core/src/models/types";
import { assertIsDesignInfo, assertIsContributor } from "../../core/src/models/assert";
import { assertIsDefined } from "../../core/src/utilities/assert";
import { postAlgolia } from "../../core/src/algolia/post";
import Twitter from "twitter-lite";
import algoliasearch from "algoliasearch";
import DocumentReference = firestore.DocumentReference;
import FieldValue = firestore.FieldValue;
initializeApp();

const db = firestore();
const users = db.collection("users");
const contributors = db.collection("contributors");
const designs = db.collection("designs");

export const initUser = auth.user().onCreate(async user => {
  await users.doc(user.uid).create({
    favs: [],
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

async function getOrCreateContributorRef(user: Contributor) {
  const contributorRef = contributors.doc(`${user.platform}:${user.id}`);
  await contributorRef.set(user, { merge: true });
  return contributorRef as DocumentReference<Contributor>;
}

async function postDesignInfoToAlgolia(copy: DesignInfo) {
  const algoliaConfig = config().algolia;
  assertIsDefined(algoliaConfig);
  const algoliaId = algoliaConfig.id;
  const algoliaKey = algoliaConfig.key;
  assertIsDefined(algoliaId);
  assertIsDefined(algoliaKey);

  const algoliaClient = algoliasearch(algoliaId, algoliaKey);
  const designsIndex = algoliaClient.initIndex("designs");
  await postAlgolia(designsIndex, copy);
}
