<template>
  <v-lazy min-height="360">
    <v-card>
      <v-carousel cycle interval="4000" height="360" hide-delimiter-background show-arrows-on-hover>
        <v-carousel-item v-for="(urls, i) in info.imageUrls" :key="i">
          <v-img height="360" :src="urls.large" :lazy-src="urls.thumb2" class="align-end">
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-icon size="80" color="grey">image</v-icon>
              </v-row>
            </template>
          </v-img>
        </v-carousel-item>
      </v-carousel>
      <v-card-actions>
        <div>
          <p class="ma-0 text-no-wrap text-truncate">{{ info.islandName }}</p>
          <p class="ma-0 text-no-wrap text-truncate">{{ info.dreamId }}</p>
        </div>
        <v-spacer></v-spacer>
        <v-btn v-if="sharable" icon @click="share">
          <v-icon>share</v-icon>
        </v-btn>
        <v-btn icon :href="tweetUrl" target="_brank">
          <v-fa :icon="['fab', 'twitter']" size="lg" :style="{ color: '#1DA1F2' }" />
        </v-btn>
        <v-btn class="ma-1 fav float-right" :loading="faving" icon color="pink" @click="fav">
          <v-icon>{{ faved ? "favorite" : "favorite_border" }}</v-icon>
        </v-btn>
      </v-card-actions>
      <v-card-text v-if="info.tags.length > 0" class="pa-1">
        <v-chip v-for="tag in info.tags" :key="tag" small color="primary lighten-2" class="mr-1 accent--text">
          <v-icon left small>tag</v-icon>
          {{ tag }}
        </v-chip>
      </v-card-text>
    </v-card>
  </v-lazy>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { DreamInfo } from "../../../core/src/models/types";
import { AuthModule } from "../store";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import { usersRef, db } from "../plugins/firestore";
import { firestore } from "firebase/app";
import "firebase/firestore";
import DocRef = firestore.DocumentReference;
import FieldValue = firestore.FieldValue;

@Component
export default class DreamCard extends Vue {
  private readonly sharable = navigator.share !== undefined;

  @Prop({ required: true })
  private info!: DreamInfo;
  private faving = false;
  private userRef!: DocRef;

  private get tweetUrl() {
    return "https://twitter.com/_/status/" + this.info.post.postId;
  }

  private get path() {
    return `dreams/${this.info.dreamId}`;
  }

  private get favs() {
    return AuthModule.info?.dreamFavs || [];
  }

  private get faved() {
    return this.favs.includes(this.path);
  }

  private created() {
    const user = AuthModule.user;
    assertIsDefined(user);
    this.userRef = usersRef.doc(user.uid);
  }

  private async fav() {
    this.faving = true;
    const ref = db.doc(this.path);
    const arrayFunc = this.faved ? FieldValue.arrayRemove : FieldValue.arrayUnion;
    await this.userRef.update({
      dreamFavs: arrayFunc(ref),
    });
    this.faving = false;
  }

  private share() {
    let text = "あつまれゆめみの⛪️ で見つけたよ！";
    if (this.info.islandName) {
      text += "\n島名: " + this.info.islandName;
    }
    text += `
${process.env.VUE_APP_DOMAIN}
#あつまれゆめみの⛪️ #ACNH #あつ森 #あつまれどうぶつの森`;
    navigator.share({
      title: this.info.islandName,
      text: text,
      url: this.tweetUrl,
    });
  }
}
</script>
