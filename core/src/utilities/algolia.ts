import algoliasearch from "algoliasearch";
import { DesignInfo } from "../models/types";
import { Timestamp } from "@google-cloud/firestore";
import _ from "lodash";
const algoliaId = process.env.VUE_APP_ALGOLIA_ID ?? process.env.ALGOLIA_ID ?? "";
const algoliaKey = process.env.VUE_APP_ALGOLIA_KEY ?? process.env.ALGOLIA_KEY ?? "";
const algoliaClient = algoliasearch(algoliaId, algoliaKey);
export const designsIndex = algoliaClient.initIndex("designs");

export function adjunstInfo(info: DesignInfo) {
  const data = _.cloneDeep(info) as any;
  const id = info.designId;
  data.createdAt = (info.createdAt as Timestamp).seconds;
  delete data.imageUrl;
  delete data.thumbUrl;
  delete data.dominantColors;
  delete data.post.contributor;
  delete data.post.fromSwitch;
  delete data.post.postId;
  data.objectID = id;
  return data;
}

export async function postAlgolia(info: DesignInfo) {
  const data = adjunstInfo(info);
  await designsIndex.saveObject(data, { autoGenerateObjectIDIfNotExist: false });
}
