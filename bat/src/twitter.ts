import { db, Timestamp, designsRef, getExcludeTags } from "./firestore";
import Twitter from "twitter-lite";
import querystring from "querystring";
import { analyzeImageUrl } from "./vision";
import { SearchResponse } from "./types/twitterTypes";
import { DesignInfo, Contributor } from "@core/models/types";
import { DocumentReference } from "@google-cloud/firestore";
import { postAlgolia } from "@core/algolia/post";
import { TweetUser, Tweet } from "@core/models/twitterTypes";
import _ from "lodash";
import { designsIndex } from "@core/algolia/init";
import { includePartRegex } from "./utility";
import { getDesigns } from "@core/algolia/get";

export async function createClient() {
  const user = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY ?? "",
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET ?? "",
  });

  const response = await user.getBearerToken();
  return new Twitter({
    bearer_token: response.access_token,
  } as any);
}

export async function getTweets(ids: string[]) {
  const client = await createClient();
  const texts: Tweet[] = [];
  for (const chunk of _(ids).chunk(100).value()) {
    const res = await client.post<Tweet[]>("statuses/lookup", {
      id: chunk.join(","),
      trim_user: true,
      include_entities: true,
      tweet_mode: "extended",
    });
    texts.push(...res);
  }

  return texts;
}

export function getPlainText(text: string) {
  return (
    text
      // ハッシュタグとURLを削除
      .replace(/(＃|#|https?:\/\/).*?(\s+|$)/g, "")
      // 空行削除
      .replace(/\n+/g, "\n")
      // 最後の空行削除
      .replace(/\n(\s+)?$/, "")
      .replace("&lt;", "<")
      .replace("&gt;", ">")
      .replace("&amp;", "&")
      .replace("&apos;", "'")
      .replace("&quot;", '"')
      .replace("&nbsp;", "\xa0")
  );
}

export function getMaxFromQuery(query?: string) {
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

export async function getOrCreateContributors(user: TweetUser) {
  const contributors = db.collection("contributors");
  const contributorRef = contributors.doc(`${user.platform}:${user.id}`);
  await contributorRef.set(user, { merge: true });
  return contributorRef as DocumentReference<Contributor>;
}

export async function searchTweets() {
  const client = await createClient();
  const mgtRef = db.collection("management").doc("twitter");
  const mgt = await mgtRef.get();
  const lastLatestId = mgt.get("latestId") as string;
  const excludeTags = includePartRegex(await getExcludeTags());
  let nextMax = "";
  let latestId = "";
  const exists = await getDesigns();
  const existsPosts = _(exists)
    .filter(d => d.post.platform === "Twitter")
    .map(d => d.post.postId)
    .uniq()
    .value();
  const existsIds = _(exists)
    .filter(d => d.post.platform === "Twitter")
    .map(d => d.designId)
    .value();
  do {
    // ツイートの検索
    const res = await client.get<SearchResponse>("search/tweets", {
      q: "#マイデザイン filter:images -filter:retweets",
      max_id: nextMax,
      lang: "ja",
      locale: "ja",
      result_type: "recent",
      tweet_mode: "extended",
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
      if (existsPosts.includes(tweet.id_str)) {
        continue;
      }

      // メディアがないツイートはスキップ
      if (!tweet.extended_entities?.media) {
        continue;
      }
      const createdAt = Timestamp.fromMillis(Date.parse(tweet.created_at));
      const fromSwitch =
        tweet.source === '<a href="https://www.nintendo.com/countryselector" rel="nofollow">Nintendo Switch Share</a>';
      for (const media of tweet.extended_entities.media) {
        // 画像が1280以外は解析位置が異なるのでスキップ
        if (media.sizes.large.w !== 1280) {
          continue;
        }
        const info = await analyzeImageUrl(media.media_url_https + "?name=large", media.sizes.large.w);

        // 情報が取得できなければ対象の画像ではないのでスキップ
        // 既に登録済ならスキップ
        if (!info || existsIds.includes(info.designId)) {
          continue;
        }
        const postInfo = info as DesignInfo;
        postInfo.imageUrls = {
          thumb1: media.media_url_https + "?name=thumb",
          thumb2: media.media_url_https + "?name=small",
          large: media.media_url_https + "?name=large",
        };
        postInfo.tags = _(tweet.entities.hashtags)
          .map(h => h.text)
          .filter(h => !excludeTags.test(h))
          .value();
        postInfo.post = {
          contributor: await getOrCreateContributors({
            id: tweet.user.id_str,
            name: tweet.user.name,
            screenName: tweet.user.screen_name,
            platform: "Twitter",
          }),
          text: getPlainText(tweet.full_text),
          postId: tweet.id_str,
          platform: "Twitter",
          fromSwitch,
        };
        postInfo.createdAt = createdAt;
        await Promise.all([designsRef.doc(postInfo.designId).set(postInfo), postAlgolia(designsIndex, postInfo)]);
        console.log(postInfo.title + ":" + postInfo.tags.join(","));
      }
    }
    console.log(res.search_metadata.max_id_str);
  } while (nextMax !== "");
  await mgtRef.update({ latestId });
}
