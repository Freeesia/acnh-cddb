import { designsRef } from "./firestore";
import { DesignInfo } from "@core/models/types";
import { adjunstInfo, designsIndex } from "@core/utilities/algolia";

export async function batchAll() {
  const designs = await designsRef.get();
  const data = designs.docs.map(doc => adjunstInfo(doc.data() as DesignInfo));
  await designsIndex.saveObjects(data, { autoGenerateObjectIDIfNotExist: false });
}
