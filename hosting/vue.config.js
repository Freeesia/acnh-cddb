/* eslint-disable @typescript-eslint/no-var-requires */
const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");
const HardSourceWebpackPlguin = require("hard-source-webpack-plugin");
const os = require("os");

module.exports = {
  pages: {
    index: {
      entry: "src/main.ts",
      title: process.env.VUE_APP_NAME,
    },
  },
  css: {
    extract: process.env.NODE_ENV === "production" ? { ignoreOrder: true } : false,
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
      new HardSourceWebpackPlguin(),
    ],
  },
  chainWebpack: config => {
    config.plugin("html-index").tap(args => {
      args[0].inject = "head";
      return args;
    });
    config.plugin("fork-ts-checker").tap(args => {
      args[0].workers = Math.max(os.cpus().length - 1, 1);
      args[0].memoryLimit = os.freemem() > 8096 ? 8096 : 2048;
      return args;
    });
    config.module
      .rule("md")
      .test(/\.md$/)
      .use("vue-loader")
      .loader("vue-loader")
      .end()
      .use("markdown-to-vue-loader")
      .loader("markdown-to-vue-loader")
      .end();
  },
  transpileDependencies: ["vuetify", "vuex-module-decorators"],
};
