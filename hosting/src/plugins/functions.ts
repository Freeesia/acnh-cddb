import "./firebase";
import { app } from "firebase/app";
import "firebase/functions";
import { TwitterUserCredential } from "@core/models/twitterTypes";
import { UserMediaTweets, DesignInfo, DreamInfo, PostedTweet } from "@core/models/types";

const functions = app().functions();
const localUrl = process.env.VUE_APP_FUNCTIONS_EMU as string | undefined;
if (localUrl) {
  functions.useFunctionsEmulator(localUrl);
}
const _getTweetImages = functions.httpsCallable("getTweetImages");
const _getTweets = functions.httpsCallable("getTweets");
const _registerDesignInfo = functions.httpsCallable("registerDesignInfo");
const _unregisterDesignInfo = functions.httpsCallable("unregisterDesignInfo");
const _registerDreamInfo = functions.httpsCallable("registerDreamInfo");
const _unregisterDreamInfo = functions.httpsCallable("unregisterDreamInfo");
const _createDesignList = functions.httpsCallable("createDesignList");
const _changeOnlyMyself = functions.httpsCallable("changeOnlyMyself");

export async function getTweetImages(data: TwitterUserCredential): Promise<UserMediaTweets> {
  const res = await _getTweetImages(data);
  return res.data as UserMediaTweets;
}

export async function getTweets(data: TwitterUserCredential): Promise<PostedTweet[]> {
  const res = await _getTweets(data);
  return res.data as PostedTweet[];
}
export async function registerDesignInfo(design: DesignInfo) {
  await _registerDesignInfo(design);
}

export async function unregisterDesignInfo(ids: string[]) {
  await _unregisterDesignInfo(ids);
}

export async function registerDreamInfo(dream: DreamInfo) {
  await _registerDreamInfo(dream);
}

export async function unregisterDreamInfo(id: string) {
  await _unregisterDreamInfo(id);
}
export async function createDesignList(name: string, description: string, isPublic: boolean, design: string) {
  const res = await _createDesignList({ name, description, isPublic, design });
  return res.data as string;
}
export async function changeOnlyMyself(value: boolean) {
  await _changeOnlyMyself(value);
}
