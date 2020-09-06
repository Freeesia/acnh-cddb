<template>
  <v-container fluid>
    <v-row dense class="px-4">
      <v-col cols="12" md="6">
        <v-text-field
          v-model="search"
          hide-details
          dense
          filled
          clearable
          prepend-inner-icon="search"
          :label="$t('search')"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="selectedColors"
          item-value="type"
          item-text="name"
          hide-details
          prepend-icon="palette"
          :items="colors"
          multiple
          :label="$t('color')"
          clearable
        >
          <template v-slot:selection="{ item }">
            <v-avatar class="mr-1 color-type" size="24" :color="getColor(item.type)"></v-avatar>
          </template>
          <template v-slot:item="{ item, attrs }">
            <v-avatar class="mr-4 color-type" size="24" :color="getColor(item.type)">
              <v-icon v-if="attrs.inputValue">check</v-icon>
            </v-avatar>
            {{ item.name }}
          </template>
        </v-select>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="selectedTypes"
          item-value="type"
          item-text="name"
          hide-details
          prepend-icon="design_services"
          :items="types"
          multiple
          :label="$t('category')"
          clearable
        >
          <template v-slot:selection="{ item, index }">
            <span v-if="index === 0">{{ item.name }}</span>
            <span v-if="index === 1" class="grey--text caption">(+{{ selectedTypes.length - 1 }})</span>
          </template>
        </v-select>
      </v-col>
      <v-col cols="12">
        <v-chip v-for="tag in selectedTags" :key="tag" small color="primary" class="ma-1" @click="remTag(tag)">
          <v-icon left small>tag</v-icon>
          {{ tag }}
          <v-avatar right color="secondary">
            <v-icon small>check</v-icon>
          </v-avatar>
        </v-chip>
        <v-chip
          v-for="tag in selectableTags"
          :key="tag.name"
          small
          color="primary lighten-2"
          class="ma-1 accent--text"
          @click="addTag(tag.name)"
        >
          <v-icon left small>tag</v-icon>
          {{ tag.name }}
          <v-avatar right color="secondary lighten-2">
            {{ tag.count }}
          </v-avatar>
        </v-chip>
        <v-chip
          v-if="showTagCount < tags.length"
          small
          color="primary lighten-2"
          class="ma-1 accent--text"
          @click="showTagCount += 10"
        >
          ...more
        </v-chip>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col v-for="design in designs" :key="design.id" cols="6" sm="3" md="2">
        <DesignCard v-long-press="300" :info="design" @click="select" @long-press-start="onLongPressStart(design)" />
      </v-col>
    </v-row>
    <v-row v-if="next !== null" align="center" justify="center">
      <v-progress-circular v-intersect="onIntersect" indeterminate color="secondary" size="60"></v-progress-circular>
    </v-row>
    <DesignListSheet v-if="selecting" v-model="sheet" :info="selecting" />
  </v-container>
</template>
<style lang="scss" scoped>
.v-chip.v-size--small .v-avatar {
  height: 20px !important;
  min-width: 20px !important;
  width: 20px !important;
}
.color-type {
  border: solid 1px gray !important;
}
.primary--text .color-type {
  border-color: var(--v-primary-base) !important;
}
.transparent {
  background: whitesmoke;
  background-image: linear-gradient(45deg, darkgray 25%, transparent 0),
    linear-gradient(45deg, transparent 75%, darkgray 0), linear-gradient(45deg, darkgray 25%, transparent 0),
    linear-gradient(45deg, transparent 75%, darkgray 0);
  background-size: 10px 10px;
  background-position: 0 0, 15px 15px, 15px 15px, 30px 30px;
}
</style>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { firestore } from "firebase/app";
import "firebase/firestore";
import DesignCard from "../components/DesignCard.vue";
import DesignDetail from "../components/DesignDetail.vue";
import DesignListSheet from "../components/DesignListSheet.vue";
import { GeneralModule } from "../store";
import { getColor } from "../modules/color";
import { flatQuery } from "../modules/utility";
import { assertIsDefined } from "../../../core/src/utilities/assert";
import { designsIndex } from "../../../core/src/algolia/lite";
import { DesignInfo, ColorTypes, DesignTypes, ColorType, DesignType } from "../../../core/src/models/types";
import ColRef = firestore.CollectionReference;
import _ from "lodash";
import LongPress from "vue-directive-long-press";

