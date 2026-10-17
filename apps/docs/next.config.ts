import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Keep `next dev` from writing AGENTS.md into the repo.
  agentRules: false,
  // No React Compiler: it would also transform owsem-ui's dist, so Labs would not run npm's code.
  async headers() {
    return [
      {
        // DS-7: static registry in public/r. File names are unhashed, so keep caching short.
        source: "/r/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Cache-Control",
            value: "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(config);
