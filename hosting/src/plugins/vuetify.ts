import Vue from "vue";
import Vuetify from "vuetify/lib";
import ja from "vuetify/src/locale/ja";
import en from "vuetify/src/locale/en";
import { GeneralModule } from "@/store";

Vue.use(Vuetify);

export default new Vuetify({
  lang: {
    locales: { ja, en },
    // 言語リソースを読み込んでいないときに英語になるけどまあいっか。
    current: GeneralModule.locale,
  },
  theme: {
    themes: {
      light: {
        primary: process.env.VUE_APP_PRIMARY_COLOR,
        secondary: process.env.VUE_APP_SECONDARY_COLOR,
        accent: process.env.VUE_APP_ACCENT_COLOR,
      },
      dark: {
        primary: "#bd3ba8",
        secondary: "#fa7ac4",
        accent: "#1b2471",
      },
    },
    options: {
      customProperties: true,
    },
  },
  icons: {
    iconfont: "md",
  },
});
