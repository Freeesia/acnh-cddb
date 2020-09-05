import Vue from "vue";
import Vuex from "vuex";
import { vuexfireMutations } from "vuexfire";
import { getModule } from "vuex-module-decorators";
import createPersistedState from "vuex-persistedstate";
import auth from "./modules/auth";
import general from "./modules/general";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    auth,
    general,
  },
  mutations: {
    ...vuexfireMutations,
  },
  plugins: [
    createPersistedState({
      paths: ["general._locale"],
    }),
  ],
});

export const AuthModule = getModule(auth, store);
export const GeneralModule = getModule(general, store);
export default store;
