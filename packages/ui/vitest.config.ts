import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import {
  mouse,
  setColorScheme,
  setForcedColors,
  setReducedMotion,
  setReducedTransparency,
} from "./test/commands.ts";

type BrowserName = "chromium" | "firefox" | "webkit";

// Engines for geometry tests (CI adds webkit). The unit project runs in Chromium only.
const geometryBrowsers = (process.env.OWSEM_BROWSERS ?? "chromium,firefox")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean) as BrowserName[];

// Optional: a system Chrome/Chromium instead of Playwright's download.
const executablePath = process.env.OWSEM_CHROMIUM_PATH;

const instance = (browser: BrowserName) =>
  browser === "chromium" && executablePath
    ? { browser, provider: playwright({ launchOptions: { executablePath } }) }
    : { browser };

export default defineConfig({
  test: {
    name: "ui",
    setupFiles: ["./test/setup.ts"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      viewport: { width: 1280, height: 800 },
      commands: {
        setColorScheme,
        setForcedColors,
        setReducedMotion,
        setReducedTransparency,
        mouse,
      },
      // Traces are off: Vitest 5.0.5 names them by test name, so parallel files overwrite each
      // other. Debug with --browser.trace=retain-on-failure --no-file-parallelism <file>.
      // Keep ad-hoc screenshots out of __screenshots__/ (committed VRT baselines).
      screenshotDirectory: ".vitest/screenshots",
      instances: [],
    },
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}", "test/**/*.test.{ts,tsx}"],
          exclude: ["**/*.geometry.test.{ts,tsx}"],
          browser: { instances: [instance("chromium")] },
        },
      },
      {
        // FR-5: component tests again on React 18.2, the lowest peer, where `ref` is not a prop.
        resolve: {
          alias: [
            { find: /^react(\/.*)?$/, replacement: "react-18$1" },
            { find: /^react-dom(\/.*)?$/, replacement: "react-dom-18$1" },
          ],
        },
        test: {
          name: "react18",
          include: ["src/**/*.test.tsx"],
          exclude: ["**/*.geometry.test.{ts,tsx}"],
          browser: { instances: [instance("chromium")] },
        },
      },
      {
        test: {
          name: "geometry",
          include: ["src/**/*.geometry.test.{ts,tsx}", "test/**/*.geometry.test.{ts,tsx}"],
          browser: { instances: geometryBrowsers.map(instance) },
        },
      },
    ],
  },
});
