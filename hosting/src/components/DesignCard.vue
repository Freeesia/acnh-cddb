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
import { AuthModule } from "../store";
import { DesignInfo } from "../../../core/src/models/types";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import DocRef = firestore.DocumentReference;
import FieldValue = firestore.FieldValue;

@Component({})
export default class DesignCard extends Vue {
  private readonly db = firestore();

  @Prop({ required: true })
  private info!: DesignInfo;
  private userRef!: DocRef;
  private faving = false;

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
    return AuthModule.info?.favs ?? [];
  }

  private get faved() {
    return this.favs.includes(this.path);
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
    if (this.faved) {
      await this.userRef.update({
        favs: FieldValue.arrayRemove(this.db.doc(this.path)),
      });
    } else {
      await this.userRef.update({
        favs: FieldValue.arrayUnion(this.db.doc(this.path)),
      });
    }
    this.faving = false;
  }
}
</script>
