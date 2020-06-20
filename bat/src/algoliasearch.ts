import { designsRef } from "./firestore";
import { DesignInfo } from "@core/models/types";
import { designsIndex } from "@core/algolia/init";
import { adjunstInfo } from "@core/algolia/post";

export async function batchAll() {
  const designs = await designsRef.get();
  const data = designs.docs.map(doc => adjunstInfo(doc.data() as DesignInfo));
  await designsIndex.saveObjects(data, { autoGenerateObjectIDIfNotExist: false });
}
