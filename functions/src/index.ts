import { https } from "firebase-functions";
import { initializeApp } from "firebase-admin";
import { HttpsError } from "firebase-functions/lib/providers/https";
import { searchTweet } from "./twitter";
import { analyzeImageUrl } from "./vision";
import { Info } from "./utility";
initializeApp();

export const helloWorld = https.onRequest(async (request, response) => {
  await searchTweet();
  const urls = request.body as string[];
  if (!urls) {
    throw new HttpsError("invalid-argument", "require body is array of string.");
  }
  const infos: Info[] = [];
  for (const url of urls) {
    infos.push(await analyzeImageUrl(url));
  }
  response.send(infos);
});
