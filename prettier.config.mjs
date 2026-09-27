import config from "ultracite/prettier";

const prettierConfig = {
  ...config,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindFunctions: ["cn", "cva"],
  tailwindStylesheet: "packages/ui/src/styles/globals.css",
};

export default prettierConfig;
