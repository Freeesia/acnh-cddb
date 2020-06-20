import { designsRef } from "./firestore";
import algoliasearch from "algoliasearch";
import { assertIsDefined } from "@core/utilities/assert";
import { DesignInfo } from "@core/models/types";
import { Timestamp } from "@google-cloud/firestore";
import _ from "lodash";
const algoliaId = process.env.ALGOLIA_ID;
const algoliaKey = process.env.ALGOLIA_KEY;
assertIsDefined(algoliaId);
assertIsDefined(algoliaKey);
const client = algoliasearch(algoliaId, algoliaKey);
const index = client.initIndex("designs");

function adjunstInfo(info: DesignInfo) {
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

export async function batchAll() {
  const designs = await designsRef.get();

  const data = designs.docs.map(doc => adjunstInfo(doc.data() as DesignInfo));

  await index.saveObjects(data, { autoGenerateObjectIDIfNotExist: false });
}

export async function postAlgolia(info: DesignInfo) {
  const data = adjunstInfo(info);
  await index.saveObject(data, { autoGenerateObjectIDIfNotExist: false });
}
