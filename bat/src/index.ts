import { batchAll, refreshTags } from "./algoliasearch";
import convertFirestore from "./convertFirestore";

(async () => {
  console.log("Start");
  // await convertFirestore();
  // await batchAll();
  await refreshTags();
  console.log("Finish");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
