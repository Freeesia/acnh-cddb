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
        <v-select
          v-model="selectedColor"
          item-value="type"
          item-text="name"
          hide-details
          prepend-icon="palette"
          :items="colors"
          label="カラー"
          clearable
        >
          <template v-slot:selection="{ item }">
            <v-avatar class="mr-4" size="24" :color="item.type"></v-avatar>
            {{ item.name }}
          </template>
          <template v-slot:item="{ item }">
            <v-avatar class="mr-4" size="24" :color="item.type"></v-avatar>
            {{ item.name }}
          </template>
        </v-select>
      </v-col>
      <v-col cols="6">
        <v-select
          v-model="selectedType"
          hide-details
          prepend-icon="design_services"
          :items="types"
          label="カテゴリー"
          clearable
        />
      </v-col>
    </v-row>
    <v-row dense>
      <v-col v-for="design in designs" :key="design.id" cols="6" sm="3" md="2" lg="1">
        <DesignCard :info="design" @click="select" />
      </v-col>
    </v-row>
    <v-row v-if="next !== null" align="center" justify="center">
      <v-progress-circular v-intersect="onIntersect" indeterminate color="secondary" size="60"></v-progress-circular>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { firestore } from "firebase/app";
import "firebase/firestore";
import DesignCard from "../components/DesignCard.vue";
import DesignDetail from "../components/DesignDetail.vue";
import { SearchModule, GeneralModule } from "../store";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import { designsIndex } from "../../../core/src/algolia/init";
import { DesignInfo, ColorTypes, DesignTypes, ColorType, DesignType, ColorNames } from "../../../core/src/models/types";
import ColRef = firestore.CollectionReference;

@Component({ components: { DesignCard } })
export default class Home extends Vue {
  private readonly db = firestore();
  private readonly index = designsIndex;
  private designsRef?: ColRef<DesignInfo>;
  private designs: DesignInfo[] = [];
  private next: number | null = 0;
  private loading = false;
  private colors = ColorTypes.map(c => {
    return {
      name: ColorNames[c],
      type: c,
    };
  });
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

  private async refreshDesigns(init: boolean) {
    if (this.loading) {
      return;
    }
    this.loading = true;
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
      const doc = await this.designsRef.doc(info.designId).get();
      const data = doc.data();
      this.$dialog.show(DesignDetail, {
        info: data,
      });
    } else {
      this.$router.push({
        name: "detail",
        params: {
          id: info.designId,
        },
      });
    }
  }
}
</script>
