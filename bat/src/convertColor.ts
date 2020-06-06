import { firestore, initializeApp } from "firebase-admin";

initializeApp();

export default async function convertColor() {
  const db = firestore();
  const designRef = db.collection("designs");
  const ss = await designRef.get();
  for (const doc of ss.docs) {
    const data = doc.data();
    const colors = data.dominantColors as any[];

    await doc.ref.update({
      dominantColorTypes: colors.map(c => c.type),
      dominantColors: colors.map(c => c.hex),
    });
    console.log(doc.id);
  }
}
