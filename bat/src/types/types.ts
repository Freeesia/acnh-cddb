import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;
import DocRef = firestore.DocumentReference;

export interface PostDesignInfo extends DesignInfo {
  thumbUrl: string;
  post: {
    postId: string;
    fromSwitch: boolean;
    platform: Platform;
    contributor: DocRef;
  };
  createdAt: Timestamp;
}

export interface DesignInfo {
  imageUrl: string;
  title: string;
  designId: string;
  dominantColors: string[];
  dominantColorTypes: string[];
  designType: DesignType;
  author: AuthorInfo;
}

export interface AuthorInfo {
  authorName: string;
  authorId: string;
  islandName: string;
}

export interface Contributor {
  id: string;
  platform: Platform;
}

export type Platform = "Instagram" | "Twitter";

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
  score: number;
  pixel: number;
}

export type ColorType =
  | "red"
  | "pink"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "sky"
  | "purple"
  | "brown"
  | "white"
  | "black"
  | "transparent";
