import "./firestore";
import { firestore, storage } from "firebase-admin";
import _ from "lodash";
import moment from "moment";

const fsClient = new firestore.v1.FirestoreAdminClient();
const databaseName = fsClient.databasePath("acnh-cddb", "(default)");
const bucketName = "gs://acnh-cddb-backup";

export async function backup() {
  await fsClient.exportDocuments({
    name: databaseName,
    outputUriPrefix: bucketName,
  });
}

export async function deleteOld() {
  const bucket = storage().bucket(bucketName);
  const [list] = await bucket.getFiles();
  const group = _(list)
    .groupBy(f => f.name.replace(/\/.*$/, ""))
    .value();
  const now = moment().utc();
  for (const key of _(group).keys().value()) {
    const date = moment.utc(key, "YYYY-MM-DDThh:mm:ss_SSSSS");
    if (date.diff(now, "days") < -7) {
      // await Promise.all(group[key].map(f => f.delete()));
      console.log("old:" + key);
    }
  }
}
