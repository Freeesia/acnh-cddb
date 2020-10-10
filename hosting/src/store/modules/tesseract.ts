import { createWorker } from "tesseract.js";
import { action, createModule } from "vuex-class-component";

const VuexModule = createModule({
  namespaced: "tesseract",
  strict: false,
});

export default class Tesseract extends VuexModule {
  private worker = createWorker();
  private promise: Promise<any> | null = null;

  @action
  init() {
    if (!this.promise) {
      this.promise = this._init();
    }
    return Promise.resolve();
  }

  @action
  async getWorker() {
    await this.init();
    await this.promise;
    return this.worker;
  }

  @action
  private async _init() {
    await this.worker.load();
    await this.worker.loadLanguage("eng");
    await this.worker.initialize("eng");
    await this.worker.setParameters({
      tessjs_create_hocr: "0",
      tessjs_create_tsv: "0",
      tessedit_char_whitelist: "0123456789ABCDEFGHJKLMNPQRSTUVWXY-",
    });
  }
}
