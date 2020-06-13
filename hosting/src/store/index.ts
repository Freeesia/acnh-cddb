import Vue from "vue";
import Vuex from "vuex";
import Firebase from "firebase/app";
import { getModule } from "vuex-module-decorators";
import VuexEasyFirestore from "vuex-easy-firestore";
import auth from "./modules/auth";
import search from "./modules/search";
import general from "./modules/general";
import user from "./modules/user";

Vue.use(Vuex);

const easyFirestore = VuexEasyFirestore([user], {
  logging: true,
  FirebaseDependency: Firebase,
  preventInitialDocInsertion: true,
});

const store = new Vuex.Store({
  plugins: [easyFirestore],
  modules: {
    auth,
    search,
    general,
  },
});

export const AuthModule = getModule(auth, store);
export const SearchModule = getModule(search, store);
export const GeneralModule = getModule(general, store);
export default store;
