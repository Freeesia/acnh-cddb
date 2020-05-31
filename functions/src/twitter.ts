import Twitter from "twitter-lite";
import querystring from "querystring";
import { analyzeImageUrl } from "./vision";

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

export async function searchTweet() {
  const client = await createClient();
  let max = "";
  do {
    const res = await client.get<SearchResponse>("search/tweets", {
      q: "#ACNH #マイデザイン filter:images -filter:retweets",
      // eslint-disable-next-line @typescript-eslint/camelcase
      max_id: max,
      lang: "ja",
      locale: "ja",
      count: 100,
    });
    for (const tweet of res.statuses) {
      // console.log(`${tweet.user.name}: https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`);
      if (!tweet.entities.media) {
        continue;
      }
      for (const media of tweet.entities.media) {
        if (media.sizes.large.w !== 1280) {
          continue;
        }
        const info = await analyzeImageUrl(media.media_url_https + "?name=large");
        if (!info) {
          continue;
        }
        console.log(info);
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
