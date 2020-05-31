// eslint-disable-next-line @typescript-eslint/camelcase
import { rgb_to_lab, diff } from "color-diff";
import { toRGBColor, COLOR_DISTANCE_THRESHOLD } from "./utility";
import { protos } from "@google-cloud/vision";
import IColorInfo = protos.google.cloud.vision.v1.IColorInfo;
import _ from "lodash";

declare module "lodash" {
  interface LoDashStatic {
    filterApproximateColor(array: _.Collection<IColorInfo>): _.Collection<IColorInfo>;
  }
  interface LoDashExplicitWrapper<TValue extends IColorInfo> {
    filterApproximateColor(): LoDashExplicitWrapper<TValue>;
  }
  interface Collection<T extends IColorInfo> {
    filterApproximateColor(): _.Collection<T>;
  }
}
function filterApproximateColor(colors: _.Collection<IColorInfo>) {
  const array: IColorInfo[] = [];
  return colors.filter(c => {
    const c2 = rgb_to_lab(toRGBColor([c.color?.red ?? 0, c.color?.green ?? 0, c.color?.blue ?? 0]));
    for (const e of array) {
      const e2 = rgb_to_lab(toRGBColor([e.color?.red ?? 0, e.color?.green ?? 0, e.color?.blue ?? 0]));
      const d = diff(c2, e2);
      if (d < COLOR_DISTANCE_THRESHOLD) {
        return false;
      }
    }
    array.push(c);
    return true;
  });
}

_.mixin<IColorInfo>({
  filterApproximateColor,
});
