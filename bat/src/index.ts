import { batchAll, refreshTags } from "./algoliasearch";
import convertFirestore from "./convertFirestore";
import { backup } from "./backup";

(async () => {
  console.log("Start");
  // console.log("バックアップ処理");
  // await backup();
  console.log("firestore処理");
  await convertFirestore();
  // await batchAll();
  // await refreshTags();
  console.log("Finish");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
