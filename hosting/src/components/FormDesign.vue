<template>
  <div>
    <v-row align="center" justify="center">
      <v-img height="200" contain :src="target.imageUrls.large" :lazy-src="target.imageUrls.thumb2" class="secondary">
        <template v-slot:placeholder>
          <v-row class="fill-height ma-0" align="center" justify="center">
            <v-progress-circular indeterminate color="accent"></v-progress-circular>
          </v-row>
        </template>
      </v-img>
    </v-row>
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-text-field v-model="_title" :rules="[required]" required :label="$t('form.title')" />
      <v-select v-model="_designType" :items="designTypes" required :label="$t('form.type')" />
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
        :rules="[limitColorTypes]"
        deletable-chips
        chips
        dense
        multiple
        required
        :label="$t('color')"
      />
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
<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Model, Prop, PropSync, Watch } from "vue-property-decorator";
import { ColorType, ColorTypes, DesignType, DesignTypes, PostedMedia } from "../../../core/src/models/types";

@Component
export default class FormDesign extends Vue {
  @Prop({ required: true, type: Object })
  private target!: PostedMedia;
  @Model("change", { required: true })
  private _valid!: boolean;
  private designTypes = DesignTypes;
  private designIdMask = "DDDD-DDDD-DDDD";
  private colors = ColorTypes;
  private authorIdMask = "####-####-####";

  @PropSync("title", { required: true, type: String })
  private _title!: string;
  @PropSync("designId", { required: true, type: String })
  private _designId!: string;
  @PropSync("designType", { required: true, type: String })
  private _designType!: DesignType;
  @PropSync("dominantColorTypes", { required: true, type: Array })
  private _dominantColorTypes!: ColorType[];
  @PropSync("island", { required: true, type: String })
  private _island!: string;
  @PropSync("author", { required: true, type: String })
  private _author!: string;
  @PropSync("authorId", { required: true, type: String })
  private _authorId!: string;

  private authorError = false;
  private authorErrorMessage = "";

  private get valid() {
    return this._valid;
  }
  private set valid(v: boolean) {
    this.$emit("change", v);
  }

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
}
</script>
