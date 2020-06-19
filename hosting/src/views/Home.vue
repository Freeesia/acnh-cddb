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
      <v-col v-for="design in designs" :key="design.id" cols="6" sm="3" md="2" lg="1">
        <DesignCard :info="design" :favs="favs" @click="select" />
      </v-col>
    </v-row>
    <v-row v-if="next !== null" align="center" justify="center">
      <v-progress-circular v-intersect="onIntersect" indeterminate color="secondary" size="60"></v-progress-circular>
    </v-row>
    <v-dialog v-if="$vuetify.breakpoint.smAndUp" v-model="dialog" width="500px">
      <v-card>
        <v-toolbar flat dense>
          <v-spacer></v-spacer>
          <v-btn icon @click="close">
            <v-icon>close</v-icon>
          </v-btn>
        </v-toolbar>
        <DesignDetail v-if="selected" :info="selected"></DesignDetail>
        <v-row v-else align="center" justify="center">
          <v-progress-circular indeterminate color="secondary" size="100"></v-progress-circular>
        </v-row>
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
import { designsIndex } from "../utilities/algolia";
import { SearchModule, GeneralModule, AuthModule } from "../store";
import { DesignInfo, ColorType, DesignType, ColorTypes, DesignTypes } from "../models/types";
import ColRef = firestore.CollectionReference;
import DocRef = firestore.DocumentReference;

@Component({ components: { DesignCard, DesignDetail } })
export default class Home extends Vue {
  private readonly db = firestore();
  private readonly index = designsIndex;
  private designsRef?: ColRef<DesignInfo>;
  private designs: DesignInfo[] = [];
  private selected: DesignInfo | null = null;
  private dialog = false;
  private favs: string[] = [];
  private next: number | null = 0;
  private loading = false;
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

  private created() {
    this.designsRef = this.db.collection("/designs") as ColRef<DesignInfo>;
    this.getUserInfo();
  }

  private mounted() {
    this.$store.watch(
      state => state.search,
      () => {
        this.refreshDesigns(true);
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
    this.favs.push(...favs.map(f => f.id));
  }

  private async refreshDesigns(init: boolean) {
    if (this.loading) {
      return;
    }
    this.loading = true;
    assertIsDefined(this.designsRef);
    const facetFilters: string[] = [];
    if (this.selectedType) {
      facetFilters.push(`designType:${this.selectedType}`);
    }
    if (this.selectedColor) {
      facetFilters.push(`dominantColorTypes:${this.selectedColor}`);
    }
    GeneralModule.setLoading(true);
    let page = init ? 0 : this.next ?? 0;
    const res = await this.index.search<DesignInfo>(this.search, {
      facetFilters,
      page,
    });
    this.next = ++page > res.nbPages ? null : page;
    if (init) {
      this.designs = [];
    }
    this.designs.push(...res.hits);
    GeneralModule.setLoading(false);
    this.loading = false;
  }

  private async onIntersect(e: IntersectionObserverEntry[]) {
    if (e[0].isIntersecting) {
      this.refreshDesigns(false);
    }
  }

  private async select(info: DesignInfo) {
    assertIsDefined(this.designsRef);
    if (this.$vuetify.breakpoint.smAndUp) {
      this.dialog = true;
      const doc = await this.designsRef.doc(info.designId).get();
      const data = doc.data();
      this.selected = data ?? null;
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
