module.exports = {
  pages: {
    index: {
      entry: "src/main.ts",
      title: "あつまれ マイデザの🌳",
    },
  },
  configureWebpack: {
    devtool: "source-map",
  },
  transpileDependencies: ["vuetify", "vuex-module-decorators"],
};
