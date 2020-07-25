import { VuexModule, Mutation, Module } from "vuex-module-decorators";

@Module({ namespaced: true, name: "general" })
export default class General extends VuexModule {
  loading = false;
  swUpdated = false;

  @Mutation
  setLoading(value: boolean) {
    this.loading = value;
  }

  @Mutation
  setSwUpdated(value: boolean) {
    this.swUpdated = value;
  }
}
