import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Lang } from "@/lib/i18n";
import { isColor, parseTokens } from "@/lib/tokens";

// process.cwd() is apps/docs during next build and next start.
const TOKENS_CSS = join(process.cwd(), "../../packages/ui/src/core/tokens/tokens.css");

const TEXT = {
  id: { token: "Token", light: "Terang", dark: "Gelap" },
  en: { token: "Token", light: "Light", dark: "Dark" },
} satisfies Record<Lang, Record<string, string>>;

function Value({ value }: { value: string }) {
  return (
    <>
      {isColor(value) ? (
        <span className="token-table-chip" style={{ backgroundColor: value }} aria-hidden="true" />
      ) : null}
      <code>{value}</code>
    </>
  );
}

/** Every theme token in owsem-ui's tokens.css with its light and dark value, read at build time. */
export function TokenTable({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const tokens = parseTokens(readFileSync(TOKENS_CSS, "utf8"));
  return (
    <table className="token-table">
      <thead>
        <tr>
          <th scope="col">{t.token}</th>
          <th scope="col">{t.light}</th>
          <th scope="col">{t.dark}</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => (
          <tr key={token.name}>
            <td>
              <code>{token.name}</code>
            </td>
            <td>
              <Value value={token.light} />
            </td>
            <td>
              <Value value={token.dark} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
