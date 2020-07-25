import { searchTweets } from "./twitter";
import { searchPosts } from "./instagram";
import { deleteDeadRef } from "./deleteDeadRef";
import { backup, deleteOld } from "./backup";

(async () => {
  console.log("Start");
  // console.log("バックアップ処理");
  // await Promise.all([backup(), deleteOld()]);
  console.log("参照切れ削除");
  await deleteDeadRef();
  // console.log("Instagram検索");
  // await searchPosts();
  // console.log("Twitter検索");
  // await searchTweets();
  console.log("Finish");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