@Component({ components: { DesignCard, DesignListSheet }, directives: { LongPress } })
export default class Home extends Vue {
  private readonly db = firestore();
  private readonly index = designsIndex;
  private designsRef?: ColRef<DesignInfo>;
  private designs: DesignInfo[] = [];
  private next: number | null = 0;
  private getColor = getColor;
  private colors = ColorTypes.map(c => {
    return {
      name: this.$t("colors." + c),
      type: c,
    };
  });
  private types = DesignTypes.map(c => {
    return {
      name: this.$t("designTypes." + c),
      type: c,
    };
  });
  private tags: { name: string; count: number }[] = [];
  private showTagCount = 10;

  private search = "";
  private selectedColors: ColorType[] = [];
  private selectedTypes: DesignType[] = [];
  private selectedTags: string[] = [];
  private sheet = false;
  private selecting: DesignInfo | null = null;

  private get selectableTags() {
    return _(this.tags)
      .take(this.showTagCount)
      .filter(t => !this.selectedTags.includes(t.name))
      .value();
  }

  private created() {
    this.designsRef = this.db.collection("/designs") as ColRef<DesignInfo>;
    const debounce = _.debounce(this.onSearchChanged);
    this.$watch("search", debounce);
    this.$watch("selectedColors", debounce);
    this.$watch("selectedTypes", debounce);
    this.$watch("selectedTags", debounce);
  }

  private mounted() {
    this.analyzeQuery();
  }

  private analyzeQuery() {
    const search = this.$route.query.search;
    if (typeof search === "string") {
      this.search = search;
    } else if (search) {
      this.search = search.join(" ");
    }
    this.selectedColors = _(flatQuery(this.$route.query.color))
      .map(t => t as ColorType)
      .filter(t => t !== null && ColorTypes.includes(t))
      .uniq()
      .value();
    this.selectedTypes = _(flatQuery(this.$route.query.type))
      .map(t => t as DesignType)
      .filter(t => t !== null && DesignTypes.includes(t))
      .uniq()
      .value();
    this.selectedTags = _(flatQuery(this.$route.query.tag)).uniq().value();
  }

  private onSearchChanged() {
    const query = {
      search: this.search ? this.search : undefined,
      color: this.selectedColors,
      type: this.selectedTypes,
      tag: this.selectedTags,
    };
    if (_.isEqual(this.$route.query, query)) {
      return;
    }
    this.$router.replace({
      name: "home",
      query,
      replace: true,
    });
    this.refreshDesigns(true);
  }

  private async refreshDesigns(init: boolean) {
    const facetFilters: string[][] = [];
    if (this.selectedTypes.length > 0) {
      facetFilters.push(this.selectedTypes.map(t => `designType:${t}`));
    }
    if (this.selectedColors.length > 0) {
      facetFilters.push(this.selectedColors.map(t => `dominantColorTypes:${t}`));
    }
    if (this.selectedTags.length > 0) {
      facetFilters.push(...this.selectedTags.map(t => [`tags:${t}`]));
    }
    const search = this.search ?? "";
    GeneralModule.setLoading(true);
    let page = init ? 0 : this.next ?? 0;
    const res = await this.index.search<DesignInfo>(search, {
      facetFilters,
      page,
      facets: ["tags"],
      optionalWords: search,
    });
    this.next = ++page > res.nbPages ? null : page;
    if (init) {
      this.designs = [];
    }
    this.tags = _(res.facets?.tags ?? {})
      .map((v, k) => ({ name: k, count: v }))
      .value();
    this.designs.push(...res.hits);
    GeneralModule.setLoading(false);
  }

  private addTag(tag: string) {
    this.showTagCount = 10;
    this.selectedTags.push(tag);
  }

  private remTag(tag: string) {
    this.showTagCount = 10;
    this.selectedTags = this.selectedTags.filter(t => t !== tag);
  }

  private async onIntersect(e: IntersectionObserverEntry[]) {
    if (e[0].isIntersecting) {
      this.refreshDesigns(false);
    }
  }

  private async select(info: DesignInfo) {
    if (this.sheet) {
      return;
    }
    this.$gtag.event("select_item", {
      items: [
        {
          item_id: info.designId,
          item_name: info.title,
          item_category: info.designType,
          item_brand: info.author?.authorId,
        },
      ],
    });
    assertIsDefined(this.designsRef);
    if (this.$vuetify.breakpoint.smAndUp) {
      const doc = await this.designsRef.doc(info.designId).get();
      const data = doc.data();
      this.$dialog.show(DesignDetail, {
        info: data,
        width: 600,
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

  private onLongPressStart(info: DesignInfo) {
    this.selecting = info;
    this.sheet = true;
  }
}
</script>
