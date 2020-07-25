import Vue from "vue";
import Vuetify from "vuetify/lib";
import ja from "vuetify/src/locale/ja";

Vue.use(Vuetify);

export default new Vuetify({
  lang: {
    locales: { ja },
    current: "ja",
  },
  theme: {
    themes: {
      light: {
        primary: process.env.VUE_APP_PRIMARY_COLOR,
        secondary: process.env.VUE_APP_SECONDARY_COLOR,
        accent: process.env.VUE_APP_ACCENT_COLOR,
      },
      dark: {
        primary: process.env.VUE_APP_PRIMARY_COLOR,
        secondary: process.env.VUE_APP_SECONDARY_COLOR,
        accent: process.env.VUE_APP_ACCENT_COLOR,
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
