import { searchTweets } from "./twitter";
import { searchPosts } from "./instagram";
import { deleteDeadRef } from "./deleteDeadRef";
import { backup, deleteOld } from "./backup";

(async () => {
  console.log("Start");
  await Promise.all([backup(), deleteOld()]);
  await deleteDeadRef();
  await searchPosts();
  await searchTweets();
  console.log("Finish");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
