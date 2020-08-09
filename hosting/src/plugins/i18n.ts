import Vue from "vue";
import VueI18n from "vue-i18n";
import { GeneralModule } from "@/store";
import Sentry from "./sentry";
import { Severity } from "@sentry/browser";
import ja from "@/i18n/ja.json";

Vue.use(VueI18n);

const loaded = ["ja"];

const i18n = new VueI18n({
  locale: GeneralModule.locale,
  fallbackLocale: "ja",
  messages: {
    ja,
  },
});

export default i18n;

loadLanguage(i18n.locale);

export async function loadLanguage(lang: string) {
  if (loaded.includes(lang)) {
    return;
  }
  try {
    const res = await import(/* webpackChunkName: "lang-[request]" */ `@/i18n/${lang}.json`);
    i18n.setLocaleMessage(lang, res);
  } catch (error) {
    Sentry.captureException(error, { level: Severity.Warning });
  }
}
