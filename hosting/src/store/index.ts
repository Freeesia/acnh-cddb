import Vue from "vue";
import Vuex from "vuex";
import { vuexfireMutations } from "vuexfire";
import { getModule } from "vuex-module-decorators";
import Auth from "./modules/auth";
import Search from "./modules/search";
import General from "./modules/general";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    auth: Auth,
    search: Search,
    general: General,
  },
  mutations: {
    ...vuexfireMutations,
  },
});

export const AuthModule = getModule(Auth, store);
export const SearchModule = getModule(Search, store);
export const GeneralModule = getModule(General, store);
export default store;
