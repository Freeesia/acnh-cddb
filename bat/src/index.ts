import { batchAll, refreshTags } from "./algoliasearch";
import convertFirestore from "./convertFirestore";
import { backup } from "./backup";
import { deleteDeadDesignRef, deleteDeadDreamRef } from "./deleteDeadRef";

(async () => {
  console.log("Start");
  console.log("バックアップ処理");
  await backup();
  // console.log("firestore処理");
  // await convertFirestore();
  // await batchAll();
  // await refreshTags();
  await deleteDeadDesignRef(true);
  await deleteDeadDreamRef(true);
  console.log("Finish");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
