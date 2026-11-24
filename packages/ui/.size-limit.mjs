import { dirname, resolve } from "node:path";

// Size excluding Base UI (PRD success metrics), gzip. Peers react and react-dom are ignored.
// Core counts once, in its own entry: a component's budget covers only its own code.
const core = resolve(import.meta.dirname, "dist/core");
const withoutCore = (config) => {
  const ignored = config.external;
  config.external = (id, importer, resolved) => {
    if (ignored?.test(id)) return true;
    const path = !resolved && importer && id.startsWith(".") ? resolve(dirname(importer), id) : id;
    return path.startsWith(`${core}/`);
  };
  return config;
};

const entry = (name, path, limit) => ({
  name,
  path,
  ignore: ["@base-ui/react"],
  gzip: true,
  limit,
  ...(path.startsWith("dist/core/") ? {} : { modifyRolldownConfig: withoutCore }),
});

// One entry per component: Base 3 kB, Owsem 8 kB.
export default [
  entry("core", "dist/core/index.js", "6 kB"),
  entry("accordion", "dist/components/accordion/index.js", "3 kB"),
  entry("avatar", "dist/components/avatar/index.js", "3 kB"),
  entry("button", "dist/components/button/index.js", "3 kB"),
  entry("checkbox", "dist/components/checkbox/index.js", "3 kB"),
  entry("checkbox-group", "dist/components/checkbox-group/index.js", "3 kB"),
  entry("collapsible", "dist/components/collapsible/index.js", "3 kB"),
  entry("color-picker", "dist/components/color-picker/index.js", "8 kB"),
  entry("dialog", "dist/components/dialog/index.js", "3 kB"),
  entry("field", "dist/components/field/index.js", "3 kB"),
  entry("fieldset", "dist/components/fieldset/index.js", "3 kB"),
  entry("form", "dist/components/form/index.js", "3 kB"),
  entry("input", "dist/components/input/index.js", "3 kB"),
  entry("kbd", "dist/components/kbd/index.js", "3 kB"),
  entry("menu", "dist/components/menu/index.js", "3 kB"),
  entry("meter", "dist/components/meter/index.js", "3 kB"),
  entry("number-field", "dist/components/number-field/index.js", "3 kB"),
  entry("otp-field", "dist/components/otp-field/index.js", "3 kB"),
  entry("popover", "dist/components/popover/index.js", "3 kB"),
  entry("progress", "dist/components/progress/index.js", "3 kB"),
  entry("scroll-area", "dist/components/scroll-area/index.js", "3 kB"),
  entry("radio-group", "dist/components/radio-group/index.js", "3 kB"),
  entry("select", "dist/components/select/index.js", "3 kB"),
  entry("separator", "dist/components/separator/index.js", "3 kB"),
  entry("slider", "dist/components/slider/index.js", "3 kB"),
  entry("tabs", "dist/components/tabs/index.js", "3 kB"),
  entry("switch", "dist/components/switch/index.js", "3 kB"),
  entry("toggle", "dist/components/toggle/index.js", "3 kB"),
  entry("toggle-group", "dist/components/toggle-group/index.js", "3 kB"),
  entry("toolbar", "dist/components/toolbar/index.js", "3 kB"),
  entry("tooltip", "dist/components/tooltip/index.js", "3 kB"),
  // Code Block builds on Copy Button, Button, and Icon Morph, which count here too.
  entry("code-block", "dist/components/code-block/index.js", "8 kB"),
  entry("command-menu", "dist/components/command-menu/index.js", "8 kB"),
  // Copy Button builds on Button and Icon Morph, which count here too.
  entry("copy-button", "dist/components/copy-button/index.js", "8 kB"),
  entry("icon-morph", "dist/components/icon-morph/index.js", "8 kB"),
  entry("sidebar", "dist/components/sidebar/index.js", "8 kB"),
  entry("table", "dist/components/table/index.js", "8 kB"),
  entry("table-of-contents", "dist/components/table-of-contents/index.js", "8 kB"),
  // Base + Owsem: both flavors in one entry; 3 kB or 8 kB is open in the PRD.
  entry("tree-rail-nav", "dist/components/tree-rail-nav/index.js", "8 kB"),
];
