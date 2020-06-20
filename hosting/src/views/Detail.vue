<template>
  <v-container fluid>
    <DesignDetail v-if="info" :info="info"></DesignDetail>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { firestore } from "firebase/app";
import "firebase/firestore";
import DesignDetail from "../components/DesignDetail.vue";
import { DesignInfo } from "../../../core/src/models/types";

@Component({ components: { DesignDetail } })
export default class Detail extends Vue {
  private readonly db = firestore();
  private info: DesignInfo | null = null;

  @Prop({ required: true, type: String })
  private id!: string;

  private mounted() {
    this.getDoc();
  }

  private async getDoc() {
    const doc = await this.db.doc(`designs/${this.id}`).get();
    this.info = doc.data() as DesignInfo;
  }
}
</script>
