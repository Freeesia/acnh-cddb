import { VuexModule, Mutation, Module } from "vuex-module-decorators";
import { ColorType, DesignType } from "../../../../core/src/models/types";

@Module({ namespaced: true, name: "search" })
export default class Search extends VuexModule {
  types: DesignType[] = [];
  colors: ColorType[] = [];
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
}
