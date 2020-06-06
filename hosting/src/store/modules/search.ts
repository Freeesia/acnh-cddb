import { VuexModule, Mutation, Module } from "vuex-module-decorators";
import { ColorType, DesignType } from "@/models/types";

@Module({ namespaced: true, name: "search" })
export default class Search extends VuexModule {
  type: DesignType | null = null;
  color: ColorType | null = null;
  text = "";

  @Mutation
  setType(value?: DesignType) {
    this.type = value ?? null;
  }

  @Mutation
  setColor(value?: ColorType) {
    this.color = value ?? null;
  }

  @Mutation
  setText(value?: string) {
    this.text = value ?? "";
  }
}
