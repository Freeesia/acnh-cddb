<template>
  <div>
    <v-row align="center" justify="center">
      <v-img height="200" contain :src="target.imageUrls.large" :lazy-src="target.imageUrls.thumb2" class="secondary">
        <template v-slot:placeholder>
          <v-row class="fill-height ma-0" align="center" justify="center">
            <v-progress-circular indeterminate color="accent"></v-progress-circular>
          </v-row>
        </template>
        <template v-slot:default>
          <v-row v-if="recognizing" class="fill-height px-8 py-2" align="end" justify="start">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <span class="pa-2 accent--text">{{ $t("form.recognizing") }}</span>
          </v-row>
        </template>
      </v-img>
    </v-row>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-text-field v-model="_title" :rules="[required]" required :label="$t('form.title')" />
      <v-select
        v-model="_designType"
        :items="types"
        item-value="type"
        item-text="name"
        required
        :label="$t('form.type')"
      />
      <v-text-field
        v-model="_designId"
        v-facade="designIdMask"
        :rules="[required, countId]"
        prefix="MO-"
        required
        :label="$t('form.designId')"
      />
      <v-select
        v-model="_dominantColorTypes"
        :items="colors"
        item-value="type"
        item-text="name"
        :rules="[limitColorTypes]"
        deletable-chips
        small-chips
        multiple
        required
        :label="$t('color')"
      >
        <template v-slot:item="{ item, attrs }">
          <v-avatar class="mr-4 color-type" size="24" :color="getColor(item.type)">
            <v-icon v-if="attrs.inputValue">check</v-icon>
          </v-avatar>
          {{ item.name }}
        </template>
      </v-select>
      <v-combobox
        v-model="_tags"
        :items="selectableTags"
        item-value="value"
        item-text="highlighted"
        multiple
        small-chips
        clearable
        deletable-chips
        hide-selected
        :search-input.sync="tagSearch"
        :return-object="false"
        :label="$t('form.tag')"
      >
        <template v-slot:item="{ item }">
          <v-icon color="accent" small>tag</v-icon>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span class="tag" v-html="item.highlighted" />
          <v-spacer />
          <v-chip color="primary" small>{{ item.count }}</v-chip>
        </template>
      </v-combobox>
      <v-text-field
        v-model="_author"
        :error="authorError"
        :error-messages="authorErrorMessage"
        :label="$t('form.author')"
      />
      <v-text-field
        v-model="_island"
        :error="authorError"
        :error-messages="authorErrorMessage"
        :suffix="$t('islandSuffix')"
        :label="$t('form.island')"
      />
      <v-text-field
        v-model="_authorId"
        v-facade="authorIdMask"
        :error="authorError"
        :error-messages="authorErrorMessage"
        :rules="[countId]"
        prefix="MA-"
        :label="$t('form.authorId')"
      />
    </v-form>
  </div>
</template>
<style lang="scss" scoped>
span.tag ::v-deep > em {
  background-color: var(--v-secondary-base);
  color: var(--v-accent-base);
  font-weight: bold;
  font-style: normal;
}
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
import { Model, Prop, PropSync, Watch } from "vue-property-decorator";
import { designsIndex } from "../../../core/src/algolia/lite";
import { ColorType, ColorTypes, DesignType, DesignTypes, PostedMedia } from "../../../core/src/models/types";
import { getColor } from "../modules/color";
import { FacetHit } from "@algolia/client-search";
import Axios from "axios";
import { TesseractModule } from "../store";

@Component
export default class FormDesign extends Vue {
  @Prop({ required: true, type: Object })
  private target!: PostedMedia;
  @Model("change", { required: true })
  private _valid!: boolean;
  private designIdMask = "DDDD-DDDD-DDDD";
  private authorIdMask = "####-####-####";
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
  private selectableTags: FacetHit[] = [];

  @PropSync("title", { required: true, type: String })
  private _title!: string;
  @PropSync("designId", { required: true, type: String })
  private _designId!: string;
  @PropSync("designType", { required: true, type: String })
  private _designType!: DesignType;
  @PropSync("dominantColorTypes", { required: true, type: Array })
  private _dominantColorTypes!: ColorType[];
  @PropSync("tags", { required: true, type: Array })
  private _tags!: string[];
  @PropSync("island", { required: true, type: String })
  private _island!: string;
  @PropSync("author", { required: true, type: String })
  private _author!: string;
  @PropSync("authorId", { required: true, type: String })
  private _authorId!: string;

  private authorError = false;
  private authorErrorMessage = "";

  private tagSearch = "";

  private recognizing = false;

  private get valid() {
    return this._valid;
  }
  private set valid(v: boolean) {
    this.$emit("change", v);
  }

  private async created() {}

  private required(v?: string) {
    return !!v || this.$t("form.required");
  }

  private countId(v?: string) {
    return !v || v.length === 14 || this.$t("form.idCount");
  }

  private limitColorTypes(v: ColorType[]) {
    return v.length <= 2 || this.$t("form.colorLimit");
  }

  validate(): boolean {
    const form = this.$refs.form as any;
    return form.validate();
  }

  @Watch("_island")
  @Watch("_author")
  @Watch("_authorId")
  private checkAllAuthorInfo() {
    const authors = [this._island, this._author, this._authorId];
    this.authorError = !(authors.every(v => v) || authors.every(v => !v));
    if (this.authorError) {
      this.authorErrorMessage = this.$t("form.authorRequired").toString();
    } else {
      this.authorErrorMessage = "";
    }
  }

  @Watch("_tags")
  private tagSelected() {
    this.tagSearch = "";
  }

  @Watch("tagSearch")
  private async searchTags(search?: string | null) {
    const res = await designsIndex.searchForFacetValues("tags", search ?? "", {
      maxFacetHits: 20,
    });
    this.selectableTags = res.facetHits;
  }

  @Watch("target", { immediate: true })
  private async recognizeImage() {
    const url = this.target?.imageUrls?.large;
    if (!url) {
      return;
    }
    this.recognizing = true;
    try {
      const [{ data: blob }, worker] = await Promise.all([
        Axios.get<Blob>(url, { responseType: "blob" }),
        TesseractModule.getWorker(),
      ]);
      const file = new File([blob], "hoge");
      const {
        data: { words },
      } = await worker.recognize(file);
      const id = words.find(w => w.text.startsWith("M0-"));
      if (id) {
        this._designId = id.text.slice(3) ?? "";
      }
      const author = words.find(w => w.text.startsWith("MA-"));
      if (author) {
        this._authorId = author.text.slice(3) ?? "";
      }
    } catch (error) {
      this.$dialog.notify.error(error);
    }
    this.recognizing = false;
  }
}
</script>
