import { VuexModule, Mutation, Module } from "vuex-module-decorators";

@Module({ namespaced: true, name: "general" })
export default class General extends VuexModule {
  loading = false;
  swUpdated = false;
  _locale: string | null = null;

  @Mutation
  setLoading(value: boolean) {
    this.loading = value;
  }

  @Mutation
  setSwUpdated(value: boolean) {
    this.swUpdated = value;
  }

  @Mutation
  setLocale(val: string) {
    this._locale = val;
  }

  get locale() {
    return this._locale ?? navigator.language.split("-")[0];
  }
}
