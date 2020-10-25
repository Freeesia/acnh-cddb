<template>
  <div>
    <v-row dense>
      <v-col v-for="media in posts" :key="media.id" cols="4">
        <v-card flat tile @click="select(media)">
          <v-img :src="media.imageUrls.thumb2" :lazy-src="media.imageUrls.thumb1" aspect-ratio="1" class="secondary">
            <template #placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="accent"></v-progress-circular>
              </v-row>
            </template>
          </v-img>
        </v-card>
      </v-col>
    </v-row>
    <v-row class="ma-2">
      <v-btn :loading="getting" @click="_getImages">More...</v-btn>
    </v-row>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Emit } from "vue-property-decorator";
import { PostedMedia, UserMediaTweets } from "../../../core/src/models/types";
import { getTweetImages } from "../plugins/functions";

@Component
export default class SelectTweetImage extends Vue {
  private posts: PostedMedia[] = [];
  private getting = false;
  private token = "";
  private secret = "";
  private maxId = "";

  async getImages(token: string, secret: string) {
    this.token = token;
    this.secret = secret;
    await this._getImages();
  }

  private async _getImages() {
    this.getting = true;
    const res = (await getTweetImages({
      token: this.token,
      secret: this.secret,
      maxId: this.maxId,
    })) as UserMediaTweets;
    this.posts.push(...res.posts);
    this.maxId = res.sinceId;
    this.getting = false;
  }

  @Emit()
  private select(media: PostedMedia) {
    return media;
  }
}
</script>
