import "./firebase";
import { firestore } from "firebase/app";
import "firebase/firestore";

export const db = firestore();
export const usersRef = db.collection("users");
export const designsRef = db.collection("designs");
export const designListsRef = db.collection("designLists");
