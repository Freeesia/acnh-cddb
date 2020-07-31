import { protos } from "@google-cloud/vision";
import { RGBColor } from "color-diff";
import { assertIsDefined } from "@core/utilities/assert";
import _ from "lodash";
import IVertex = protos.google.cloud.vision.v1.IVertex;
import { boxLine, boxBox } from "intersects";

export const COLOR_DISTANCE_THRESHOLD = 15;
export const TRANSPARENT_DISTANCE_THRESHOLD = 3;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function toRGBColor(c: [number, number, number]): RGBColor {
  return { R: c[0], G: c[1], B: c[2] };
}

export function toRect(vertices?: IVertex[] | null): Rect {
  assertIsDefined(vertices);
  const left = _(vertices)
    .map(v => v.x)
    .min();
  const right = _(vertices)
    .map(v => v.x)
    .max();
  const top = _(vertices)
    .map(v => v.y)
    .min();
  const bottom = _(vertices)
    .map(v => v.y)
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

export function intersect(rect: Rect, line: Line): boolean {
  return boxLine(rect.x, rect.y, rect.w, rect.h, line.x1, line.y1, line.x2, line.y2);
}

export function intersectBox(rect0: Rect, rect1: Rect): boolean {
  return boxBox(rect0.x, rect0.y, rect0.w, rect0.h, rect1.x, rect1.y, rect1.w, rect1.h);
}

export function includePartRegex(targets: string[]) {
  return new RegExp(`(${targets.join("|")})`, "i");
}
