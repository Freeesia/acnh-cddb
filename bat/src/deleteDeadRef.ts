import { db, designsRef } from "./firestore";
import Axios from "axios";
import { designsIndex } from "@core/algolia/init";
import { DesignInfo } from "@core/models/types";

export async function deleteDeadRef() {
  const items: { id: string; url: string }[] = [];
  await designsIndex.browseObjects<DesignInfo>({
    query: "",
    batch: batch => {
      for (const item of batch) {
        let url = item.imageUrls.thumb1;
        if (!url) {
          url = item.imageUrls.thumb2;
        }
        items.push({ id: item.objectID, url });
      }
    },
  });
  const deleteIds: string[] = [];
  for (const { id, url } of items) {
    try {
      await Axios.get(url);
    } catch (error) {
      deleteIds.push(id);
    }
  }
  console.log(deleteIds);
  // もうちょっと様子見
  // await designsIndex.deleteObjects(deleteIds);
  // const batch = db.batch();
  // for (const id of deleteIds) {
  //   batch.delete(designsRef.doc(id));
  // }
  // await batch.commit();
}
