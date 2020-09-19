import Vue from "vue";
import Vuex from "vuex";
import { vuexfireMutations } from "vuexfire";
import createPersistedState from "vuex-persistedstate";
import auth from "./modules/auth";
import general from "./modules/general";
import { createProxy, extractVuexModule } from "vuex-class-component";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    ...extractVuexModule(auth),
    ...extractVuexModule(general),
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

export const AuthModule = createProxy(store, auth);
export const GeneralModule = createProxy(store, general);
export default store;
