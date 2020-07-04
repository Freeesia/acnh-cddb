import { ColorType } from "../../../core/src/models/types";

export function getColor(color: ColorType) {
  switch (color) {
    case "pink":
      return "pink lighten-4";
    case "blue":
      return "blue accent-4";
    case "sky":
      return "light-blue";
    default:
      return color;
  }
}
