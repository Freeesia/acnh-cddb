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
        primary: "#7cb894",
        secondary: "#9ad4e4",
        accent: "#997046",
      },
      dark: {
        primary: "#7cb894",
        secondary: "#9ad4e4",
        accent: "#997046",
      },
    },
  },
  icons: {
    iconfont: "md",
  },
});
