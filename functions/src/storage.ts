import { storage } from "firebase-admin";
import { assertIsString } from "../../core/src/utilities/assert";
import { sleep } from "../../core/src/utilities/systemUtility";

const bucket = storage().bucket();

function getFirebaseUrl(bucket: string, path: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
}

export async function createFirebaseUrl(path: string) {
  const file = bucket.file(path);
  let [exist] = await file.exists();
  while (!exist) {
    await sleep(500);
    [exist] = await file.exists();
  }
  const [metadata] = await file.getMetadata();
  const token = metadata?.metadata?.firebaseStorageDownloadTokens as string;
  assertIsString(token, "token");
  return getFirebaseUrl(bucket.name, path, token);
}
