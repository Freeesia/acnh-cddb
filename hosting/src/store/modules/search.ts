import { VuexModule, Mutation, Module } from "vuex-module-decorators";
import { ColorType, DesignType } from "../../../../core/src/models/types";

@Module({ namespaced: true, name: "search" })
export default class Search extends VuexModule {
  types: DesignType[] = [];
  colors: ColorType[] = [];
  tags: string[] = [];
  text = "";

  @Mutation
  setTypes(value: DesignType[]) {
    this.types = value;
  }

  @Mutation
  setColors(value: ColorType[]) {
    this.colors = value;
  }

  @Mutation
  setText(value?: string) {
    this.text = value ?? "";
  }

  @Mutation
  addTag(value: string) {
    this.tags.push(value);
  }

  @Mutation
  remTag(value: string) {
    this.tags = this.tags.filter(t => t !== value);
  }

  @Mutation
  setTags(value: string[]) {
    this.tags = value;
  }
}
