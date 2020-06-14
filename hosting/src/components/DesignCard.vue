<template>
  <v-lazy min-height="240">
    <v-card @click="click">
      <v-img height="180" :src="src" :lazy-src="lazySrc" class="align-end">
        <template v-slot:placeholder>
          <v-row class="fill-height ma-0" align="center" justify="center">
            <v-icon size="80" color="grey">image</v-icon>
          </v-row>
        </template>
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

<style lang="scss" scoped>
.fav {
  background-color: rgba(255, 255, 255, 0.8);
}
</style>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { firestore } from "firebase/app";
import { Prop, Emit } from "vue-property-decorator";
import "firebase/firestore";
import { DesignInfo } from "../models/types";
import { AuthModule } from "../store";
import { assertIsDefined } from "../utilities/assert";
import DocRef = firestore.DocumentReference;
import FieldValue = firestore.FieldValue;

@Component({})
export default class DesignCard extends Vue {
  private readonly db = firestore();

  @Prop({ required: true })
  private info!: DesignInfo;

  @Prop()
  private favs?: string[];
  private userRef!: DocRef;
  private faving = false;
  private faved = false;

  private get src() {
    switch (this.info.post.platform) {
      case "Instagram":
        return this.info.thumbUrl;
      default:
        return this.info.imageUrl + "?name=small";
    }
  }

  private get lazySrc() {
    switch (this.info.post.platform) {
      case "Instagram":
        return "";
      default:
        return this.info.imageUrl + "?name=thumb";
    }
  }

  private get path() {
    return `/designs/${this.info.designId}`;
  }

  private created() {
    const user = AuthModule.user;
    assertIsDefined(user);
    this.userRef = this.db.doc(`/users/${user.uid}`);
    this.checkFav();
  }

  @Emit()
  private click() {
    return this.info;
  }

  private async checkFav() {
    if (!this.favs) {
      return;
    }
    this.faving = true;
    this.faved = this.favs.includes(this.path);
    this.faving = false;
  }

  private async fav() {
    this.faving = true;
    if (this.faved) {
      await this.userRef.update({
        favs: FieldValue.arrayRemove(this.db.doc(this.path)),
      });
    } else {
      await this.userRef.update({
        favs: FieldValue.arrayUnion(this.db.doc(this.path)),
      });
    }
    this.faved = !this.faved;
    this.faving = false;
  }
}
</script>
