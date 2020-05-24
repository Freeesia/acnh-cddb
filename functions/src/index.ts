import { https } from "firebase-functions";
import { initializeApp } from "firebase-admin";
import { ImageAnnotatorClient, protos } from "@google-cloud/vision";
import { assertIsDefined } from "./assert";
import { boxLine } from "intersects";
import _ from "lodash";
import IVertex = protos.google.cloud.vision.v1.IVertex;
import { HttpsError } from "firebase-functions/lib/providers/https";
initializeApp();
const client = new ImageAnnotatorClient();

const titleLine = { x1: 400, y1: 140, x2: 800, y2: 140 };
const authorNameLine = { x1: 150, y1: 450, x2: 400, y2: 450 };
const islandNameLine = { x1: 150, y1: 500, x2: 400, y2: 500 };
const designTypeLine = { x1: 900, y1: 500, x2: 1100, y2: 500 };
const authorIdPattern = /^MA-\d{4}-\d{4}-\d{4}$/;
const designIdPattern = /^MO-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/;

interface info {
  url: string;
  title: string;
  designId: string;
  designType: string;
  authorName: string;
  authorId: string;
  islandName: string;
}

interface rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function toRect(vertices?: IVertex[] | null): rect {
  assertIsDefined(vertices);
  const left = _(vertices)
    .map((v) => v.x)
    .min();
  const right = _(vertices)
    .map((v) => v.x)
    .max();
  const top = _(vertices)
    .map((v) => v.y)
    .min();
  const bottom = _(vertices)
    .map((v) => v.y)
    .max();
  assertIsDefined(left);
  assertIsDefined(right);
  assertIsDefined(top);
  assertIsDefined(bottom);
  return {
    x: left,
    y: top,
    w: right - left,
    h: bottom - top,
  };
}

async function analyzeImageUrl(url: string): Promise<info> {
  const [res] = await client.textDetection(url);
  const textAnnotations = res.textAnnotations;
  assertIsDefined(textAnnotations);
  let title = "";
  let authorName = "";
  let islandName = "";
  let designType = "";
  let authorId = "";
  let designId = "";
  for (const t of textAnnotations.slice(1)) {
    const { x, y, w, h } = toRect(t.boundingPoly?.vertices);
    if (boxLine(x, y, w, h, titleLine.x1, titleLine.y1, titleLine.x2, titleLine.y2)) {
      title += t.description;
    } else if (boxLine(x, y, w, h, authorNameLine.x1, authorNameLine.y1, authorNameLine.x2, authorNameLine.y2)) {
      authorName += t.description;
    } else if (boxLine(x, y, w, h, islandNameLine.x1, islandNameLine.y1, islandNameLine.x2, islandNameLine.y2)) {
      islandName += t.description;
    } else if (boxLine(x, y, w, h, designTypeLine.x1, designTypeLine.y1, designTypeLine.x2, designTypeLine.y2)) {
      designType += t.description;
    } else if (t.description && authorIdPattern.test(t.description)) {
      authorId = t.description;
    } else if (t.description && designIdPattern.test(t.description)) {
      designId = t.description;
    }
  }
  return {
    url,
    title,
    designId,
    designType,
    authorName,
    authorId,
    islandName,
  };
}

export const helloWorld = https.onRequest(async (request, response) => {
  const urls = request.body as string[];
  if (!urls) {
    throw new HttpsError("invalid-argument", "require body is array of string.");
  }
  const infos: info[] = [];
  for (const url of urls) {
    const info = await analyzeImageUrl(url);
    infos.push(info);
  }
  response.send(infos);
});
