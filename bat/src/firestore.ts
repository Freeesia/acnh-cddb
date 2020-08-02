import { initializeApp, firestore } from "firebase-admin";

initializeApp();

export const db = firestore();
export const designsRef = db.collection("designs");
export const dreadmsRef = db.collection("dreams");
export const Timestamp = firestore.Timestamp;
export const DocRef = firestore.DocumentReference;
export async function getExcludeTags() {
  const common = await db.doc("management/common").get();
  return common.get("excludeTags") as string[];
}
