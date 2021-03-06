interface DocumentReference<T> {
  readonly id: string;
  readonly path: string;
}
export interface Timestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
}

export interface FieldValue {}

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
] as const;
export type ColorType = typeof ColorTypes[number];

export const DesignTypes = [
  "マイデザイン",
  "じめんゆか",
  "フェイスペイント",
  "そのほか",
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
] as const;

export type DesignType = typeof DesignTypes[number];

export const Platforms = ["Instagram", "Twitter", "Hosted"] as const;

export type Platform = typeof Platforms[number];

export interface AnalyzedDesignInfo {
  title: string;
  designId: string;
  dominantColors: string[];
  dominantColorTypes: ColorType[];
  designType: DesignType;
  author?: AuthorInfo;
}

export interface ImageUrls {
  thumb1?: string;
  thumb2?: string;
  large: string;
}

export interface DesignInfo extends AnalyzedDesignInfo {
  imageUrls: ImageUrls;
  post: {
    contributor: string | Contributor | DocumentReference<Contributor>;
    postId: string;
    text?: string;
    fromSwitch: boolean;
    platform: Platform;
  };
  tags: string[];
  createdAt: Date | Timestamp | FieldValue;
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
  dreamFavs: (DreamInfo | string)[];
  onlyMyself: boolean;
}

export interface Contributor {
  id: string;
  screenName: string;
  platform: Platform;
}

export interface PostedMedia {
  id: string;
  imageUrls: ImageUrls;
  post: {
    contributor: string;
    postId: string;
    fromSwitch: boolean;
    platform: Platform;
  };
  createdAt: Date | Timestamp;
}

export interface HostedMedia extends PostedMedia {
  path: string;
}

export interface UserMediaTweets {
  posts: PostedMedia[];
  sinceId: string;
}

export interface PostedTweet {
  contributor: string | Contributor | DocumentReference<Contributor>;
  postId: string;
  text?: string;
  fromSwitch: boolean;
  platform: Platform;
  imageUrls: ImageUrls[];
  tags: string[];
}

export interface DreamInfo {
  dreamId: string;
  imageUrls: ImageUrls[];
  islandName: string;
  post: {
    contributor: string | Contributor | DocumentReference<Contributor>;
    postId: string;
    text?: string;
    fromSwitch: boolean;
    platform: Platform;
  };
  tags: string[];
  createdAt: Date | Timestamp | FieldValue;
}

export const designIdPattern = /^MO(-[0-9A-HJ-NP-Y]{4}){3}$/;
export const authorIdPattern = /^MA(-\d{4}){3}$/;
export const dreamIdPattern = /^DA(-\d{4}){3}$/;

export interface DesignList {
  name: string;
  description: string;
  owner: string;
  isPublic: boolean;
  designs: (DocumentReference<DesignInfo> | string | DesignInfo)[];
  createdAt: Date | Timestamp | FieldValue;
}
