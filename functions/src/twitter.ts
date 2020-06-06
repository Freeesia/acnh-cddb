import Twitter from "twitter-lite";
import querystring from "querystring";
import { analyzeImageUrl } from "./vision";
import { firestore, initializeApp } from "firebase-admin";

initializeApp();

import Timestamp = firestore.Timestamp;
import { TweetUser, SearchResponse, PostDesignInfo } from "./types";

const db = firestore();
const users = db.collection("users");
const designs = db.collection("designs");

async function createClient() {
  const user = new Twitter({
    // eslint-disable-next-line @typescript-eslint/camelcase
    consumer_key: process.env.TWITTER_CONSUMER_KEY ?? "",
    // eslint-disable-next-line @typescript-eslint/camelcase
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET ?? "",
  });

  const response = await user.getBearerToken();
  return new Twitter({
    // eslint-disable-next-line @typescript-eslint/camelcase
    bearer_token: response.access_token,
  } as any);
}

function getMaxFromQuery(query?: string) {
  if (!query) {
    return "";
  }
  const nextQuery = querystring.parse(query.startsWith("?") ? query.substr(1) : query);
  const max = nextQuery.max_id;
  if (!max) {
    return "";
  } else if (max instanceof Array) {
    return max[0];
  } else {
    return max;
  }
}

async function getOrCreateUser(user: TweetUser) {
  const userRef = users.doc(user.id);
  await userRef.set(user, { merge: true });
  return userRef;
}

export async function searchTweets() {
  const client = await createClient();
  const mgtRef = db.collection("management").doc("twitter");
  const mgt = await mgtRef.get();
  const lastLatestId = mgt.get("latestId") as string;
  let nextMax = "";
  let latestId = "";
  do {
    // ツイートの検索
    const res = await client.get<SearchResponse>("search/tweets", {
      q: "#ACNH #マイデザイン filter:images -filter:retweets",
      // eslint-disable-next-line @typescript-eslint/camelcase
      max_id: nextMax,
      lang: "ja",
      locale: "ja",
      // eslint-disable-next-line @typescript-eslint/camelcase
      result_type: "recent",
      count: 100,
    });

    // 今回の処理の最新ID取得
    if (!latestId) {
      latestId = res.statuses[0].id_str;
    }

    // 次のページ取得処理用の最大Id取得
    nextMax = getMaxFromQuery(res.search_metadata.next_results);
    for (const tweet of res.statuses) {
      // 前回の処理の最新IDまで到達したら次ページを取得せずに終了
      if (tweet.id_str <= lastLatestId) {
        nextMax = "";
        break;
      }

      // メディアがないツイートはスキップ
      // TODO : テキストが長いツイートは標準検索APIでは画像部分が取れなかったりする…
      if (!tweet.entities.media) {
        continue;
      }
      const createdAt = Timestamp.fromMillis(Date.parse(tweet.created_at));
      const fromSwitch =
        tweet.source === '<a href="https://www.nintendo.com/countryselector" rel="nofollow">Nintendo Switch Share</a>';
      for (const media of tweet.entities.media) {
        // 画像が1280以外は解析位置が異なるのでスキップ
        if (media.sizes.large.w !== 1280) {
          continue;
        }
        const info = await analyzeImageUrl(media.media_url_https + "?name=large");

        // 情報が取得できなければ対象の画像ではないのでスキップ
        if (!info) {
          continue;
        }
        const postInfo = info as PostDesignInfo;
        postInfo.imageUrl = media.media_url_https;
        postInfo.post = {
          user: await getOrCreateUser({
            id: tweet.user.id_str,
            name: tweet.user.name,
            screenName: tweet.user.screen_name,
          }),
          postId: tweet.id_str,
          fromSwitch,
        };
        postInfo.createdAt = createdAt;
        await designs.doc(postInfo.designId).set(postInfo);
      }
    }
    console.log(res.search_metadata.max_id_str);
  } while (nextMax !== "");
  await mgtRef.update({ latestId });
}
