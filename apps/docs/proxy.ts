import { createI18nMiddleware } from "fumadocs-core/i18n/middleware";
import { i18n } from "@/lib/i18n";

// Redirects unprefixed URLs (/, /docs) to /<lang>/..., picked from Accept-Language.
export default createI18nMiddleware({
  ...i18n,
  // The default formatter yields "/id/", which Next would redirect a second time.
  format: (lang, pathname) => `/${lang}${pathname === "/" ? "" : pathname}`,
});

export const config = {
  // The registry (/r), API routes, Next assets, and static files are not localized.
  matcher: ["/((?!api/|r/|_next/|.*\\..*).*)"],
};
