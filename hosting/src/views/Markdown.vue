<template>
  <v-container>
    <component :is="md"></component>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { GeneralModule } from "../store";
const tos = () => importMd("tos");
const privacy = () => importMd("privacy");
const tosJa = async () => (await import(/* webpackChunkName: "md-ja" */ "../md/ja")).tos;
const privacyJa = async () => (await import(/* webpackChunkName: "md-ja" */ "../md/ja")).privacy;

@Component({ components: { tos, privacy, tosJa, privacyJa } })
export default class Markdown extends Vue {
  @Prop({ required: true, type: String })
  private readonly md!: string;
}

async function importMd(md: string) {
  try {
    const index = await import(/* webpackChunkName: "md-[request]" */ `../md/${GeneralModule.locale}/`);
    return index[md];
  } catch (error) {
    switch (md) {
      case "privacy":
        return await privacyJa();
      case "tos":
        return await tosJa();
    }
  }
}
</script>
