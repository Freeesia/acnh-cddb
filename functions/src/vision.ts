import { assertIsDefined } from "./assert";
import { intersect, toRect, Info, toRGBColor, Line } from "./utility";
import { ImageAnnotatorClient, protos } from "@google-cloud/vision";
import diff, { RGBColor } from "color-diff";
import convert from "color-convert";
import { red, pink, orange, yellow, green, blue, purple, brown, white, black } from "color-name";
import IImageContext = protos.google.cloud.vision.v1.IImageContext;
import IColor = protos.google.type.IColor;
import _ from "lodash";

const visionClient = new ImageAnnotatorClient();

const titleLine: Line = { x1: 400, y1: 140, x2: 800, y2: 140 };
const authorNameLine: Line = { x1: 150, y1: 450, x2: 400, y2: 450 };
const islandNameLine: Line = { x1: 150, y1: 500, x2: 400, y2: 500 };
const designTypeLine: Line = { x1: 900, y1: 500, x2: 1100, y2: 500 };
const authorIdPattern = /^MA-\d{4}-\d{4}-\d{4}$/;
const designIdPattern = /^MO-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/;

const backColor: RGBColor = { R: 243, G: 241, B: 226 };
const mainColors: RGBColor[] = [
  toRGBColor(red),
  toRGBColor(pink),
  toRGBColor(orange),
  toRGBColor(yellow),
  toRGBColor(green),
  toRGBColor(blue),
  toRGBColor(purple),
  toRGBColor(brown),
  toRGBColor(white),
  toRGBColor(black),
];

function toMainColor(color?: IColor | null): string {
  assertIsDefined(color);
  assertIsDefined(color.red);
  assertIsDefined(color.green);
  assertIsDefined(color.blue);
  const c = diff.closest({ R: color.red, G: color.green, B: color.blue }, mainColors, backColor);
  return convert.rgb.keyword([c.R, c.G, c.B]);
}

const dominantContext: IImageContext = {
  productSearchParams: {
    boundingPoly: {
      vertices: [
        { x: 997, y: 328 },
        { x: 1150, y: 328 },
        { x: 997, y: 482 },
        { x: 1150, y: 482 },
      ],
    },
  },
};

export async function analyzeImageUrl(url: string): Promise<Info> {
  let title = "";
  let authorName = "";
  let islandName = "";
  let designType = "";
  let authorId = "";
  let designId = "";
  let dominantColor = "";
  {
    const [res] = await visionClient.textDetection(url);
    const textAnnotations = res.textAnnotations;
    assertIsDefined(textAnnotations);
    for (const t of textAnnotations.slice(1)) {
      const r = toRect(t.boundingPoly?.vertices);
      if (intersect(r, titleLine)) {
        title += t.description;
      } else if (intersect(r, authorNameLine)) {
        authorName += t.description;
      } else if (intersect(r, islandNameLine)) {
        islandName += t.description;
      } else if (intersect(r, designTypeLine)) {
        designType += t.description;
      } else if (t.description && authorIdPattern.test(t.description)) {
        authorId = t.description;
      } else if (t.description && designIdPattern.test(t.description)) {
        designId = t.description;
      }
    }
  }
  {
    const [res] = await visionClient.imageProperties({
      image: {
        source: {
          imageUri: url,
        },
      },
      imageContext: dominantContext,
    } as any);
    const color = _(res.imagePropertiesAnnotation?.dominantColors?.colors ?? [])
      .filter(c => (c.score ?? 0) > 0.05)
      .orderBy(c => c.pixelFraction)
      .first();
    assertIsDefined(color);
    dominantColor = toMainColor(color.color);
  }
  return {
    url,
    title,
    designId,
    dominantColor,
    designType,
    authorName,
    authorId,
    islandName,
  };
}
