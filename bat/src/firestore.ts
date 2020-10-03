import { TweetUser } from "@core/models/twitterTypes";
import { Contributor } from "@core/models/types";
import { includePartRegex } from "@core/utilities/systemUtility";
import { initializeApp, firestore } from "firebase-admin";
import { DocumentReference } from "@google-cloud/firestore";

initializeApp();

export const db = firestore();
export const designsRef = db.collection("designs");
export const dreamsRef = db.collection("dreams");
export const Timestamp = firestore.Timestamp;
export const DocRef = firestore.DocumentReference;
export const twitterMgrRef = db.doc("management/twitter");
export async function getExcludeTags() {
  const common = await db.doc("management/common").get();
  return common.get("excludeTags") as string[];
}
export async function getExcludeContributors() {
  const doc = await twitterMgrRef.get();
  return doc.get("excludeContributors") as string[];
}
export async function getLowContributors() {
  const doc = await twitterMgrRef.get();
  return doc.get("lowContributors") as string[];
}
export async function getTwitterLatestId() {
  const doc = await twitterMgrRef.get();
  return doc.get("latestId") as string;
}
export async function getExcludeTagRegex() {
  return includePartRegex(await getExcludeTags());
}

export async function getOrCreateContributors(user: TweetUser) {
  const contributors = db.collection("contributors");
  const contributorRef = contributors.doc(`${user.platform}:${user.id}`);
  await contributorRef.set(user, { merge: true });
  return contributorRef as DocumentReference<Contributor>;
}
