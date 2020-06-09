<template>
  <v-card min-height="200" @click="click">
    <v-lazy min-height="200">
      <v-img contain :src="imageUrl">
        <template v-slot:placeholder>
          <v-row class="fill-height ma-0" align="center" justify="center">
            <v-icon size="80" color="grey">image</v-icon>
          </v-row>
        </template>
      </v-img>
    </v-lazy>
    <v-row>
      <v-col>
        <p>{{ model.designId }}</p>
      </v-col>
      <v-col cols="3">
        <v-btn :loading="faving" icon color="pink" @click.stop="fav">
          <v-icon>{{ faved ? "favorite" : "favorite_border" }}</v-icon>
        </v-btn>
      </v-col>
    </v-row>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { firestore } from "firebase/app";
import { Prop, Emit } from "vue-property-decorator";
import "firebase/firestore";
import { DesignInfo } from "../models/types";
import { AuthModule } from "../store";
import { assertIsDefined } from "../utilities/assert";
import DocumentSnapshot = firestore.DocumentSnapshot;
import DocRef = firestore.DocumentReference;
import FieldValue = firestore.FieldValue;

@Component({})
export default class DesignCard extends Vue {
  private readonly db = firestore();

  @Prop({ required: true })
  private doc!: DocumentSnapshot;

  @Prop({ required: true })
  private favs!: string[];
  private userRef!: DocRef;
  private faving = false;
  private faved = false;

  private get model() {
    return this.doc.data() as DesignInfo;
  }

  private get imageUrl() {
    return this.model.imageUrl + "?name=thumb";
  }

  private created() {
    const user = AuthModule.user;
    assertIsDefined(user);
    this.userRef = this.db.doc(`/users/${user.uid}`);
    this.checkFav();
  }

  @Emit()
  private click() {
    return this.doc;
  }

  private async checkFav() {
    this.faving = true;
    this.faved = this.favs.includes(this.doc.ref.path);
    this.faving = false;
  }

  private async fav() {
    this.faving = true;
    if (this.faved) {
      await this.userRef.update({
        favs: FieldValue.arrayRemove(this.doc.ref),
      });
    } else {
      await this.userRef.update({
        favs: FieldValue.arrayUnion(this.doc.ref),
      });
    }
    this.faved = !this.faved;
    this.faving = false;
  }
}
</script>
