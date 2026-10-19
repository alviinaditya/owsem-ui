import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Markdown } from "fumadocs-core/content/md";
import { type Bump, isChangesetFile, readChangesets } from "@/lib/changelog";
import type { Lang } from "@/lib/i18n";

// process.cwd() is apps/docs during next build. The page is static, so the files are read at
// build time only and need no place in the server trace.
const ROOT = join(/* turbopackIgnore: true */ process.cwd(), "../..");

const TEXT = {
  id: {
    bumps: { major: "Major", minor: "Minor", patch: "Patch" },
    next: "Rilis berikutnya",
    noPending: "Belum ada perubahan yang menunggu rilis berikutnya.",
    noReleases: "Belum ada versi yang dirilis. Rilis pertama akan muncul di sini.",
  },
  en: {
    bumps: { major: "Major", minor: "Minor", patch: "Patch" },
    next: "Next release",
    noPending: "Nothing is waiting for the next release.",
    noReleases: "No version has been released yet. The first release will show up here.",
  },
} satisfies Record<
  Lang,
  { bumps: Record<Bump, string>; next: string; noPending: string; noReleases: string }
>;

function Badge({ bump, lang }: { bump: Bump; lang: Lang }) {
  return (
    <span className="badge" data-bump={bump}>
      {TEXT[lang].bumps[bump]}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="coming-soon">
      <p>{text}</p>
    </div>
  );
}

/** Pending changesets by package; the page's own h2 introduces them, so packages are h3. */
export function Unreleased({ lang }: { lang: Lang }) {
  const dir = join(ROOT, ".changeset");
  const pending = readChangesets(
    readdirSync(dir)
      .filter(isChangesetFile)
      .map((file) => ({ file, source: readFileSync(join(dir, file), "utf8") })),
  );
  if (pending.length === 0) return <Empty text={TEXT[lang].noPending} />;
  return (
    <div className="changelog">
      {pending.map((pkg) => (
        <section key={pkg.name}>
          <h3>
            <code>{pkg.name}</code>
          </h3>
          <p className="changelog-meta">
            {TEXT[lang].next} <Badge bump={pkg.bump} lang={lang} />
          </p>
          <ul className="changelog-list">
            {pkg.changes.map((change) => (
              <li key={change.file}>
                <Badge bump={change.bump} lang={lang} />
                <div className="changelog-body">
                  <Markdown>{change.summary}</Markdown>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/**
 * Each published package's CHANGELOG.md as Changesets writes it ("## x.y.z", then "### Minor
 * Changes" lists), one level down under the package's h3.
 */
export function Releases({ lang }: { lang: Lang }) {
  const released = readdirSync(join(ROOT, "packages")).flatMap((dir) => {
    const manifest = join(ROOT, "packages", dir, "package.json");
    const changelog = join(ROOT, "packages", dir, "CHANGELOG.md");
    if (!existsSync(manifest) || !existsSync(changelog)) return [];
    const { name, private: internal } = JSON.parse(readFileSync(manifest, "utf8"));
    return internal ? [] : [{ name: String(name), source: readFileSync(changelog, "utf8") }];
  });
  if (released.length === 0) return <Empty text={TEXT[lang].noReleases} />;
  return (
    <div className="changelog">
      {released.map((pkg) => (
        <section key={pkg.name}>
          <h3>
            <code>{pkg.name}</code>
          </h3>
          <div className="changelog-body">
            <Markdown components={{ h1: () => null, h2: "h4", h3: "h5" }}>{pkg.source}</Markdown>
          </div>
        </section>
      ))}
    </div>
  );
}
