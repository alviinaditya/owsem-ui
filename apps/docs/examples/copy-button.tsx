"use client";

import type { ButtonSize, ButtonVariant } from "owsem-ui/base";
import { CopyButton } from "owsem-ui/owsem";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    title: "Undang tim Anda",
    note: "Siapa pun yang punya link ini bisa bergabung.",
    copy: "Salin link",
    copied: "Tersalin",
  },
  en: {
    title: "Invite your team",
    note: "Anyone with the link can join.",
    copy: "Copy link",
    copied: "Copied",
  },
} satisfies Record<Lang, Record<string, string>>;

const LINK = "https://owsem.dev/join/7Kq2";
const VARIANTS: readonly ButtonVariant[] = ["ghost", "outline", "secondary"];
const SIZES: readonly ButtonSize[] = ["sm", "md", "lg"];

/** An invite link in a field, with its Copy Button at the end. */
function Invite({
  lang,
  label,
  variant,
  size = "sm",
}: {
  lang: Lang;
  label?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const t = TEXT[lang];
  return (
    <div className="demo-card demo-copy">
      <p className="demo-title">{t.title}</p>
      <div className="demo-copy-field">
        <code>{LINK}</code>
        <CopyButton
          value={LINK}
          labels={{ copy: t.copy, copied: t.copied }}
          showLabel={label}
          variant={variant}
          size={size}
        />
      </div>
      <p className="demo-muted">{t.note}</p>
    </div>
  );
}

function Variants({ lang }: { lang: Lang }) {
  return (
    <div className="demo-buttons">
      {VARIANTS.map((variant) => (
        <CopyButton
          key={variant}
          value={LINK}
          labels={{ copy: TEXT[lang].copy, copied: TEXT[lang].copied }}
          variant={variant}
          size="md"
        />
      ))}
    </div>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-buttons">
      {SIZES.map((size) => (
        <CopyButton
          key={size}
          value={LINK}
          labels={{ copy: TEXT[lang].copy, copied: TEXT[lang].copied }}
          size={size}
        />
      ))}
    </div>
  );
}

/** Any other setup comes from the owsem CLI, which copies the component into the project. */
const importLine = (setup: TokenSetup) =>
  `import { CopyButton } from "${
    isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/copy-button"
  }";`;

const labels = (lang: Lang) =>
  `labels={{ copy: "${TEXT[lang].copy}", copied: "${TEXT[lang].copied}" }}`;

const invite = (lang: Lang, props: string[]) => [
  '<div className="invite-link">',
  `  <code>{${JSON.stringify(LINK)}}</code>`,
  `  <CopyButton value="${LINK}" ${labels(lang)}${props.map((p) => ` ${p}`).join("")} />`,
  "</div>",
];

export const copyButtonDefinition = defineComponent({
  item: "copy-button",
  imports: ["CopyButton"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Hanya ikon; Tooltip-nya berkata Salin, lalu berubah menjadi Tersalin di tempat.",
        en: "Icon only; its Tooltip says Copy, then turns to Copied in place.",
      },
      uses: ["CopyButton"],
      demo: (lang) => <Invite lang={lang} />,
      code: (setup, lang) => [
        exampleFile("InviteLink", [importLine(setup)], invite(lang, ['size="sm"'])),
      ],
    },
    {
      id: "label",
      title: { id: "Dengan label", en: "With a label" },
      description: {
        id: "showLabel menaruh kata di samping ikon, tanpa Tooltip; lebarnya tetap.",
        en: "showLabel puts the word beside the icon, with no Tooltip; the width holds.",
      },
      uses: ["CopyButton"],
      demo: (lang) => <Invite lang={lang} label variant="outline" />,
      code: (setup, lang) => [
        exampleFile(
          "InviteLink",
          [importLine(setup)],
          invite(lang, ["showLabel", 'variant="outline"', 'size="sm"']),
        ),
      ],
    },
    {
      id: "variants",
      title: { id: "Varian", en: "Variants" },
      description: {
        id: "Varian dan materialnya dari Button; ghost adalah bawaannya.",
        en: "Variants and materials come from Button; ghost is the default.",
      },
      uses: ["CopyButton"],
      demo: (lang) => <Variants lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Variants",
          [importLine(setup)],
          VARIANTS.map(
            (variant) => `<CopyButton value="${LINK}" ${labels(lang)} variant="${variant}" />`,
          ),
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg, persegi seperti IconButton.",
        en: "sm, md, and lg, as square as an IconButton.",
      },
      uses: ["CopyButton"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          [importLine(setup)],
          SIZES.map((size) => `<CopyButton value="${LINK}" ${labels(lang)} size="${size}" />`),
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <CopyButton
        value={LINK}
        labels={{ copy: TEXT[lang].copy, copied: TEXT[lang].copied }}
        showLabel
        variant="outline"
        size="sm"
      />
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-copy-button",
      note: {
        id: "Sebuah Button: varian, ukuran, dan materialnya dari Button. data-copied dan aria-disabled selama ia menampilkan Tersalin. Ikon saja, Tooltip-nya menamainya.",
        en: "A Button: its variant, size, and materials are Button's. data-copied and aria-disabled while it shows Copied. Icon only, its Tooltip names it.",
      },
      tokens: {
        "--ow-spring-settle-duration": "--_duration",
        "--ow-fg": "--_ink",
        "--ow-hover": "--_hover",
        "--ow-focus": "--_focus",
        "--ow-radius": "--_radius",
      },
    },
    {
      name: "Icon",
      selector: ".ow-copy-button__icon",
      size: true,
      note: {
        id: "Ikon salin atau centang Lucide, ditukar oleh Icon Morph. Centangnya tergambar saat masuk.",
        en: "Lucide's copy or check icon, swapped by Icon Morph. The check draws itself in as it enters.",
      },
    },
    {
      name: "Label",
      selector: ".ow-copy-button__label",
      note: {
        id: "Dengan showLabel: kedua kata di satu sel, jadi lebarnya tetap. Yang tersembunyi tidak dibaca.",
        en: "With showLabel: both words in one cell, so the width holds. The hidden one is not read.",
      },
    },
  ],
});

export default function CopyButtonPage(props: ExamplePageProps) {
  return <ComponentPage definition={copyButtonDefinition} {...props} />;
}
