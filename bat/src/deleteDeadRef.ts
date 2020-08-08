import { db, designsRef, dreamsRef } from "./firestore";
import Axios, { AxiosError } from "axios";
import { designsIndex, dreamsIndex } from "@core/algolia/init";
import { DesignInfo, Platforms, DreamInfo } from "@core/models/types";
import { getDesigns, getDreams } from "@core/algolia/get";
import _ from "lodash";
import { getTweets } from "./twitter";

export async function deleteDeadDesignRef() {
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
  for (const id of await checkDeletedDesignIds(group[Platforms[1]])) {
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

async function checkDeletedDesignIds(designs: DesignInfo[]) {
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

export async function deleteDeadDreamRef() {
  const dreams = await getDreams();
  const deleteIds: string[] = [];
  const group = _(dreams)
    .groupBy(d => d.post.platform)
    .value();
  console.log("Twitterのデータチェック");
  for (const id of await checkDeletedDreamIds(group[Platforms[1]])) {
    console.log(`Not Found : ${id}`);
    deleteIds.push(id);
  }
  if (deleteIds.length > 20) {
    console.log("数が多いので障害の懸念があるため見送ります");
    return;
  }
  await dreamsIndex.deleteObjects(deleteIds);
  const batch = db.batch();
  for (const id of deleteIds) {
    batch.delete(dreamsRef.doc(id));
  }
  await batch.commit();
}

async function checkDeletedDreamIds(dreams: DreamInfo[]) {
  const ids = _(dreams)
    .map(d => d.post.postId)
    .uniq()
    .value();
  const tweets = await getTweets(ids);
  const existIds = tweets.map(t => t.id_str);
  return _(dreams)
    .filter(d => !existIds.includes(d.post.postId))
    .map(d => d.dreamId)
    .value();
}
