// The scope is optional but must come from this list, e.g. `feat(ui): add Switch`.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [
      2,
      "always",
      [
        "ui",
        "core",
        "base",
        "owsem",
        "tokens",
        "cli",
        "registry",
        "docs",
        "deps",
        "release",
        "repo",
      ],
    ],
  },
};
