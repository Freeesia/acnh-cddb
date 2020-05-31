import { assertIsDefined } from "./assert";
import { intersect, toRect, toRGBColor, Line } from "./utility";
import { ImageAnnotatorClient, protos } from "@google-cloud/vision";
import diff, { RGBColor } from "color-diff";
import convert from "color-convert";
import { red, pink, orange, yellow, green, blue, purple, brown, white, black } from "color-name";
import IImageContext = protos.google.cloud.vision.v1.IImageContext;
import IColor = protos.google.type.IColor;
import _ from "lodash";
import "./lodash.extensions";

const visionClient = new ImageAnnotatorClient();

// 幅1280換算
const titleLine: Line = { x1: 400, y1: 156, x2: 880, y2: 156 };
const authorNameLine: Line = { x1: 150, y1: 490, x2: 400, y2: 490 };
const islandNameLine: Line = { x1: 150, y1: 535, x2: 400, y2: 535 };
const designTypeLine: Line = { x1: 940, y1: 535, x2: 1200, y2: 535 };
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

function toColorType(color: RGBColor): ColorType {
  const c = diff.closest(color, mainColors, backColor);
  if (c === backColor) {
    return "transparent";
  }
  return convert.rgb.keyword([c.R, c.G, c.B]) as ColorType;
}

function toDominantColor(c?: IColor | null): DominantColor {
  const color = toRGBColor([c?.red ?? 0, c?.green ?? 0, c?.blue ?? 0]);
  return { hex: convert.rgb.hex([color.R, color.G, color.B]), type: toColorType(color) };
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

export async function analyzeImageUrl(url: string): Promise<Info | null> {
  let title = "";
  let authorName = "";
  let islandName = "";
  let designType: DesignType | null = null;
  let authorId = "";
  let designId = "";
  const dominantColors: DominantColor[] = [];
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
        designType = t.description as DesignType;
      } else if (t.description && authorIdPattern.test(t.description)) {
        authorId = t.description;
      } else if (t.description && designIdPattern.test(t.description)) {
        designId = t.description;
      }
    }
    if (!designId || !designType) {
      return null;
    }
  }
  {
    const [res] = await visionClient.imageProperties({
      image: { source: { imageUri: url } },
      imageContext: dominantContext,
    } as any);
    if (res.error) {
      console.error("[imageProperties]" + res.error.message ?? "unkown error");
      return null;
    }
    let colors = _(res.imagePropertiesAnnotation?.dominantColors?.colors ?? [])
      .orderBy(c => c.score, "desc")
      .filterApproximateColor()
      .map<DominantColor>(c => toDominantColor(c.color));
    if (designType !== "マイデザイン") {
      colors = colors.filter(c => c.type !== "transparent");
    }
    dominantColors.push(...colors.take(2).value());
  }
  return {
    url,
    title,
    designId,
    dominantColors,
    designType: designType as DesignType,
    authorName,
    authorId,
    islandName,
  };
}

export interface Info {
  url: string;
  title: string;
  designId: string;
  dominantColors: DominantColor[];
  designType: DesignType;
  authorName: string;
  authorId: string;
  islandName: string;
}

export type DesignType =
  | "マイデザイン"
  | "タンクトップ"
  | "はんそでTシャツ"
  | "ながそでYシャツ"
  | "セーター"
  | "パーカー"
  | "コート"
  | "そでなしワンピース"
  | "はんそでワンピース"
  | "ながそでドレス"
  | "まるがたワンピース"
  | "バルーンワンピース"
  | "ローブ"
  | "つばつきキャップ"
  | "ニットキャップ"
  | "つばつきハット";

export interface DominantColor {
  hex: string;
  type: ColorType;
}

export type ColorType =
  | "red"
  | "pink"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "brown"
  | "white"
  | "black"
  | "transparent";
