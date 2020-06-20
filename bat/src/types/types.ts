import { firestore } from "firebase-admin";
import { Platform, DesignType, AuthorInfo } from "@core/models/types";
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
