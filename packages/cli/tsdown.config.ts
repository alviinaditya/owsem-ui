import { defineConfig } from "tsdown";

// The Node target comes from "engines" in package.json; dependencies stay external.
export default defineConfig({
  entry: ["src/index.ts"],
  platform: "node",
  dts: false,
  failOnWarn: "ci-only",
});
