import { analyzeImageUrl } from "./vision";
import { firestore, initializeApp } from "firebase-admin";
import axios, { AxiosError } from "axios";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const client = require("instagram-scraping");

initializeApp();

import Timestamp = firestore.Timestamp;
import { TweetUser, SearchResponse, PostDesignInfo } from "./types/types";
import { GraphqlResponce } from "./types/instagamTypes";

const db = firestore();
const contributors = db.collection("contributors");
const designs = db.collection("designs");

async function getOrCreateContributors(user: TweetUser) {
  const contributorRef = contributors.doc(user.id);
  await contributorRef.set(user, { merge: true });
  return contributorRef;
}

export async function searchPosts() {
  const t = {
    // eslint-disable-next-line @typescript-eslint/camelcase
    tag_name: "マイデザイン配布",
    first: 12, // 謎
  } as any;
  let hasNext = true;
  let total = 0;
  do {
    const json = JSON.stringify(t);
    const params = `?query_hash=${process.env.INSTAGRAM_QUERY_HASH}&variables=${encodeURIComponent(json)}`;
    const res = await axios.get<GraphqlResponce>("https://www.instagram.com/graphql/query/" + params);
    const medias = res.data.data.hashtag.edge_hashtag_to_media;
    hasNext = medias.page_info.has_next_page;
    t.after = medias.page_info.end_cursor;
    total += medias.edges.length;
    console.log(`count: ${medias.count}`);
    console.log(`total count: ${total}`);
    for (const media of medias.edges) {
      const date = new Date(media.node.taken_at_timestamp * 1000).toLocaleString("ja-JP");
      console.log(`https://www.instagram.com/p/${media.node.shortcode}/ , date: ${date}`);
    }
  } while (hasNext);
}
