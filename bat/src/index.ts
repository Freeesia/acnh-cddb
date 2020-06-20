import { searchTweets } from "./twitter";
import { searchPosts } from "./instagram";
import { batchAll } from "./algoliasearch";
import convertFirestore from "./convertFirestore";

(async () => {
  console.log("Start");
  await convertFirestore();
  // await searchPosts();
  // await searchTweets();
  await batchAll();
  console.log("Finish");
})();
