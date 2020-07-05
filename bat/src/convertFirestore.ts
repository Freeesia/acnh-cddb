import { firestore, initializeApp } from "firebase-admin";

initializeApp();

export default async function convertFirestore() {
  const db = firestore();
  const usersRef = db.collection("users");
  const userRefs = await usersRef.listDocuments();
  for (const docRef of userRefs) {
    await docRef.set(
      {
        downloaded: [],
      },
      { merge: true }
    );
  }
}
