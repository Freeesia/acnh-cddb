import { firestore, initializeApp } from "firebase-admin";
import DocRef = firestore.DocumentReference;
import { Contributor } from "@core/models/types";

initializeApp();

export default async function convertFirestore() {
  const db = firestore();
  const contributorsRef = db.collection("contributors");
  const contributors = await contributorsRef.listDocuments();
  for (const docRef of contributors) {
    if (docRef.id.includes(":")) {
      continue;
    }
    const doc = await docRef.get();
    const contributor = doc.data() as Contributor;
    contributor.platform = "Twitter";
    await docRef.delete();
    await contributorsRef.doc(`${contributor.platform}:${contributor.id}`).set(contributor);
  }
}
