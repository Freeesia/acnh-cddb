<template>
  <v-card min-height="200">
    <v-lazy min-height="200">
      <v-img contain :src="model.imageUrl">
        <template v-slot:placeholder>
          <v-row class="fill-height ma-0" align="center" justify="center">
            <v-icon size="80" color="grey">image</v-icon>
          </v-row>
        </template>
      </v-img>
    </v-lazy>
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
