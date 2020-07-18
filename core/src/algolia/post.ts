import { DesignInfo, Timestamp } from "../models/types";
import _ from "lodash";
import { SearchIndex } from "algoliasearch";

export function adjunstInfo(info: DesignInfo) {
  const data = _.cloneDeep(info) as any;
  const id = info.designId;
  data.createdAt = (info.createdAt as Timestamp).seconds;
  delete data.imageUrl;
  delete data.thumbUrl;
  delete data.dominantColors;
  delete data.post.contributor;
  delete data.post.fromSwitch;
  data.objectID = id;
  return data;
}

export async function postAlgolia(index: SearchIndex, info: DesignInfo) {
  const data = adjunstInfo(info);
  await index.saveObject(data, { autoGenerateObjectIDIfNotExist: false });
}
