import { searchTweets } from "./twitter";
import { searchPosts } from "./instagram";
import { deleteDeadRef } from "./deleteDeadRef";

(async () => {
  console.log("Start");
  await deleteDeadRef();
  await searchPosts();
  await searchTweets();
  console.log("Finish");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
