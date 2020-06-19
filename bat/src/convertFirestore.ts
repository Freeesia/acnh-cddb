import { firestore, initializeApp } from "firebase-admin";

initializeApp();

export default async function convertFirestore() {
  const db = firestore();
  const designsRef = db.collection("designs").where("post.platform", "==", "Instagram");
  const designs = await designsRef.get();
  for (const doc of designs.docs) {
    const imageUrl = doc.get("imageUrl") as string;
    const thumbUrl = doc.get("thumbUrl") as string;
    await doc.ref.set(
      {
        imageUrls: {
          thumb2: thumbUrl,
          large: imageUrl,
        },
      },
      { merge: true }
    );
  }
}
