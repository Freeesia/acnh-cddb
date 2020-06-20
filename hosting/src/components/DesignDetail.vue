<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-img :src="src" :lazy-src="lazySrc">
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular indeterminate color="secondary" size="100"></v-progress-circular>
            </v-row>
          </template>
        </v-img>
      </v-col>
    </v-row>
    <v-row>
      <v-col v-if="info.post.platform !== 'Instagram'" cols="12">
        <Tweet :id="info.post.postId" :options="options">
          <v-row align="center" justify="center">
            <v-progress-circular indeterminate color="secondary" size="100"></v-progress-circular>
          </v-row>
        </Tweet>
      </v-col>
      <v-col v-if="info.post.platform === 'Instagram'" align="center" cols="12">
        <instagram-embed :url="instagramUrl" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import InstagramEmbed from "vue-instagram-embed";
import { Prop } from "vue-property-decorator";
import "firebase/firestore";
import { DesignInfo } from "../../../core/src/models/types";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Tweet } = require("vue-tweet-embed");

@Component({ components: { Tweet, InstagramEmbed } })
export default class DesignDetail extends Vue {
  @Prop()
  private info!: DesignInfo;

  private readonly options = {
    conversation: "none",
    lang: "ja",
  };

  private get src() {
    return this.info.imageUrls.large;
  }

  private get lazySrc() {
    return this.info.imageUrls.thumb2;
  }

  private get instagramUrl() {
    return `https://www.instagram.com/p/${this.info.post.postId}/`;
  }
}
</script>
