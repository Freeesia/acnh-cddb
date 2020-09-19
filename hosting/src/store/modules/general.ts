import { createModule } from "vuex-class-component";

const VuexModule = createModule({
  namespaced: "general",
  strict: false,
});

export default class General extends VuexModule {
  loading = false;
  swUpdated = false;
  private _locale: string | null = null;

  set locale(v: string) {
    this._locale = v;
  }

  get locale() {
    return this._locale ?? navigator.language.split("-")[0];
  }
}
