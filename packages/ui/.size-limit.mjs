// Size excluding Base UI (PRD success metrics), gzip. Peers react and react-dom are ignored.
// Per-component budgets (Base 3 kB, Owsem 8 kB) come with the first component and its meta.
export default [
  {
    name: "core",
    path: "dist/core/index.js",
    ignore: ["@base-ui/react"],
    gzip: true,
    limit: "6 kB",
  },
];
