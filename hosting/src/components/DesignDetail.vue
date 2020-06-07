<template>
  <Tweet v-if="model" :id="model.post.postId"></Tweet>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { firestore } from "firebase/app";
import { Prop } from "vue-property-decorator";
import "firebase/firestore";
import DocumentSnapshot = firestore.DocumentSnapshot;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Tweet } = require("vue-tweet-embed");

@Component({ components: { Tweet } })
export default class DesignDetail extends Vue {
  @Prop()
  private doc: DocumentSnapshot | null = null;

  private get model() {
    return this.doc?.data();
  }
}
</script>
