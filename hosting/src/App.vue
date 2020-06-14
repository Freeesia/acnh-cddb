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

    <v-content>
      <router-view></router-view>
    </v-content>
    <Fab></Fab>
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
