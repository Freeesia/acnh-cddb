import Vue from "vue";
import Vuex from "vuex";
import { getModule } from "vuex-module-decorators";
import Auth from "./modules/auth";

Vue.use(Vuex);

const store = new Vuex.Store({
  modules: {
    auth: Auth,
  },
});

export const AuthModule = getModule(Auth, store);
export default store;
