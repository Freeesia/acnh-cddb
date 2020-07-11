import { db, designsRef } from "./firestore";
import Axios, { AxiosError } from "axios";
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
      const e = error as AxiosError;
      if (e?.response?.status === 404) {
        console.log(`Not Found : ${id}`);
        deleteIds.push(id);
      }
    }
  }
  if (deleteIds.length > 20) {
    console.log("数が多いので障害の懸念があるため見送ります");
    return;
  }
  await designsIndex.deleteObjects(deleteIds);
  const batch = db.batch();
  for (const id of deleteIds) {
    batch.delete(designsRef.doc(id));
  }
  await batch.commit();
}
