<template>
  <v-container>
    <Md />
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import Md from "../md/tos.md";

@Component({ components: { Md } })
export default class ToC extends Vue {}
</script>
