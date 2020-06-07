<template>
  <v-container v-if="model">
    <v-row>
      <v-col cols="12">
        <v-img :src="imageUrl"></v-img>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <Tweet :id="model.post.postId" :options="options">
          <v-row align="center" justify="center">
            <v-progress-circular indeterminate size="100" color="primary"></v-progress-circular>
          </v-row>
        </Tweet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { firestore } from "firebase/app";
import { Prop } from "vue-property-decorator";
import "firebase/firestore";
import DocumentSnapshot = firestore.DocumentSnapshot;
import { DesignInfo } from "../models/types";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Tweet } = require("vue-tweet-embed");

@Component({ components: { Tweet } })
export default class DesignDetail extends Vue {
  @Prop()
  private doc!: DocumentSnapshot | null;

  private readonly options = {
    conversation: "none",
    lang: "ja",
  };

  private get model() {
    return this.doc?.data() as DesignInfo;
  }

  private get imageUrl() {
    return this.model.imageUrl + "?name=large";
  }
}
</script>
