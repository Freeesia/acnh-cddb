<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-img :src="imageUrl"></v-img>
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
import { DesignInfo } from "../models/types";
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

  private get imageUrl() {
    switch (this.info.post.platform) {
      case "Instagram":
        return this.info.imageUrl;
      default:
        return this.info.imageUrl + "?name=large";
    }
  }

  private get instagramUrl() {
    return `https://www.instagram.com/p/${this.info.post.postId}/`;
  }
}
</script>
