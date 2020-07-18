import { designsIndex } from "./init";
import { DesignInfo } from "../models/types";

export async function getDesigns() {
  const items: DesignInfo[] = [];
  await designsIndex.browseObjects<DesignInfo>({
    batch: batch => items.push(...batch),
  });
  return items;
}
