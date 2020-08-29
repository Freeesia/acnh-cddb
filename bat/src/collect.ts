import { searchTweets } from "./twitter";
import { searchPosts } from "./instagram";
import { deleteDeadDesignRef, deleteDeadDreamRef } from "./deleteDeadRef";
import { backup, deleteOld } from "./backup";
import { searchDreamTweets } from "./twitterDream";

(async () => {
  console.log("Start");
  console.log("バックアップ処理");
  await Promise.all([backup(), deleteOld()]);
  await collectDesigns();
  await collectDreams();
  console.log("Finish");
})().catch(error => {
  console.error(error);
  process.exit(1);
});

async function collectDesigns() {
  console.log("デザイン収集");
  console.log("参照切れ削除");
  await deleteDeadDesignRef(false);
  console.log("Instagram検索");
  await searchPosts();
  console.log("Twitter検索");
  await searchTweets();
}

async function collectDreams() {
  console.log("夢収集");
  console.log("参照切れ削除");
  await deleteDeadDreamRef(false);
  console.log("Twitter検索");
  await searchDreamTweets();
}
