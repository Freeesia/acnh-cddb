import { assertIsDefined } from "../../core/src/utilities/assert";
import algoliasearch from "algoliasearch";
import { postAlgolia } from "../../core/src/algolia/post";
import { DesignInfo } from "../../core/src/models/types";
import { config } from "firebase-functions";

export function initAlgolia() {
  const algoliaConfig = config().algolia;
  assertIsDefined(algoliaConfig);
  const algoliaId = algoliaConfig.id;
  const algoliaKey = algoliaConfig.key;
  assertIsDefined(algoliaId);
  assertIsDefined(algoliaKey);
  const algoliaClient = algoliasearch(algoliaId, algoliaKey);
  return algoliaClient.initIndex("designs");
}

export async function postDesignInfoToAlgolia(copy: DesignInfo) {
  const designsIndex = initAlgolia();
  await postAlgolia(designsIndex, copy);
}
