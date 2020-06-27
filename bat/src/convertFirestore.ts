import { firestore, initializeApp } from "firebase-admin";
import DocRef = firestore.DocumentReference;
import { Contributor } from "@core/models/types";

initializeApp();

export default async function convertFirestore() {
  const db = firestore();
  const contributorsRef = db.collection("contributors");
  const designsRef = db.collection("designs").where("post.platform", "==", "Twitter");
  const designs = await designsRef.get();
  for (const doc of designs.docs) {
    const oldConRef = doc.get("post.contributor") as DocRef;
    if (oldConRef.id.startsWith("Twitter")) {
      continue;
    }
    const conDoc = await oldConRef.get();
    if (conDoc.exists) {
      const contributor = conDoc.data() as Contributor;
      contributor.platform = "Twitter";
      const newConRef = contributorsRef.doc(`${contributor.platform}:${contributor.id}`);
      await newConRef.set(contributor);
      await oldConRef.delete();
      await doc.ref.update("post.contributor", newConRef);
    } else {
      const newConRef = contributorsRef.doc(`Twitter:${conDoc.id}`);
      await doc.ref.update("post.contributor", newConRef);
    }
  }
}
