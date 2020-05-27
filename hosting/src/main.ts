import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import { initializeApp, performance } from "firebase/app";
import "firebase/performance";

Vue.config.productionTip = false;
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

const perf = performance();
perf.dataCollectionEnabled = true;
perf.instrumentationEnabled = true;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App),
}).$mount("#app");
