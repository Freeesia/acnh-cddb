import { db, designsRef } from "./firestore";
import Axios, { AxiosError } from "axios";
import { designsIndex } from "@core/algolia/init";
import { DesignInfo, Platforms } from "@core/models/types";
import { getDesigns } from "@core/algolia/get";
import _ from "lodash";
import { getTweets } from "./twitter";

export async function deleteDeadRef() {
  const designs = await getDesigns();
  const deleteIds: string[] = [];
  const group = _(designs)
    .groupBy(d => d.post.platform)
    .value();
  console.log("Instagramのデータチェック");
  for (const design of group[Platforms[0]]) {
    if (!(await checkUrl(design.imageUrls.thumb1 ?? design.imageUrls.thumb2))) {
      console.log(`Not Found : ${design.designId}`);
      deleteIds.push(design.designId);
    }
  }
  console.log("Twitterのデータチェック");
  for (const id of await checkDeletedTwitterIds(group[Platforms[1]])) {
    console.log(`Not Found : ${id}`);
    deleteIds.push(id);
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

async function checkUrl(url: string) {
  try {
    await Axios.get(url);
    return true;
  } catch (error) {
    const e = error as AxiosError;
    if (e?.response?.status === 404) {
      return false;
    }
    return true;
  }
}

async function checkDeletedTwitterIds(designs: DesignInfo[]) {
  const ids = _(designs)
    .map(d => d.post.postId)
    .uniq()
    .value();
  const tweets = await getTweets(ids);
  const existIds = tweets.map(t => t.id_str);
  return _(designs)
    .filter(d => !existIds.includes(d.post.postId))
    .map(d => d.designId)
    .value();
}
