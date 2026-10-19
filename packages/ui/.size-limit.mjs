// Size excluding Base UI (PRD success metrics), gzip. Peers react and react-dom are ignored.
const entry = (name, path, limit) => ({
  name,
  path,
  ignore: ["@base-ui/react"],
  gzip: true,
  limit,
});

// One entry per component: Base 3 kB, Owsem 8 kB.
export default [
  entry("core", "dist/core/index.js", "6 kB"),
  entry("separator", "dist/components/separator/index.js", "3 kB"),
  // Base + Owsem: both flavors in one entry; 3 kB or 8 kB is open in the PRD.
  entry("tree-rail-nav", "dist/components/tree-rail-nav/index.js", "8 kB"),
];
