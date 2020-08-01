import { db, Timestamp, getExcludeTags, dreadmsRef } from "./firestore";
import { analyzeDreamImageUrl } from "./vision";
import { SearchResponse } from "./types/twitterTypes";
import { DreamInfo } from "@core/models/types";
import { postDreamAlgolia } from "@core/algolia/post";
import _ from "lodash";
import { dreamsIndex } from "@core/algolia/init";
import { includePartRegex } from "./utility";
import { getDreams } from "@core/algolia/get";
import { createClient, getMaxFromQuery, getPlainText, getOrCreateContributors } from "./twitter";

export async function searchDreamTweets() {
  const client = await createClient();
  const mgtRef = db.collection("management").doc("twitter");
  const mgt = await mgtRef.get();
  const lastLatestId = mgt.get("dreamLastId") as string;
  const low = mgt.get("lowContributors") as string[];
  const excludeTags = includePartRegex(await getExcludeTags());
  let nextMax = "";
  let dreamLastId = "";
  const exists = await getDreams();
  const existsPosts = _(exists)
    .filter(d => d.post.platform === "Twitter")
    .map(d => d.post.postId)
    .uniq()
    .value();
  const existsIds = _(exists)
    .filter(d => d.post.platform === "Twitter")
    .map(d => d.dreamId)
    .value();
  const registered: string[] = [];
  do {
    // ツイートの検索
    const res = await client.get<SearchResponse>("search/tweets", {
      q: "#夢番地 filter:images -filter:retweets",
      max_id: nextMax,
      lang: "ja",
      locale: "ja",
      result_type: "recent",
      tweet_mode: "extended",
      count: 100,
    });

    // 今回の処理の最新ID取得
    if (!dreamLastId) {
      dreamLastId = res.statuses[0].id_str;
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
      let dreamId = "";
      let islandName = "";
      const text = getPlainText(tweet.full_text);
      const dreamMatch = text.match(/(DA-)?\d{4}(-\d{4}){2}/);
      if (dreamMatch) {
        const id = dreamMatch[0];
        dreamId = id.startsWith("DA") ? id : "DA-" + id;
      }
      const islandMatch = text.match(
        /(?<island>[a-zA-Z\u3041-\u3094\u30A1-\u30FC]+島)[^\u3041-\u3094\u30A1-\u30FC\u4e00-\u9fff]/
      );
      if (islandMatch?.groups) {
        islandName = islandMatch.groups.island.trim();
      }
      // すでに存在する夢かつまとめ系アカウントの投稿はスキップする
      if (low.includes(tweet.user.id_str) && existsIds.includes(dreamId)) {
        continue;
      }
      if (!dreamId || !islandName) {
        for (const media of tweet.extended_entities.media) {
          const info = await analyzeDreamImageUrl(media.media_url_https + "?name=large");
          // 夢番地はツイート優先
          if (!dreamId && info.dreamId) {
            dreamId = info.dreamId;
          }
          // 島名は解析優先
          if (info.islandName) {
            islandName = info.islandName;
          }
          // 両方確定したら抜ける
          if (dreamId && islandName) {
            break;
          }
        }
      }
      if (!dreamId) {
        continue;
      }
      // 一旦追加済みはスキップ(更新時に画像を差し替えるために今後はスキップしない)
      if (existsIds.includes(dreamId) && registered.includes(dreamId)) {
        continue;
      }
      registered.push(dreamId);
      const dream: DreamInfo = {
        dreamId,
        islandName,
        imageUrls: tweet.extended_entities.media.map(m => ({
          thumb1: m.media_url_https + "?name=thumb",
          thumb2: m.media_url_https + "?name=small",
          large: m.media_url_https + "?name=large",
        })),
        post: {
          contributor: await getOrCreateContributors({
            id: tweet.user.id_str,
            name: tweet.user.name,
            screenName: tweet.user.screen_name,
            platform: "Twitter",
          }),
          text,
          postId: tweet.id_str,
          platform: "Twitter",
          fromSwitch:
            tweet.source ===
            '<a href="https://www.nintendo.com/countryselector" rel="nofollow">Nintendo Switch Share</a>',
        },
        tags: _(tweet.entities.hashtags)
          .map(h => h.text)
          .filter(h => !excludeTags.test(h))
          .value(),
        createdAt: Timestamp.fromMillis(Date.parse(tweet.created_at)),
      };
      await Promise.all([dreadmsRef.doc(dream.dreamId).set(dream), postDreamAlgolia(dreamsIndex, dream)]);
      console.log(dream.islandName + ":" + dream.tags.join(","));
    }
    console.log(res.search_metadata.max_id_str);
  } while (nextMax !== "");
  await mgtRef.update({ dreamLastId });
}
