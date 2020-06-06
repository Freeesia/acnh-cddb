import { firestore, initializeApp } from "firebase-admin";

initializeApp();

export default async function convertFirestore() {
  const db = firestore();
  const designRef = db.collection("designs");
  const ss = await designRef.get();
  for (const doc of ss.docs) {
    const data = doc.data();
    const imageUrl = (data.imageUrl as string).replace("?name=large", "");
    console.log(imageUrl);
    await doc.ref.update({ imageUrl });
  }
}
