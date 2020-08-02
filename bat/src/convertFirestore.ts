import { db, dreadmsRef } from "./firestore";
import _ from "lodash";

export default async function convertFirestore() {
  const docs = await db.collection("doreams").get();
  for (const chunk of _(docs.docs).chunk(500).value()) {
    const batch = db.batch();
    for (const doc of chunk) {
      batch.create(dreadmsRef.doc(doc.id), doc.data());
    }
    await batch.commit();
  }
}
