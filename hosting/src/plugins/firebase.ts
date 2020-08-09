import { initializeApp, performance, analytics } from "firebase/app";
import "firebase/performance";
import "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBMyQQGyY_0IIxtx8dGSW-Q7ipecZN9Tfw",
  authDomain: "acnh-cddb.firebaseapp.com",
  databaseURL: "https://acnh-cddb.firebaseio.com",
  projectId: "acnh-cddb",
  storageBucket: "acnh-cddb.appspot.com",
  messagingSenderId: "1034424587914",
  appId: "1:1034424587914:web:e69fbe3dd8ae40acb53f73",
  measurementId: "G-J22RFHGB57",
};
initializeApp(firebaseConfig);

if (process.env.NODE_ENV === "production") {
  const perf = performance();
  perf.dataCollectionEnabled = true;
  perf.instrumentationEnabled = true;
}
analytics.isSupported().then(() => analytics());
