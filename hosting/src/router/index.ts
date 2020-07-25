import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import { AuthModule, GeneralModule } from "@/store";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "home",
    component: () => import(/* webpackChunkName: "main", webpackPrefetch: true */ "@/views/Home.vue"),
  },
  {
    path: "/signin",
    name: "signin",
    component: () => import(/* webpackChunkName: "signin", webpackPrefetch: true */ "@/views/Signin.vue"),
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
    component: () => import(/* webpackChunkName: "main", webpackPrefetch: true */ "@/views/Account.vue"),
  },
  {
    path: "/detail/:id",
    name: "detail",
    component: () => import(/* webpackChunkName: "main", webpackPrefetch: true */ "@/views/Detail.vue"),
    props: true,
  },
  {
    path: "/privacy",
    name: "privacy",
    component: () => import(/* webpackChunkName: "misc", webpackPrefetch: true */ "@/views/Privacy.vue"),
    meta: {
      anonymous: true,
    },
  },
  {
    path: "/tos",
    name: "tos",
    component: () => import(/* webpackChunkName: "misc", webpackPrefetch: true */ "@/views/ToS.vue"),
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
  if (GeneralModule.swUpdated) {
    window.location.href = to.fullPath;
  } else if (to.meta.anonymous || (await AuthModule.isSignedIn())) {
    next();
  } else {
    next({ name: "signin", query: { redirect: to.fullPath } });
  }
});

export default router;
