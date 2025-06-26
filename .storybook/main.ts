const path = require("path");

module.exports = {
  "stories": [
    "../stories/**/*.stories.mdx",
    "../stories/**/*.stories.@(js|jsx|ts|tsx)"
  ],
  "staticDirs": ['../public'],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "storybook-addon-next"
  ],
  "framework": "@storybook/react",
  "core": {
    "builder": "@storybook/builder-webpack5"
  },
  "typescript": {
    "reactDocgen": false
  },
  "webpackFinal": async (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@components": path.resolve(__dirname, "../components"),
      "@pages": path.resolve(__dirname, "../pages"),
      "@styles": path.resolve(__dirname, "../styles"),
      "@libs": path.resolve(__dirname, "../libs"),
      "@utils": path.resolve(__dirname, "../utils"),
      "@config": path.resolve(__dirname, "../config"),
    };
    return config;
  }
}