import { config } from "@workspace/eslint-config/base";
import vitest from "@workspace/eslint-config/ultracite-vitest";

export default [
  ...config,
  ...vitest,
  { ignores: ["convex/_generated/**", ".convex/**"] },
];
