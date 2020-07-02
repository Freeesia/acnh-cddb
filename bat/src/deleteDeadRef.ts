import { db } from "./firestore";
import Axios from "axios";

export async function deleteDeadRef() {
  const designRefs = await db.collection("designs").listDocuments();
  for (const docRef of designRefs) {
    const doc = await docRef.get();
    console.log(doc.id);
    if (!doc.exists) {
      await docRef.delete();
    } else {
      let url = doc.get("imageUrls.thumb1") as string;
      if (!url) {
        url = doc.get("imageUrls.thumb2") as string;
      }
      try {
        await Axios.get(url);
      } catch (error) {
        await docRef.delete();
      }
    }
  }
}
