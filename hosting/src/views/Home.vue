<template>
  <v-container fluid>
    <v-row dense>
      <v-text-field v-model="search" dense filled clearable prepend-inner-icon="search" label="検索"></v-text-field>
    </v-row>
    <v-row dense>
      <v-col v-for="design in filteredDesigns" :key="design.id" cols="12" sm="6" md="4" lg="3" xl="2">
        <DesignCard :doc="design" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { firestore } from "firebase/app";
import "firebase/firestore";
import DesignCard from "../components/DesignCard.vue";
import { assertIsDefined } from "../utilities/assert";
import { SearchModule } from "../store";
import DocumentSnapshot = firestore.DocumentSnapshot;
import ColRef = firestore.CollectionReference;
import QuerySnapshot = firestore.QuerySnapshot;
import { DesignInfo } from "../models/types";

@Component({ components: { DesignCard } })
export default class Home extends Vue {
  private readonly db = firestore();
  private designsRef?: ColRef;
  private unsubscribe?: () => void;
  private designs: DocumentSnapshot[] = [];

  private get search() {
    return SearchModule.text;
  }

  private set search(val: string) {
    SearchModule.setText(val);
  }

  private get filteredDesigns() {
    const text = SearchModule.text;
    if (text) {
      return this.designs.filter(v => {
        const data = v.data() as DesignInfo;
        if (!data) {
          return false;
        }
        return data.title.includes(text);
      });
    }
    return this.designs;
  }

  private created() {
    this.designsRef = this.db.collection("/designs");

    this.refreshDesigns();
  }

  private mounted() {
    this.$store.watch(
      state => state.search,
      () => {
        this.refreshDesigns();
      },
      { immediate: true, deep: true }
    );
  }

  private refreshDesigns() {
    assertIsDefined(this.designsRef);
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    let query = this.designsRef.orderBy("createdAt", "desc");
    // const color = SearchModule.color;
    const type = SearchModule.type;
    if (type) {
      query = query.where("designType", "==", type);
    }
    this.designs = [];
    this.unsubscribe = query.onSnapshot(this.onSnapshot);
  }

  private destroyed() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private async onSnapshot(ss: QuerySnapshot) {
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
    }
  }
}
</script>
