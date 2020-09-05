import { Contributor } from "../../core/src/models/types";
import { firestore, initializeApp } from "firebase-admin";
import DocumentReference = firestore.DocumentReference;

initializeApp();

const db = firestore();
export const users = db.collection("users");
export const designs = db.collection("designs");
export const dreams = db.collection("dreams");
const contributors = db.collection("contributors");
export const dreamLists = db.collection("dreamLists");

export async function getOrCreateContributorRef(user: Contributor) {
  const contributorRef = contributors.doc(`${user.platform}:${user.id}`);
  await contributorRef.set(user, { merge: true });
  return contributorRef as DocumentReference<Contributor>;
}

export async function getExcludeTags() {
  const common = await db.doc("management/common").get();
  return common.get("excludeTags") as string[];
}
