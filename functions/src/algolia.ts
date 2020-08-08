import { assertIsDefined } from "../../core/src/utilities/assert";
import algoliasearch from "algoliasearch";
import { postAlgolia, postDreamAlgolia } from "../../core/src/algolia/post";
import { DesignInfo, DreamInfo } from "../../core/src/models/types";
import { config } from "firebase-functions";

export function initAlgolia() {
  const algoliaConfig = config().algolia;
  assertIsDefined(algoliaConfig);
  const algoliaId = algoliaConfig.id;
  const algoliaKey = algoliaConfig.key;
  assertIsDefined(algoliaId);
  assertIsDefined(algoliaKey);
  return algoliasearch(algoliaId, algoliaKey);
}

export function getDesignIndex() {
  const client = initAlgolia();
  return client.initIndex("designs");
}

export function getDreamIndex() {
  const client = initAlgolia();
  return client.initIndex("dreams");
}

export async function postDesignInfoToAlgolia(copy: DesignInfo) {
  const designsIndex = getDesignIndex();
  await postAlgolia(designsIndex, copy);
}

export async function postDreamInfoToAlgolia(data: DreamInfo) {
  const index = getDreamIndex();
  await postDreamAlgolia(index, data);
}
