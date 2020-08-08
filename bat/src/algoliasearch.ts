import { designsRef, getExcludeTags, db } from "./firestore";
import { DesignInfo } from "@core/models/types";
import { designsIndex } from "@core/algolia/init";
import { adjunstInfo } from "@core/algolia/post";
import { getDesigns } from "@core/algolia/get";
import { includePartRegex } from "@core/utilities/systemUtility";

export async function batchAll() {
  const designs = await designsRef.get();
  const data = designs.docs.map(doc => adjunstInfo(doc.data() as DesignInfo));
  await designsIndex.saveObjects(data, { autoGenerateObjectIDIfNotExist: false });
}

export async function refreshTags() {
  const excludeTags = includePartRegex(await getExcludeTags());
  const designs = await getDesigns();
  const needUpdates: DesignInfo[] = [];
  for (const design of designs.filter(d => d.post.platform === "Twitter")) {
    const length = design.tags.length;
    design.tags = design.tags?.filter(t => !excludeTags.test(t)) ?? [];
    if (length !== design.tags.length) {
      needUpdates.push(design);
      console.log(design.title + ":" + design.tags.join(","));
    }
  }
  await designsIndex.saveObjects(needUpdates, { autoGenerateObjectIDIfNotExist: false });
  const batch = db.batch();
  for (const up of needUpdates) {
    batch.update(designsRef.doc(up.designId), "tags", up.tags);
  }
  await batch.commit();
}
