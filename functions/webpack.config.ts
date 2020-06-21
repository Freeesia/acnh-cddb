import path from "path";
import { Configuration } from "webpack";
import nodeExternals from "webpack-node-externals";

const config: Configuration = {
  mode: "development",
  entry: "./src/index.ts",
  output: {
    filename: "index.js",
    libraryTarget: "this",
    path: path.resolve(__dirname, "dist"),
  },
  target: "node",
  externals: [nodeExternals()],
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        loader: "ts-loader",
        test: /\.ts$/,
        exclude: [/node_modules/],
        options: {
          transpileOnly: true,
          configFile: path.resolve(__dirname, "tsconfig.json"),
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      app: path.resolve(__dirname, "./"),
    },
  },
};

export default config;
