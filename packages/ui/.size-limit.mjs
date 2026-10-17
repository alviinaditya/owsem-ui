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
];
