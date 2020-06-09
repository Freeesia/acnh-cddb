<template>
  <v-container fluid>
    <v-row dense>
      <v-text-field v-model="search" dense filled clearable prepend-inner-icon="search" label="検索"></v-text-field>
    </v-row>
    <v-row dense>
      <v-col v-for="design in filteredDesigns" :key="design.id" cols="6" sm="3" md="2" lg="1">
        <DesignCard :doc="design" :favs="favs" @click="select" />
      </v-col>
    </v-row>
    <v-dialog v-model="dialog" width="500px" :fullscreen="$vuetify.breakpoint.xsOnly">
      <v-card>
        <v-toolbar flat dense>
          <v-spacer></v-spacer>
          <v-btn icon @click="close">
            <v-icon>close</v-icon>
          </v-btn>
        </v-toolbar>
        <DesignDetail :doc="selected"></DesignDetail>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { firestore } from "firebase/app";
import "firebase/firestore";
import DesignCard from "../components/DesignCard.vue";
import { assertIsDefined } from "../utilities/assert";
import { SearchModule, GeneralModule, AuthModule } from "../store";
import DocumentSnapshot = firestore.DocumentSnapshot;
import ColRef = firestore.CollectionReference;
import QuerySnapshot = firestore.QuerySnapshot;
import DocRef = firestore.DocumentReference;
import { DesignInfo } from "../models/types";
import DesignDetail from "../components/DesignDetail.vue";

@Component({ components: { DesignCard, DesignDetail } })
export default class Home extends Vue {
  private readonly db = firestore();
  private designsRef?: ColRef;
  private unsubscribe?: () => void;
  private designs: DocumentSnapshot[] = [];
  private selected: DocumentSnapshot | null = null;
  private dialog = false;
  private favs: string[] = [];

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
    this.getUserInfo();
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

  private async getUserInfo() {
    const user = AuthModule.user;
    assertIsDefined(user);
    const userInfoRef = this.db.doc(`/users/${user.uid}`);
    const userInfoSs = await userInfoRef.get();
    const favs = userInfoSs.get("favs") as DocRef[];
    this.favs = favs.map(f => f.path);
  }

  private refreshDesigns() {
    assertIsDefined(this.designsRef);
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    let query = this.designsRef.orderBy("createdAt", "desc");
    const color = SearchModule.color;
    if (color) {
      query = query.where("dominantColorTypes", "array-contains", color);
    }
    const type = SearchModule.type;
    if (type) {
      query = query.where("designType", "==", type);
    }
    this.designs = [];
    GeneralModule.setLoading(true);
    this.unsubscribe = query.onSnapshot(this.onSnapshot);
  }

  private destroyed() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private async onSnapshot(ss: QuerySnapshot) {
    GeneralModule.setLoading(false);
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

  private select(doc: DocumentSnapshot) {
    this.selected = doc;
    this.dialog = true;
  }

  private close() {
    this.dialog = false;
    this.selected = null;
  }
}
</script>
