import { db, dreamsRef, getExcludeTags } from "./firestore";
import _ from "lodash";
import { getDreams } from "@core/algolia/get";
import { dreamsIndex } from "@core/algolia/init";
import fs from "fs";
import { includePartRegex } from "@core/utilities/systemUtility";

export default async function convertFirestore() {
  const dreams = await getDreams();
  const excludeTags = includePartRegex(await getExcludeTags());
  for (const dream of dreams) {
    dream.tags = dream.tags.filter(h => !excludeTags.test(h));
    const name = dream.tags.find(t => t.endsWith("島"));
    if (name) {
      dream.islandName = dream.islandName || name;
      dream.tags = dream.tags.filter(t => t !== name);
    }
  }
  fs.writeFileSync("./dream.json", JSON.stringify(dreams));
  await dreamsIndex.clearObjects();
  await dreamsIndex.saveObjects(dreams, { autoGenerateObjectIDIfNotExist: false });
  for (const chunk of _(dreams).chunk(500).value()) {
    const batch = db.batch();
    for (const dream of chunk) {
      batch.update(dreamsRef.doc(dream.dreamId), {
        islandName: dream.islandName,
        tags: dream.tags,
      });
    }
    await batch.commit();
  }
}
