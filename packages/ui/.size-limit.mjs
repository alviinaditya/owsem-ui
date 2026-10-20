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
  entry("kbd", "dist/components/kbd/index.js", "3 kB"),
  entry("separator", "dist/components/separator/index.js", "3 kB"),
  entry("toggle", "dist/components/toggle/index.js", "3 kB"),
  entry("toolbar", "dist/components/toolbar/index.js", "3 kB"),
  entry("tooltip", "dist/components/tooltip/index.js", "3 kB"),
  // Base + Owsem: both flavors in one entry; 3 kB or 8 kB is open in the PRD.
  entry("tree-rail-nav", "dist/components/tree-rail-nav/index.js", "8 kB"),
];
