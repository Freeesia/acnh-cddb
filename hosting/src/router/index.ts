import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "@/views/Home.vue";
import Signin from "@/views/Signin.vue";
import Account from "@/views/Account.vue";
import { AuthModule } from "@/store";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/signin",
    name: "signin",
    component: Signin,
    meta: {
      anonymous: true,
    },
  },
  {
    path: "/account",
    name: "account",
    component: Account,
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach(async (to, _, next) => {
  if (to.meta.anonymous || (await AuthModule.isSignedIn())) {
    next();
  } else {
    next({ name: "signin" });
  }
});

export default router;
