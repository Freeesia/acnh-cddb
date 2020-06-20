import { initializeApp, firestore } from "firebase-admin";

initializeApp();

export const db = firestore();
export const designsRef = db.collection("designs");
export const Timestamp = firestore.Timestamp;
export const DocRef = firestore.DocumentReference;
