import { db, designsRef } from "./firestore";
import _ from "lodash";
import { designsIndex } from "@core/algolia/init";
import { DesignInfo } from "@core/models/types";
import { analyzeImageUrl } from "./vision";
import { adjunstInfo } from "@core/algolia/post";

export default async function convertFirestore() {
  const docs = await designsRef.where("title", "==", "").where("post.platform", "==", "Twitter").get();
  const designs: DesignInfo[] = [];
  for (const doc of docs.docs) {
    const design = doc.data() as DesignInfo;
    const info = await analyzeImageUrl(design.imageUrls.large, 1280);
    design.title = info?.title ?? "";
    design.dominantColorTypes = info?.dominantColorTypes ?? [];
    design.dominantColors = info?.dominantColors ?? [];
    designs.push(design);
  }
  await designsIndex.saveObjects(designs.map(d => adjunstInfo(d)));
  for (const chunk of _(designs).chunk(500).value()) {
    const batch = db.batch();
    for (const design of chunk) {
      batch.update(designsRef.doc(design.designId), {
        title: design.title,
        dominantColorTypes: design.dominantColorTypes,
        dominantColors: design.dominantColors,
      });
    }
    await batch.commit();
  }
}
