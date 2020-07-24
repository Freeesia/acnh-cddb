import { db, designsRef, getExcludeTags } from "./firestore";
import { getTweets, getPlainText } from "./twitter";
import _ from "lodash";
import fs from "fs";
import { Tweet } from "@core/models/twitterTypes";
import { includePartRegex } from "./utility";
import { getDesigns } from "@core/algolia/get";
import { designsIndex } from "@core/algolia/init";

export default async function convertFirestore() {
  const designs = (await getDesigns()).filter(d => d.post.platform === "Twitter");
  const ids = _(designs)
    .map(d => d.post.postId)
    .uniq()
    .value();
  // const tweets = _(await getTweets(ids))
  //   .keyBy(t => t.id_str)
  //   .value();
  // fs.writeFileSync("./tweets.json", JSON.stringify(tweets));
  const tweets = JSON.parse(fs.readFileSync("./tweets.json", { encoding: "utf8" })) as { [id: string]: Tweet };
  for (const design of designs) {
    const tweet = tweets[design.post.postId];
    if (tweet) {
      design.post.text = getPlainText(tweet.full_text);
    }
  }
  await designsIndex.saveObjects(designs);
  for (const chunk of _(designs).chunk(500).value()) {
    const batch = db.batch();
    for (const design of chunk) {
      if (design.post.text) {
        batch.update(designsRef.doc(design.designId), "post.text", design.post.text);
      }
    }
    await batch.commit();
  }
}
