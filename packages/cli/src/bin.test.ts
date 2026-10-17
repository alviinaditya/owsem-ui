import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import pkg from "../package.json" with { type: "json" };

// Runs the built dist/index.mjs, like `npx owsem`; the test task depends on build.
const bin = fileURLToPath(new URL("../dist/index.mjs", import.meta.url));
const run = (...args: string[]) =>
  spawnSync(process.execPath, [bin, ...args], {
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
  });

test("--version prints the package version", () => {
  const result = run("--version");
  expect(result.status).toBe(0);
  expect(result.stdout.trim()).toBe(pkg.version);
});

test("--help lists every command", () => {
  const result = run("--help");
  expect(result.status).toBe(0);
  for (const command of ["init", "add", "diff", "list", "tokens"]) {
    expect(result.stdout).toContain(command);
  }
});

test.each(["init", "add", "diff", "list", "tokens"])(
  "%s is not implemented yet and exits with 1",
  (command) => {
    expect(run(command).status).toBe(1);
  },
);

test("an unknown command exits non-zero", () => {
  expect(run("bogus").status).not.toBe(0);
});
