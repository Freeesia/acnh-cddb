import { initializeApp, firestore } from "firebase-admin";

initializeApp();

export const db = firestore();
export const Timestamp = firestore.Timestamp;
export const DocRef = firestore.DocumentReference;
