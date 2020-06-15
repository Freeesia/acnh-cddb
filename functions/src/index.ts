import { https } from "firebase-functions";
import { initializeApp } from "firebase-admin";
import { HttpsError } from "firebase-functions/lib/providers/https";
import { searchTweets } from "./twitter";
initializeApp();

export const helloWorld = https.onRequest(async request => {
  await searchTweets();
  const urls = request.body as string[];
  if (!urls) {
    throw new HttpsError("invalid-argument", "require body is array of string.");
  }
});
