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
import "./modules/polyfill";
import i18n from "./plugins/i18n";
import { firestorePlugin } from "vuefire";
import InputFacade from "vue-input-facade";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faGithub,
  faTwitter,
  faLine,
  faTumblr,
  faFacebookF,
  faReddit,
  faWeibo,
  faWhatsapp,
} from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import VueGtag from "vue-gtag";
import { firebaseConfig } from "./plugins/firebase";
import VueSocialSharing from "vue-social-sharing";

library.add(faGithub, faTwitter, faLine, faTumblr, faFacebookF, faReddit, faWeibo, faWhatsapp);
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
    i18n,
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
Vue.use(VueSocialSharing);

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  i18n,
  render: h => h(App),
}).$mount("#app");
