interface DocumentReference<T> {
  readonly id: string;
  readonly path: string;
}
export interface Timestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
}

export const ColorTypes = [
  "red",
  "pink",
  "orange",
  "yellow",
  "green",
  "blue",
  "sky",
  "purple",
  "brown",
  "white",
  "black",
  "transparent",
];
export type ColorType = typeof ColorTypes[number];

export const DesignTypes = [
  "マイデザイン",
  "タンクトップ",
  "はんそでTシャツ",
  "ながそでYシャツ",
  "セーター",
  "パーカー",
  "コート",
  "そでなしワンピース",
  "はんそでワンピース",
  "ながそでドレス",
  "まるがたワンピース",
  "バルーンワンピース",
  "ローブ",
  "つばつきキャップ",
  "ニットキャップ",
  "つばつきハット",
];

export type DesignType = typeof DesignTypes[number];

export type Platform = "Instagram" | "Twitter";

export interface AnalyzedDesignInfo {
  title: string;
  designId: string;
  dominantColors: string[];
  dominantColorTypes: string[];
  designType: DesignType;
  author: AuthorInfo;
}

export interface DesignInfo extends AnalyzedDesignInfo {
  imageUrls: {
    thumb1: string;
    thumb2: string;
    large: string;
  };
  post: {
    contributor: string | Contributor | DocumentReference<Contributor>;
    postId: string;
    fromSwitch: boolean;
    platform: Platform;
  };
  createdAt: Date | Timestamp;
}

export interface AuthorInfo {
  authorName: string;
  authorId: string;
  islandName: string;
}

export interface DominantColor {
  hex: string;
  type: ColorType;
  score: number;
  pixel: number;
}

export interface UserInfo {
  favs: (DesignInfo | string)[];
}

export interface Contributor {
  id: string;
  platform: Platform;
}
