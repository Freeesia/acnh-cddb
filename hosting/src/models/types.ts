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

export interface DesignInfo {
  imageUrl: string;
  thumbUrl: string;
  title: string;
  designId: string;
  dominantColors: DominantColor[];
  designType: DesignType;
  author: AuthorInfo;
  post: {
    postId: string;
    fromSwitch: boolean;
    platform: Platform;
  };
  createdAt: Date;
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
