import { assertIsDefined } from "./assert";
import { intersect, toRect, toRGBColor, Line, TRANSPARENT_DISTANCE_THRESHOLD } from "./utility";
import { ImageAnnotatorClient, protos } from "@google-cloud/vision";
// eslint-disable-next-line @typescript-eslint/camelcase
import diff, { RGBColor, rgb_to_lab } from "color-diff";
import convert from "color-convert";
import IColorInfo = protos.google.cloud.vision.v1.IColorInfo;
import _ from "lodash";
import sharp from "sharp";
import axios from "axios";
import "./lodash.extensions";
import { DesignType, DominantColor, ColorType, DesignInfo } from "./types";

const visionClient = new ImageAnnotatorClient();

// 幅1280換算
const titleLine: Line = { x1: 400, y1: 156, x2: 880, y2: 156 };
const authorNameLine: Line = { x1: 150, y1: 490, x2: 400, y2: 490 };
const islandNameLine: Line = { x1: 150, y1: 535, x2: 400, y2: 535 };
const designTypeLine: Line = { x1: 940, y1: 535, x2: 1200, y2: 535 };
const authorIdPattern = /^MA-\d{4}-\d{4}-\d{4}$/;
const designIdPattern = /^MO-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/;
const transparent = toRGBColor([244, 246, 232]);
const colorTypes: { [key in ColorType]: RGBColor } = {
  red: toRGBColor([194, 0, 0]),
  pink: toRGBColor([255, 128, 128]),
  orange: toRGBColor([255, 128, 0]),
  yellow: toRGBColor([255, 255, 0]),
  green: toRGBColor([0, 194, 0]),
  blue: toRGBColor([0, 0, 194]),
  sky: toRGBColor([0, 255, 255]),
  purple: toRGBColor([255, 0, 255]),
  brown: toRGBColor([128, 64, 0]),
  white: toRGBColor([255, 255, 255]),
  black: toRGBColor([0, 0, 0]),
  transparent: toRGBColor([255, 255, 255]), // 便宜上定義しておく
};

function toColorType(color: RGBColor): ColorType {
  if (diff.diff(rgb_to_lab(color), rgb_to_lab(transparent)) < TRANSPARENT_DISTANCE_THRESHOLD) {
    return "transparent";
  }
  const c = diff.closest(color, Object.values(colorTypes));
  if (c === colorTypes.transparent) {
    return "white";
  }
  return Object.keys(colorTypes).find(k => colorTypes[k as ColorType] === c) as ColorType;
}

function toDominantColor(c: IColorInfo): DominantColor {
  const color = toRGBColor([c.color?.red ?? 0, c.color?.green ?? 0, c.color?.blue ?? 0]);
  return {
    hex: convert.rgb.hex([color.R, color.G, color.B]),
    type: toColorType(color),
    score: c.score ?? 0,
    pixel: c.pixelFraction ?? 0,
  };
}

export async function analyzeImageUrl(imageUrl: string): Promise<DesignInfo | null> {
  let buf: Buffer;
  let title = "";
  let authorName = "";
  let islandName = "";
  let designType = "";
  let authorId = "";
  let designId = "";
  const dominantColors: DominantColor[] = [];
  {
    // 画像データの取得
    const res = await axios.get<Buffer>(imageUrl, { responseType: "arraybuffer" });
    buf = res.data;
  }
  {
    const [res] = await visionClient.textDetection(buf);
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
    if (!designId || !designType) {
      return null;
    }
  }
  {
    // デザイン部分の切り抜き
    buf = await sharp(buf).extract({ left: 998, top: 328, width: 154, height: 154 }).toBuffer();
  }
  {
    const [res] = await visionClient.imageProperties(buf);
    if (res.error) {
      console.error("[imageProperties]" + res.error.message ?? "unkown error");
      return null;
    }
    let colors = _(res.imagePropertiesAnnotation?.dominantColors?.colors ?? [])
      .orderBy(c => c.score, "desc")
      .filterApproximateColor()
      .map<DominantColor>(c => toDominantColor(c));
    if (designType !== "マイデザイン") {
      colors = colors.filter(c => c.type !== "transparent");
    }
    dominantColors.push(...colors.take(2).value());
  }
  return {
    imageUrl,
    title,
    designId,
    dominantColors: dominantColors.map(c => c.hex),
    dominantColorTypes: dominantColors.map(c => c.type),
    designType: designType as DesignType,
    author: {
      authorName,
      authorId,
      islandName,
    },
  };
}
