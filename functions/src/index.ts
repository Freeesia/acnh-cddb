import { https } from "firebase-functions";
import { ImageAnnotatorClient } from "@google-cloud/vision";
import { assertIsDefined } from "./assert";

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

async function analyzeImageUrl(url: string) {
  const client = new ImageAnnotatorClient();
  const [res] = await client.textDetection("https://pbs.twimg.com/media/EXuQTz5UwAE-LiI?format=jpg");
  const textAnnotations = res.textAnnotations;
  assertIsDefined(textAnnotations);
  for (const t of textAnnotations.slice(1)) {
    console.log(t);
  }
}

export const helloWorld = https.onRequest((request, response) => {
  // analyzeImageUrl("");
  response.send("Hello from Firebase!");
});
