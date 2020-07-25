module.exports = {
  pages: {
    index: {
      entry: "src/main.ts",
      title: process.env.VUE_APP_NAME,
    },
  },
  pwa: {
    name: process.env.VUE_APP_NAME,
    themeColor: process.env.VUE_APP_PRIMARY_COLOR,
    msTileColor: process.env.VUE_APP_PRIMARY_COLOR,
  },
  configureWebpack: {
    devtool: "source-map",
  },
  transpileDependencies: ["vuetify", "vuex-module-decorators"],
};
