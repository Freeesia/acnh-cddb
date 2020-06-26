import { Contributor } from "./types";

export interface TwitterUserCredential {
  token: string;
  secret: string;
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
  extended_entities?: {
    media?: Media[];
  };
  source: string;
  user: {
    id_str: string;
    name: string;
    screen_name: string;
  };
}

export interface TweetUser extends Contributor {
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
