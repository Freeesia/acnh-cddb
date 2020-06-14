import { firestore, initializeApp } from "firebase-admin";

const path = "post.platform";

initializeApp();

export default async function convertFirestore() {
  const db = firestore();
  const designsRef = db.collection("designs");
  const designs = await designsRef.get();
  for (const doc of designs.docs) {
    const platform = doc.get(path);
    if (!platform) {
      await doc.ref.update(path, "Twitter");
    }
  }
}
