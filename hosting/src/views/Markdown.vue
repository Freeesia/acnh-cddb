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
import i18n from "../plugins/i18n";
const tos = () => importMd("tos");
const privacy = () => importMd("privacy");
const tosJa = () => import("../md/ja/tos.md");
const privacyJa = () => import("../md/ja/privacy.md");

@Component({ components: { tos, privacy, tosJa, privacyJa } })
export default class Markdown extends Vue {
  @Prop({ required: true, type: String })
  private readonly md!: string;
}

async function importMd(md: string) {
  try {
    return await import(`../md/${GeneralModule.locale}/${md}.md`);
  } catch (error) {
    return await import(`../md/${i18n.fallbackLocale}/${md}.md`);
  }
}
</script>
