import { designsIndex, dreamsIndex } from "./init";
import { DesignInfo, DreamInfo } from "../models/types";

export async function getDesigns() {
  const items: DesignInfo[] = [];
  await designsIndex.browseObjects<DesignInfo>({
    batch: batch => items.push(...batch),
  });
  return items;
}

export async function getDreams() {
  const items: DreamInfo[] = [];
  await dreamsIndex.browseObjects<DreamInfo>({
    batch: batch => items.push(...batch),
  });
  return items;
}
