// eslint-disable-next-line @typescript-eslint/no-var-requires
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");

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
    workboxOptions: {
      skipWaiting: true,
    },
  },
  configureWebpack: {
    devtool: "source-map",
    plugins: [
      new ScriptExtHtmlWebpackPlugin({
        defaultAttribute: "defer",
      }),
    ],
  },
  chainWebpack: config => {
    config.plugin("html-index").tap(args => {
      args[0].inject = "head";
      return args;
    });
  },
  transpileDependencies: ["vuetify", "vuex-module-decorators"],
};
