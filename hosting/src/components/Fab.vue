<template>
  <v-btn
    v-show="visible"
    v-scroll="onScroll"
    bottom
    color="primary"
    fab
    fixed
    right
    title="Scroll to top"
    @click="toTop"
  >
    <v-icon>arrow_upward</v-icon>
  </v-btn>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component({})
export default class Fab extends Vue {
  private visible = false;

  private onScroll() {
    if (typeof window === "undefined") return;
    const top = window.pageYOffset || document.documentElement.offsetTop || 0;
    this.visible = top > 30;
  }

  private toTop() {
    this.$vuetify.goTo(0);
  }
}
</script>
