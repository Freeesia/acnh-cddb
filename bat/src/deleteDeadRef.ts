import { db, designsRef } from "./firestore";
import Axios from "axios";
import { designsIndex } from "@core/algolia/init";
import { DesignInfo } from "@core/models/types";

export async function deleteDeadRef() {
  const deleteIds: string[] = [];
  await designsIndex.browseObjects<DesignInfo>({
    query: "",
    batch: async batch => {
      for (const item of batch) {
        let url = item.imageUrls.thumb1;
        if (!url) {
          url = item.imageUrls.thumb2;
        }
        try {
          await Axios.get(url);
        } catch (error) {
          deleteIds.push(item.objectID);
        }
      }
    },
  });
  // 削除されたデータが見つかったら残りの処理対応する
  console.log(deleteIds);
  // たぶん動く
  // designsIndex.deleteObjects(deleteIds);
  // const batch = db.batch();
  // for (const id of deleteIds) {
  //   batch.delete(designsRef.doc(id));
  // }
  // await batch.commit();
}
