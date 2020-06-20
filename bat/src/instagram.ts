import { db, Timestamp } from "./firestore";
import { analyzeImageUrl } from "./vision";
import axios from "axios";
import { GraphqlResponce } from "./types/instagamTypes";
import { Contributor } from "@core/models/types";
import { PostDesignInfo } from "./types/types";

const contributors = db.collection("contributors");
const designs = db.collection("designs");

async function getOrCreateContributors(user: Contributor) {
  const contributorRef = contributors.doc(`${user.platform}:${user.id}`);
  await contributorRef.set(user, { merge: true });
  return contributorRef;
}

export async function searchPosts() {
  const mgtRef = db.collection("management").doc("instagram");
  const mgt = await mgtRef.get();
  const lastLatestId = mgt.get("latestId") as string;
  let latestId = "";
  const t = {
    tag_name: "マイデザイン配布",
    first: 12, // 謎
  } as any;
  let hasNext = true;
  do {
    const json = JSON.stringify(t);
    const params = `?query_hash=${process.env.INSTAGRAM_QUERY_HASH}&variables=${encodeURIComponent(json)}`;
    const res = await axios.get<GraphqlResponce>("https://www.instagram.com/graphql/query/" + params);
    const medias = res.data.data.hashtag.edge_hashtag_to_media;
    hasNext = medias.page_info.has_next_page;
    t.after = medias.page_info.end_cursor;

    // 今回の処理の最新ID取得
    if (!latestId) {
      latestId = medias.edges[0].node.id;
    }

    for (const media of medias.edges.filter(e => !e.node.is_video)) {
      // 前回の処理の最新IDまで到達したら次ページを取得せずに終了
      if (media.node.id <= lastLatestId) {
        hasNext = false;
        break;
      }

      // ビデオはスキップ
      if (media.node.is_video) {
        continue;
      }
      const info = await analyzeImageUrl(media.node.display_url, media.node.dimensions.width);
      // 情報が取得できなければ対象の画像ではないのでスキップ
      if (!info) {
        continue;
      }
      const postInfo = info as PostDesignInfo;
      postInfo.imageUrl = media.node.display_url;
      postInfo.thumbUrl = media.node.thumbnail_src;
      postInfo.post = {
        contributor: await getOrCreateContributors({
          id: media.node.owner.id,
          platform: "Instagram",
        }),
        postId: media.node.shortcode,
        platform: "Instagram",
        fromSwitch: false,
      };
      postInfo.createdAt = Timestamp.fromDate(new Date(media.node.taken_at_timestamp * 1000));
      await designs.doc(postInfo.designId).set(postInfo);
      console.log(postInfo.title);
    }
  } while (hasNext);
  await mgtRef.update({ latestId });
}
