import algoliasearch from "algoliasearch";
import { assertIsDefined } from "./assert";

const algoliaId = process.env.VUE_APP_ALGOLIA_ID;
const algoliaKey = process.env.VUE_APP_ALGOLIA_KEY;
assertIsDefined(algoliaId);
assertIsDefined(algoliaKey);
const algoliaClient = algoliasearch(algoliaId, algoliaKey);
export const designsIndex = algoliaClient.initIndex("designs");
