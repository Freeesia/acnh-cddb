<template>
  <v-lazy min-height="240">
    <v-card @click="click">
      <v-img height="180" :src="src" :lazy-src="lazySrc" class="align-end">
        <template #placeholder>
          <v-row class="fill-height ma-0" align="center" justify="center">
            <v-icon size="80" color="grey">image</v-icon>
          </v-row>
        </template>
        <v-btn
          v-if="viewDownloaded"
          class="ma-1 fav float-left"
          :loading="downloading"
          icon
          :color="isDownloaded ? 'primary' : 'blue'"
          @click.stop="download"
        >
          <v-icon>{{ isDownloaded ? "cloud_done" : "cloud_download" }}</v-icon>
        </v-btn>
        <v-btn class="ma-1 fav float-right" :loading="faving" icon color="pink" @click.stop="fav">
          <v-icon>{{ faved ? "favorite" : "favorite_border" }}</v-icon>
        </v-btn>
      </v-img>
      <v-card-subtitle class="pa-2">
        <p class="ma-0 text-no-wrap text-truncate">{{ info.designId }}</p>
        <p class="ma-0 text-no-wrap text-truncate">{{ info.title }}</p>
      </v-card-subtitle>
    </v-card>
  </v-lazy>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { firestore } from "firebase/app";
import { Prop, Emit } from "vue-property-decorator";
import "firebase/firestore";
import { AuthModule } from "../store";
import { DesignInfo } from "../../../core/src/models/types";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import { favDesign } from "../modules/gtag";
import DocRef = firestore.DocumentReference;
import FieldValue = firestore.FieldValue;

@Component({})
export default class DesignCard extends Vue {
  private readonly db = firestore();

  @Prop({ required: true })
  private info!: DesignInfo;
  @Prop({ type: Boolean, default: false })
  private viewDownloaded!: boolean;
  private userRef!: DocRef;
  private faving = false;
  private downloading = false;

  private get src() {
    return this.info.imageUrls.thumb2;
  }

  private get lazySrc() {
    return this.info.imageUrls.thumb1;
  }

  private get path() {
    return `designs/${this.info.designId}`;
  }

  private get favs() {
    return AuthModule.info?.favs || [];
  }

  private get downloaded() {
    return AuthModule.info?.downloaded || [];
  }

  private get faved() {
    return this.favs.includes(this.path);
  }

  private get isDownloaded() {
    return this.downloaded.includes(this.path);
  }

  private created() {
    const user = AuthModule.user;
    assertIsDefined(user);
    this.userRef = this.db.doc(`/users/${user.uid}`);
  }

  @Emit()
  private click() {
    return this.info;
  }

  private async fav() {
    this.faving = true;
    const ref = this.db.doc(this.path);
    const arrayFunc = this.faved ? FieldValue.arrayRemove : FieldValue.arrayUnion;
    favDesign(this.$gtag, this.info, !this.faved);
    await this.userRef.update({
      favs: arrayFunc(ref),
    });
    this.faving = false;
  }

  private async download() {
    this.downloading = true;
    const ref = this.db.doc(this.path);
    const arrayFunc = this.isDownloaded ? FieldValue.arrayRemove : FieldValue.arrayUnion;
    await this.userRef.update({
      downloaded: arrayFunc(ref),
    });
    this.downloading = false;
  }
}
</script>

<style lang="scss" scoped>
.fav {
  background-color: rgba(255, 255, 255, 0.8);
}
</style>
