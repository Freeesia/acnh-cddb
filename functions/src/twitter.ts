import Twitter from "twitter-lite";
import fs from "fs";

export async function searchTweet() {
  const user = new Twitter({
    // eslint-disable-next-line @typescript-eslint/camelcase
    consumer_key: process.env.TWITTER_CONSUMER_KEY ?? "",
    // eslint-disable-next-line @typescript-eslint/camelcase
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET ?? "",
  });

  const response = await user.getBearerToken();
  const app = new Twitter({
    // eslint-disable-next-line @typescript-eslint/camelcase
    bearer_token: response.access_token,
  } as any);
  const res = await app.get("search/tweets", {
    q: "#ACNH #マイデザイン filter:images -filter:retweets",
    lang: "ja",
    locale: "ja",
    count: 100,
  });
  console.log(process.cwd());
  fs.writeFileSync("test.json", JSON.stringify(res));
  // console.log(res);
}
