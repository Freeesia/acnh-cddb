import Vue from "vue";
import Vuex from "vuex";
import { getModule } from "vuex-module-decorators";
import Auth from "./modules/auth";
import Search from "./modules/search";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    auth: Auth,
    search: Search,
  },
});

export const AuthModule = getModule(Auth, store);
export const SearchModule = getModule(Search, store);
export default store;
