import {
  Timestamp,
  dreamsRef,
  getTwitterLatestId,
  getExcludeContributors,
  getLowContributors,
  getExcludeTagRegex,
  twitterMgrRef,
  getOrCreateContributors,
} from "./firestore";
import { analyzeDreamImageUrl } from "./vision";
import { SearchResponse } from "./types/twitterTypes";
import { DreamInfo } from "@core/models/types";
import { postDreamAlgolia } from "@core/algolia/post";
import _ from "lodash";
import { dreamsIndex } from "@core/algolia/init";
import { getDreams } from "@core/algolia/get";
import { createClient, getMaxFromQuery, switchSource } from "./twitter";
import { getPlainText } from "@core/twitter/utility";

export async function searchDreamTweets() {
  const [client, lastLatestId, exists, excludeConts, low, excludeTags] = await Promise.all([
    createClient(),
    getTwitterLatestId(),
    getDreams(),
    getExcludeContributors(),
    getLowContributors(),
    getExcludeTagRegex(),
  ]);
  let nextMax = "";
  let dreamLastId = "";
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
      q: "#夢番地 -#とび森 filter:images -filter:retweets",
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
      if (existsPosts.includes(tweet.id_str) || excludeConts.includes(tweet.id_str)) {
        continue;
      }

      // メディアがないツイートはスキップ
      if (!tweet.extended_entities?.media) {
        continue;
      }
      let dreamId = "";
      let islandName = "";
      let tags = _(tweet.entities.hashtags)
        .map(h => h.text)
        .filter(h => !excludeTags.test(h))
        .value();
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
      // 1回の収集では最新を使う
      if (registered.includes(dreamId)) {
        continue;
      }
      const name = tags.find(t => t.endsWith("島"));
      if (name) {
        islandName = islandName || name;
        tags = tags.filter(t => !t.endsWith("島"));
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
          fromSwitch: tweet.source === switchSource,
        },
        tags,
        createdAt: Timestamp.fromMillis(Date.parse(tweet.created_at)),
      };
      await Promise.all([dreamsRef.doc(dream.dreamId).set(dream), postDreamAlgolia(dreamsIndex, dream)]);
      console.log(dream.islandName + ":" + dream.tags.join(","));
    }
    console.log(res.search_metadata.max_id_str);
  } while (nextMax !== "");
  await twitterMgrRef.update({ dreamLastId });
}
