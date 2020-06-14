import { searchTweets } from "./twitter";
import { searchPosts } from "./instagram";

(async () => {
  console.log("Start");
  await searchPosts();
  await searchTweets();
  console.log("Finish");
})();
