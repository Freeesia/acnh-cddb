import { searchTweets } from "./twitter";
import { searchPosts } from "./instagram";
import { batchAll } from "./algoliasearch";
import convertFirestore from "./convertFirestore";
import { deleteDeadRef } from "./deleteDeadRef";

(async () => {
  console.log("Start");
  // await convertFirestore();
  await deleteDeadRef();
  await searchPosts();
  await searchTweets();
  // await batchAll();
  console.log("Finish");
})();
