import { db, designsRef, getExcludeTags } from "./firestore";
import { getTweets } from "./twitter";
import _ from "lodash";
import fs from "fs";
import { Tweet } from "@core/models/twitterTypes";
import { includePartRegex } from "./utility";

export default async function convertFirestore() {
  const idsRef = designsRef.where("post.platform", "==", "Twitter").select("post.postId");
  const docs = await idsRef.get();
  const ids = _(docs.docs)
    .map(d => ({ id: d.id, postId: d.get("post.postId") as string }))
    .keyBy(d => d.id)
    .mapValues(d => d.postId)
    .value();
  // fs.writeFileSync("./ids.json", JSON.stringify(ids));
  const tweets = _(await getTweets(_(ids).values().uniq().value()))
    .keyBy(t => t.id_str)
    .value();
  // fs.writeFileSync("./tweets.json", JSON.stringify(tweets));
  // const ids = JSON.parse(fs.readFileSync("./ids.json", { encoding: "utf8" })) as { [id: string]: string };
  // const tweets = JSON.parse(fs.readFileSync("./tweets.json", { encoding: "utf8" })) as { [id: string]: Tweet };
  const excludeTags = includePartRegex(await getExcludeTags());
  for (const chunk of _(ids).keys().chunk(500).value()) {
    const batch = db.batch();
    for (const id of chunk) {
      const postId = ids[id];
      const tweet = tweets[postId];
      if (tweet) {
        const tags = _(tweet.entities.hashtags)
          .map(h => h.text)
          .filter(h => !excludeTags.test(h))
          .value();
        batch.update(designsRef.doc(id), "tags", tags);
      }
    }
    await batch.commit();
  }
}
