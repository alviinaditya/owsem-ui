import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Table } from "owsem-ui/owsem";
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
    <Table.Root className="token-table" layout="table" aria-label={t.token}>
      <Table.Header>
        <Table.Row>
          <Table.Head>{t.token}</Table.Head>
          <Table.Head>{t.light}</Table.Head>
          <Table.Head>{t.dark}</Table.Head>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {tokens.map((token) => (
          <Table.Row key={token.name}>
            <Table.Cell>
              <code>{token.name}</code>
            </Table.Cell>
            <Table.Cell>
              <Value value={token.light} />
            </Table.Cell>
            <Table.Cell>
              <Value value={token.dark} />
            </Table.Cell>
          </Table.Row>
        ))}
      </Table.Body>
    </Table.Root>
  );
}
