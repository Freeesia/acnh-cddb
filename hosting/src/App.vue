<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-items>
        <v-btn class="px-1" text to="/">
          <v-toolbar-title>{{ isDream ? "🌳" : $t("title") }}</v-toolbar-title>
        </v-btn>
        <v-btn class="px-1" text to="/dream">
          <v-toolbar-title>{{ isDream ? $t("dream.title") : "⛪️" }}</v-toolbar-title>
        </v-btn>
      </v-toolbar-items>
      <v-spacer></v-spacer>
      <v-btn v-if="user" icon to="/account">
        <v-avatar size="32px">
          <img :src="user.photoURL" alt="avatar" />
        </v-avatar>
      </v-btn>
      <v-progress-linear
        striped
        :active="loading"
        background-color="accent"
        color="secondary"
        indeterminate
        absolute
        top
      />
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>
    <Fab class="mb-6"></Fab>
    <v-footer app>
      <v-row no-gutters class="text-caption">
        <v-col class="text-no-wrap" cols="12" md="6">
          {{ $t("unofficial") }}
        </v-col>
        <v-col class="text-center" md="3">
          <router-link to="/privacy">{{ $t("privacy") }}</router-link>
          |
          <router-link to="/tos">{{ $t("tos") }}</router-link>
        </v-col>
        <v-col class="text-right">
          <a href="https://github.com/Freeesia/acnh-cddb">
            <v-fa :icon="['fab', 'github']" />
            Source
          </a>
          &copy; {{ new Date().getFullYear() }} Freesia
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { AuthModule, GeneralModule } from "./store";
import Fab from "./components/Fab.vue";
import { Route } from "vue-router";
import { Watch } from "vue-property-decorator";

@Component({ components: { Fab } })
export default class App extends Vue {
  private isDream = false;
  private get loading() {
    return GeneralModule.loading;
  }

  private get user() {
    return AuthModule.user;
  }

  private created() {
    this.$router.afterEach(this.afterEach);
  }

  private afterEach(to: Route) {
    this.isDream = to.meta.dream ?? false;
  }

  @Watch("isDream")
  private chanedMode(val: boolean) {
    this.$vuetify.theme.dark = val;
  }
}
</script>
