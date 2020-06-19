<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-items>
        <v-btn text to="/">
          <v-toolbar-title>あつまれ マイデザの🌳</v-toolbar-title>
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
          当サイトは任天堂の非公式・非公認のファンサイトです。
        </v-col>
        <v-col class="text-center" md="3">
          <router-link to="/privacy">プライバシーポリシー</router-link>
        </v-col>
        <v-col class="text-right">
          <a href="https://github.com/Freeesia/acnh-cddb">
            <img width="12" src="./assets/GitHub-Mark-32px.png" />
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

@Component({ components: { Fab } })
export default class App extends Vue {
  private get loading() {
    return GeneralModule.loading;
  }

  private get user() {
    return AuthModule.user;
  }
}
</script>
