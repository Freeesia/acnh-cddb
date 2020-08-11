import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import { AuthModule, GeneralModule } from "@/store";
import Markdown from "@/views/Markdown.vue";
import Signin from "@/views/Signin.vue";

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
    component: Markdown,
    props: {
      md: "privacy",
    },
    meta: {
      anonymous: true,
    },
  },
  {
    path: "/ja/privacy",
    name: "privacyJa",
    component: Markdown,
    props: {
      md: "privacyJa",
    },
    meta: {
      anonymous: true,
    },
  },
  {
    path: "/tos",
    name: "tos",
    component: Markdown,
    props: {
      md: "tos",
    },
    meta: {
      anonymous: true,
    },
  },
  {
    path: "/ja/tos",
    name: "tosJa",
    component: Markdown,
    props: {
      md: "tosJa",
    },
    meta: {
      anonymous: true,
    },
  },
  {
    path: "/dream",
    name: "dream",
    component: () => import(/* webpackChunkName: "main", webpackPrefetch: true */ "@/views/Dreams.vue"),
    meta: {
      dream: true,
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
