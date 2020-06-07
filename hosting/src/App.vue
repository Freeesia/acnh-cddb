<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app clipped>
      <v-list dense>
        <v-list-item>
          <v-list-item-content>
            <v-combobox v-model="selectedColor" :items="colors" label="カラー" clearable></v-combobox>
          </v-list-item-content>
        </v-list-item>
        <v-list-item>
          <v-list-item-content>
            <v-combobox v-model="selectedType" :items="types" label="カテゴリー" clearable></v-combobox>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-items>
        <v-btn text to="/" class="text-none">
          <v-toolbar-title>あつまれ マイデザの🌳</v-toolbar-title>
        </v-btn>
      </v-toolbar-items>
      <v-spacer></v-spacer>
      <v-btn v-if="user" icon to="/account">
        <v-avatar size="32px">
          <img :src="user.photoURL" alt="avatar" />
        </v-avatar>
      </v-btn>
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
import { ColorTypes, ColorType, DesignTypes, DesignType } from "./models/types";
import { SearchModule, AuthModule } from "./store";
import Fab from "./components/Fab.vue";

@Component({ components: { Fab } })
export default class App extends Vue {
  private drawer = false;
  private colors = ColorTypes;
  private types = DesignTypes;

  private get selectedColor(): ColorType {
    return SearchModule.color as ColorType;
  }

  private set selectedColor(val: ColorType) {
    SearchModule.setColor(val);
  }

  private get selectedType() {
    return SearchModule.type as DesignType;
  }

  private set selectedType(val: DesignType) {
    SearchModule.setType(val);
  }

  private get user() {
    return AuthModule.user;
  }
}
</script>
