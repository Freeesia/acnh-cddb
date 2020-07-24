import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "@/views/Home.vue";
import Signin from "@/views/Signin.vue";
import Account from "@/views/Account.vue";
import Detail from "@/views/Detail.vue";
import Privacy from "@/views/Privacy.vue";
import ToS from "@/views/ToS.vue";
import { AuthModule } from "@/store";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "home",
    component: Home,
  },
  {
    path: "/signin",
    name: "signin",
    component: Signin,
    meta: {
      anonymous: true,
    },
    props: route => ({
      redirect: route.query.redirect,
    }),
  },
  {
    path: "/account",
    name: "account",
    component: Account,
  },
  {
    path: "/detail/:id",
    name: "detail",
    component: Detail,
    props: true,
  },
  {
    path: "/privacy",
    name: "privacy",
    component: Privacy,
    meta: {
      anonymous: true,
    },
  },
  {
    path: "/tos",
    name: "tos",
    component: ToS,
    meta: {
      anonymous: true,
    },
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
  scrollBehavior: (to, from, savedPosition) => {
    if (to.name === "detail") {
      return { x: 0, y: 0 };
    }
    return savedPosition;
  },
});

router.beforeEach(async (to, _, next) => {
  if (to.meta.anonymous || (await AuthModule.isSignedIn())) {
    next();
  } else {
    next({ name: "signin", query: { redirect: to.fullPath } });
  }
});

export default router;
