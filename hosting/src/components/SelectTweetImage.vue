<template>
  <v-row dense>
    <v-col v-for="media in posts" :key="media.post.postId" cols="4">
      <v-card flat tile @click="select(media)">
        <v-img :src="media.imageUrls.thumb2" :lazy-src="media.imageUrls.thumb1" aspect-ratio="1" class="secondary">
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular indeterminate color="accent"></v-progress-circular>
            </v-row>
          </template>
        </v-img>
      </v-card>
    </v-col>
  </v-row>
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

  async getImages(token: string, secret: string) {
    const res = (await getTweetImages({ token, secret })) as UserMediaTweets;
    this.posts = res.posts;
  }

  @Emit()
  private select(media: PostedMedia) {
    return media;
  }
}
</script>
