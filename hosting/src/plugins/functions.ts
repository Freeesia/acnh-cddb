import "./firebase";
import { app } from "firebase/app";
import "firebase/functions";
import { TwitterUserCredential } from "@core/models/twitterTypes";
import { UserMediaTweets, DesignInfo } from "@core/models/types";

const functions = app().functions();
const localUrl = process.env.VUE_APP_FUNCTIONS_EMU as string | undefined;
if (localUrl) {
  functions.useFunctionsEmulator(localUrl);
}
const _getTweetImages = functions.httpsCallable("getTweetImages");
const _registerDesignInfo = functions.httpsCallable("registerDesignInfo");

export async function getTweetImages(data: TwitterUserCredential): Promise<UserMediaTweets> {
  const res = await _getTweetImages(data);
  return res.data as UserMediaTweets;
}

export async function registerDesignInfo(design: DesignInfo) {
  await _registerDesignInfo(design);
}
