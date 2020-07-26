<template>
  <v-container>
    <Md />
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Md from "../md/privacy.md";

@Component({ components: { Md } })
export default class Privacy extends Vue {}
</script>
