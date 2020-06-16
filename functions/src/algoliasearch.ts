import { db } from "./firestore";
import algoliasearch from "algoliasearch";
import { assertIsDefined } from "./assert";

export async function batchAll() {
  const designsRef = db.collection("designs");
  const designs = await designsRef.get();
  const algoliaId = process.env.ALGOLIA_ID;
  const algoliaKey = process.env.ALGOLIA_KEY;
  assertIsDefined(algoliaId);
  assertIsDefined(algoliaKey);
  const client = algoliasearch(algoliaId, algoliaKey);
  const index = client.initIndex("designs");

  const data = designs.docs.map(doc => {
    const info = doc.data();
    const id = info.designId;
    delete info.designId;
    delete info.createdAt;
    delete info.imageUrl;
    delete info.thumbUrl;
    delete info.dominantColorTypes;
    delete info.dominantColors;
    delete info.post;
    info.objectID = id;
    return info;
  });

  await index.saveObjects(data, { autoGenerateObjectIDIfNotExist: false });
}
