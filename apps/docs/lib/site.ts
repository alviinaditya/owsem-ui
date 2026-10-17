/** Docs site URL for metadataBase and the registry homepage. Invalid SITE_URL fails the build. */
export const siteUrl: URL = new URL(process.env.SITE_URL?.trim() || "https://owsem.dev");
