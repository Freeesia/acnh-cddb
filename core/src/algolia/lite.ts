import algoliasearch from "algoliasearch/lite";
const algoliaId = process.env.VUE_APP_ALGOLIA_ID ?? process.env.ALGOLIA_ID ?? "";
const algoliaKey = process.env.VUE_APP_ALGOLIA_KEY ?? process.env.ALGOLIA_KEY ?? "";
export const algoliaClient = algoliasearch(algoliaId, algoliaKey);
export const designsIndex = algoliaClient.initIndex("designs");
export const dreamsIndex = algoliaClient.initIndex("dreams");
