import { batchAll } from "./algoliasearch";
import convertFirestore from "./convertFirestore";

(async () => {
  console.log("Start");
  await convertFirestore();
  // await batchAll();
  console.log("Finish");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
