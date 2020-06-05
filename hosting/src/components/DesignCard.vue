<template>
  <v-card>
    <v-img contain :src="model.imageUrl"></v-img>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { firestore } from "firebase/app";
import "firebase/firestore";
import DocumentSnapshot = firestore.DocumentSnapshot;
import { Prop } from "vue-property-decorator";

@Component({})
export default class DesignCard extends Vue {
  @Prop({ required: true })
  private doc!: DocumentSnapshot;

  private get model() {
    return this.doc.data();
  }
}
</script>
