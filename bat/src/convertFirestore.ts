import { firestore, initializeApp } from "firebase-admin";

initializeApp();

export default async function convertFirestore() {
  const db = firestore();
  const users = (await db.collection("users").get()).docs;
  const contributorsRef = db.collection("contributors");
  for (const doc of users) {
    await contributorsRef.doc(doc.id).create(doc.data());
  }
}
