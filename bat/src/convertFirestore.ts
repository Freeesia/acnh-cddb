import { firestore, initializeApp } from "firebase-admin";

initializeApp();

export default async function convertFirestore() {
  const db = firestore();
  const designsRef = db.collection("designs").where("post.platform", "==", "Twitter");
  const designs = await designsRef.get();
  for (const doc of designs.docs) {
    const imageUrl = doc.get("imageUrl") as string;
    await doc.ref.set(
      {
        imageUrls: {
          thumb1: imageUrl + "?name=thumb",
          thumb2: imageUrl + "?name=small",
          large: imageUrl + "?name=large",
        },
      },
      { merge: true }
    );
  }
}
