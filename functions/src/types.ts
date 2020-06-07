import { firestore } from "firebase-admin";
import Timestamp = firestore.Timestamp;
import DocRef = firestore.DocumentReference;

export interface SearchResponse {
  statuses: Tweet[];
  search_metadata: {
    max_id_str: string;
    next_results?: string;
    count: number;
    since_id_str: string;
  };
}

export interface Tweet {
  created_at: string;
  id_str: string;
  text: string;
  truncated: boolean;
  extended_tweet: {
    full_text: string;
  };
  entities: {
    hashtags: HashTag[];
    media?: Media[];
  };
  extended_entities: {
    media?: Media[];
  };
  source: string;
  user: {
    id_str: string;
    name: string;
    screen_name: string;
  };
}

export interface TweetUser {
  id: string;
  name: string;
  screenName: string;
}

export interface Media {
  id_str: string;
  media_url_https: string;
  type: string;
  sizes: {
    thumb: MediaSize;
    large: MediaSize;
    medium: MediaSize;
    small: MediaSize;
  };
}

export interface MediaSize {
  w: number;
  h: number;
  resize: "crop" | "fit";
}

export interface HashTag {
  text: string;
  indices: [number, number];
}

export interface PostDesignInfo extends DesignInfo {
  post: {
    postId: string;
    fromSwitch: boolean;
    user: DocRef;
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
