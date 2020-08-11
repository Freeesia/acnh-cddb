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
      <v-col v-for="dream in dreams" :key="dream.dreamId" cols="12" sm="6" md="4">
        <DreamCard :info="dream" />
      </v-col>
    </v-row>
    <v-row v-if="next !== null" align="center" justify="center">
      <v-progress-circular v-intersect="onIntersect" indeterminate color="secondary" size="60"></v-progress-circular>
    </v-row>
  </v-container>
</template>
<style lang="scss" scoped>
.v-chip.v-size--small .v-avatar {
  height: 20px !important;
  min-width: 20px !important;
  width: 20px !important;
}
</style>
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { dreamsIndex } from "../../../core/src/algolia/lite";
import { DreamInfo } from "../../../core/src/models/types";
import { GeneralModule } from "../store";
import _ from "lodash";
import { Watch } from "vue-property-decorator";
import DreamCard from "../components/DreamCard.vue";

@Component({ components: { DreamCard } })
export default class Dreams extends Vue {
  private readonly index = dreamsIndex;
  private dreams: DreamInfo[] = [];
  private next: number | null = 0;
  private search = "";
  private tags: { name: string; count: number }[] = [];
  private showTagCount = 10;

  private selectedTags: string[] = [];

  private get selectableTags() {
    return _(this.tags)
      .take(this.showTagCount)
      .filter(t => !this.selectedTags.includes(t.name))
      .value();
  }

  mounted() {
    this.refreshDreams(true);
  }

  @Watch("selectedTags")
  @Watch("search")
  private async refreshDreams(init: boolean) {
    const facetFilters: string[][] = [];
    if (this.selectedTags.length > 0) {
      facetFilters.push(...this.selectedTags.map(t => [`tags:${t}`]));
    }
    GeneralModule.setLoading(true);
    let page = init ? 0 : this.next ?? 0;
    const res = await this.index.search<DreamInfo>(this.search, {
      facetFilters,
      page,
      facets: ["tags"],
      optionalWords: this.search,
    });
    this.next = ++page > res.nbPages ? null : page;
    if (init) {
      this.dreams = [];
    }
    this.tags = _(res.facets?.tags ?? {})
      .map((v, k) => ({ name: k, count: v }))
      .value();
    this.dreams.push(...res.hits);
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
      this.refreshDreams(false);
    }
  }
}
</script>
