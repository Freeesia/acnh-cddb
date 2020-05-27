import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "@/views/Home.vue";
import About from "@/views/About.vue";
import Signin from "@/views/Signin.vue";
import { AuthModule } from "@/store";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/about",
    name: "About",
    component: About,
    meta: {
      anonymous: true,
    },
  },
  {
    path: "/signin",
    name: "signin",
    component: Signin,
    meta: {
      anonymous: true,
    },
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

router.beforeEach(async (to, _, next) => {
  if (to.meta.anonymous) {
    if (await AuthModule.isSignedIn()) {
      next({ name: "home" });
    } else {
      next();
    }
  } else {
    if (await AuthModule.isSignedIn()) {
      next();
    } else {
      next({ name: "signin" });
    }
  }
});

export default router;
