import Vue from "vue";
import App from "./App.vue";
import "./registerServiceWorker";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import VuetifyDialog from "vuetify-dialog";
import "vuetify-dialog/dist/vuetify-dialog.css";
import "./plugins/firebase";
import "./plugins/sentry";
import { firestorePlugin } from "vuefire";
import InputFacade from "vue-input-facade";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import VueGtag from "vue-gtag";
import { firebaseConfig } from "./plugins/firebase";

library.add(fab);
Vue.component("v-fa", FontAwesomeIcon);

Vue.use(InputFacade, {
  tokens: {
    "#": { pattern: /\d/ },
    D: { pattern: /[0-9A-HJ-NP-Y]/i, transform: (v: string) => v.toLocaleUpperCase() },
  },
});
Vue.use(firestorePlugin);

Vue.use(VuetifyDialog, {
  context: {
    vuetify,
  },
});

Vue.use(
  VueGtag,
  {
    config: {
      id: firebaseConfig.measurementId,
    },
  },
  router
);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App),
}).$mount("#app");
