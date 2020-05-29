<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-items>
        <v-btn text to="/" class="text-none">
          <v-toolbar-title>ACNH-CDDB</v-toolbar-title>
        </v-btn>
      </v-toolbar-items>
      <v-spacer></v-spacer>
    </v-app-bar>

    <v-content>
      <router-view></router-view>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component({})
export default class App extends Vue {}
</script>
