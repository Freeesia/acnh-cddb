import { auth } from "firebase-functions";
import { initializeApp, firestore } from "firebase-admin";
initializeApp();

const db = firestore();
const users = db.collection("users");

export const initUser = auth.user().onCreate(async user => {
  await users.doc(user.uid).create({
    favs: [],
  });
});

export const deleteUser = auth.user().onDelete(async user => {
  await users.doc(user.uid).delete();
});
