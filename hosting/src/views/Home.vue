<template>
  <v-container fluid>
    <v-row dense>
      <v-col cols="12">
        <v-text-field
          v-model="search"
          hide-details
          dense
          filled
          clearable
          prepend-inner-icon="search"
          label="検索"
        ></v-text-field>
      </v-col>
      <v-col cols="6">
        <v-combobox v-model="selectedColor" :items="colors" label="カラー" clearable></v-combobox>
      </v-col>
      <v-col cols="6">
        <v-combobox v-model="selectedType" :items="types" label="カテゴリー" clearable></v-combobox>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col v-for="design in filteredDesigns" :key="design.id" cols="6" sm="3" md="2" lg="1">
        <DesignCard :info="design" :favs="favs" @click="select" />
      </v-col>
    </v-row>
    <v-dialog v-if="selected" v-model="dialog" width="500px">
      <v-card>
        <v-toolbar flat dense>
          <v-spacer></v-spacer>
          <v-btn icon @click="close">
            <v-icon>close</v-icon>
          </v-btn>
        </v-toolbar>
        <DesignDetail :info="selected"></DesignDetail>
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
import DesignDetail from "../components/DesignDetail.vue";
import { assertIsDefined } from "../utilities/assert";
import { SearchModule, GeneralModule, AuthModule } from "../store";
import { DesignInfo, ColorType, DesignType, ColorTypes, DesignTypes } from "../models/types";
import ColRef = firestore.CollectionReference;
import DocRef = firestore.DocumentReference;

@Component({ components: { DesignCard, DesignDetail } })
export default class Home extends Vue {
  private readonly db = firestore();
  private designsRef?: ColRef;
  private designs: DesignInfo[] = [];
  private selected: DesignInfo | null = null;
  private dialog = false;
  private favs: string[] = [];
  private colors = ColorTypes;
  private types = DesignTypes;

  private get search() {
    return SearchModule.text;
  }

  private set search(val: string) {
    SearchModule.setText(val);
  }

  private get selectedColor(): ColorType {
    return SearchModule.color as ColorType;
  }

  private set selectedColor(val: ColorType) {
    SearchModule.setColor(val);
  }

  private get selectedType() {
    return SearchModule.type as DesignType;
  }

  private set selectedType(val: DesignType) {
    SearchModule.setType(val);
  }

  private get filteredDesigns() {
    const text = SearchModule.text;
    if (text) {
      return this.designs.filter(v => {
        return v.title.includes(text);
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
      { deep: true }
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

  private async refreshDesigns() {
    assertIsDefined(this.designsRef);
    let query = this.designsRef.orderBy("createdAt", "desc");
    const color = SearchModule.color;
    if (color) {
      query = query.where("dominantColorTypes", "array-contains", color);
    }
    const type = SearchModule.type;
    if (type) {
      query = query.where("designType", "==", type);
    }
    GeneralModule.setLoading(true);
    if (this.$firebaseRefs && this.$firebaseRefs["designs"]) {
      this.$unbind("designs");
    }
    query = query.limit(100);
    await this.$bind("designs", query);
    GeneralModule.setLoading(false);
  }

  private select(info: DesignInfo) {
    if (this.$vuetify.breakpoint.smAndUp) {
      this.selected = info;
      this.dialog = true;
    } else {
      this.$router.push({
        name: "detail",
        params: {
          id: info.designId,
        },
      });
    }
  }

  private close() {
    this.dialog = false;
    this.selected = null;
  }
}
</script>
