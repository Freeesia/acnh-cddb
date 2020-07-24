import { Contributor } from "../../core/src/models/types";
import { firestore, initializeApp } from "firebase-admin";
import DocumentReference = firestore.DocumentReference;

initializeApp();

const db = firestore();
export const users = db.collection("users");
export const designs = db.collection("designs");
const contributors = db.collection("contributors");

export async function getOrCreateContributorRef(user: Contributor) {
  const contributorRef = contributors.doc(`${user.platform}:${user.id}`);
  await contributorRef.set(user, { merge: true });
  return contributorRef as DocumentReference<Contributor>;
}
