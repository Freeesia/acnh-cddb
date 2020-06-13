<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-img :src="imageUrl"></v-img>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <Tweet :id="info.post.postId" :options="options">
          <v-row align="center" justify="center">
            <v-progress-circular indeterminate color="secondary" size="100"></v-progress-circular>
          </v-row>
        </Tweet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import "firebase/firestore";
import { DesignInfo } from "../models/types";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Tweet } = require("vue-tweet-embed");

@Component({ components: { Tweet } })
export default class DesignDetail extends Vue {
  @Prop()
  private info!: DesignInfo;

  private readonly options = {
    conversation: "none",
    lang: "ja",
  };

  private get imageUrl() {
    return this.info.imageUrl + "?name=large";
  }
}
</script>
