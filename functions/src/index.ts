import { auth, https, config } from "firebase-functions";
import { initializeApp, firestore } from "firebase-admin";
import { HttpsError } from "firebase-functions/lib/providers/https";
import { TwitterUserCredential, Tweet } from "../../core/src/models/twitterTypes";
import { UserMediaTweets, PostedMedia } from "../../core/src/models/types";
import { assertIsDefined } from "../../core/src/utilities/assert";
import Twitter from "twitter-lite";
import _ from "lodash";
initializeApp();

const db = firestore();
const users = db.collection("users");

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
