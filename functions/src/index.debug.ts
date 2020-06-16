import { searchTweets } from "./twitter";
import { searchPosts } from "./instagram";
import { batchAll } from "./algoliasearch";

(async () => {
  console.log("Start");
  // await searchPosts();
  // await searchTweets();
  await batchAll();
  console.log("Finish");
})();
