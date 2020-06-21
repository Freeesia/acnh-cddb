import "./firebase";
import { app } from "firebase/app";
import "firebase/functions";
import { TwitterUserCredential } from "@core/models/twitterTypes";

const functions = app().functions();
const localUrl = process.env.VUE_APP_FUNCTIONS_EMU as string | undefined;
if (localUrl) {
  functions.useFunctionsEmulator(localUrl);
}
const _getTweetImages = functions.httpsCallable("getTweetImages");

export const getTweetImages = async (data: TwitterUserCredential) => {
  const res = await _getTweetImages(data);
  return res.data;
};
