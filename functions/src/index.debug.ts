import { searchTweet } from "./twitter";

(async () => {
  console.log("Start");
  await searchTweet();
  console.log("Finish");
})();
