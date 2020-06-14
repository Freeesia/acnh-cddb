import { searchTweets } from "./twitter";
import { searchPosts } from "./instagram";
import { analyzeImageUrl } from "./vision";

(async () => {
  console.log("Start");
  await searchPosts();
  // const urls: string[] = [];
  // for (const url of urls) {
  //   const info = await analyzeImageUrl(url);
  //   if (info) {
  //     console.log(info);
  //   }
  // }
  console.log("Finish");
})();
