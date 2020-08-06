import "./firebase";
import { firestore } from "firebase/app";
import "firebase/firestore";

export const db = firestore();
export const usersRef = db.collection("users");
