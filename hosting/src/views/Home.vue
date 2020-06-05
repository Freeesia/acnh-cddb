<template>
  <v-container fluid>
    <v-row dense>
      <v-col v-for="design in designs" :key="design.id" cols="12">
        <DesignCard :doc="design" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { firestore } from "firebase/app";
import { sleep } from "../utilities/systemUtility";
import "firebase/firestore";
import DesignCard from "../components/DesignCard.vue";
import DocumentSnapshot = firestore.DocumentSnapshot;
import ColRef = firestore.CollectionReference;
import QuerySnapshot = firestore.QuerySnapshot;

@Component({ components: { DesignCard } })
export default class Home extends Vue {
  private db = firestore();
  private designsRef?: ColRef;
  private unsubscribe?: () => void;
  private designs: DocumentSnapshot[] = [];

  private created() {
    this.designsRef = this.db.collection("/designs");

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = this.designsRef.onSnapshot(this.onSnapshot);
  }

  private destroyed() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private async onSnapshot(ss: QuerySnapshot) {
    let count = 0;
    for (const change of ss.docChanges({ includeMetadataChanges: false })) {
      switch (change.type) {
        case "added":
          this.designs.splice(change.newIndex, 0, change.doc);
          break;
        case "removed":
          this.designs.splice(change.oldIndex, 1);
          break;
        case "modified":
          this.designs.splice(change.oldIndex, 1, change.doc);
          break;
        default:
          throw new Error();
      }
      if (++count % 10 == 0) {
        await this.$nextTick();
        await sleep(100);
      }
    }
  }
}
</script>
