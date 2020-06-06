import Twitter from "twitter-lite";
import querystring from "querystring";
import { analyzeImageUrl, DesignInfo } from "./vision";
import { firestore, initializeApp } from "firebase-admin";

initializeApp();

import Timestamp = firestore.Timestamp;
import DocRef = firestore.DocumentReference;
import FieldPath = firestore.FieldPath;

const users = firestore().collection("users");
const designs = firestore().collection("designs");

async function createClient() {
  const user = new Twitter({
    // eslint-disable-next-line @typescript-eslint/camelcase
    consumer_key: process.env.TWITTER_CONSUMER_KEY ?? "",
    // eslint-disable-next-line @typescript-eslint/camelcase
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET ?? "",
  });

  const response = await user.getBearerToken();
  return new Twitter({
    // eslint-disable-next-line @typescript-eslint/camelcase
    bearer_token: response.access_token,
  } as any);
}

function getMaxFromQuery(query?: string) {
  if (!query) {
    return "";
  }
  const nextQuery = querystring.parse(query.startsWith("?") ? query.substr(1) : query);
  const max = nextQuery.max_id;
  if (!max) {
    return "";
  } else if (max instanceof Array) {
    return max[0];
  } else {
    return max;
  }
}

async function getOrCreateUser(user: TweetUser) {
  const userRef = users.doc(user.id);
  await userRef.set(user, { merge: true });
  return userRef;
}

export async function searchTweets() {
  const client = await createClient();
  let max = "";
  do {
    const res = await client.get<SearchResponse>("search/tweets", {
      q: "#ACNH #マイデザイン filter:images -filter:retweets",
      // eslint-disable-next-line @typescript-eslint/camelcase
      max_id: max,
      lang: "ja",
      locale: "ja",
      // eslint-disable-next-line @typescript-eslint/camelcase
      result_type: "recent",
      count: 100,
    });
    for (const tweet of res.statuses) {
      // console.log(`${tweet.user.name}: https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`);
      if (!tweet.entities.media) {
        continue;
      }
      const createdAt = Timestamp.fromMillis(Date.parse(tweet.created_at));
      const fromSwitch =
        tweet.source === '<a href="https://www.nintendo.com/countryselector" rel="nofollow">Nintendo Switch Share</a>';
      for (const media of tweet.entities.media) {
        if (media.sizes.large.w !== 1280) {
          continue;
        }
        const info = await analyzeImageUrl(media.media_url_https + "?name=large");
        if (!info) {
          continue;
        }
        const postInfo = info as PostDesignInfo;
        postInfo.imageUrl = media.media_url_https;
        postInfo.post = {
          user: await getOrCreateUser({
            id: tweet.user.id_str,
            name: tweet.user.name,
            screenName: tweet.user.screen_name,
          }),
          postId: tweet.id_str,
          fromSwitch,
        };
        postInfo.createdAt = createdAt;
        await designs.doc(postInfo.designId).set(postInfo);
      }
    }
    max = getMaxFromQuery(res.search_metadata.next_results);
    console.log(res.search_metadata.max_id_str);
  } while (max !== "");
}

interface SearchResponse {
  statuses: Tweet[];
  search_metadata: {
    max_id_str: string;
    next_results?: string;
    count: number;
    since_id_str: string;
  };
}
interface Tweet {
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
  source: string;
  user: {
    id_str: string;
    name: string;
    screen_name: string;
  };
}

interface TweetUser {
  id: string;
  name: string;
  screenName: string;
}

interface Media {
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

interface MediaSize {
  w: number;
  h: number;
  resize: "crop" | "fit";
}

interface HashTag {
  text: string;
  indices: [number, number];
}

interface PostDesignInfo extends DesignInfo {
  post: {
    postId: string;
    fromSwitch: boolean;
    user: DocRef;
  };
  createdAt: Timestamp;
}
