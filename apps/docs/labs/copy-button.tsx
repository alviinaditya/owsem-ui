"use client";

import type { ButtonSize, ButtonVariant } from "owsem-ui/base";
import { CopyButton } from "owsem-ui/owsem";
import { type MouseEvent, useEffect, useRef } from "react";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    title: "Undang tim Anda",
    field: "Link undangan",
    note: "Siapa pun yang punya link ini bisa bergabung.",
    copy: "Salin link",
    copied: "Tersalin",
    light: "Terang",
    dark: "Gelap",
    icon: "Ikon",
    iconCopied: "Ikon, tersalin",
    label: "Dengan label",
    labelCopied: "Dengan label, tersalin",
  },
  en: {
    title: "Invite your team",
    field: "Invite link",
    note: "Anyone with the link can join.",
    copy: "Copy link",
    copied: "Copied",
    light: "Light",
    dark: "Dark",
    icon: "Icon",
    iconCopied: "Icon, copied",
    label: "With a label",
    labelCopied: "With a label, copied",
  },
} satisfies Record<Lang, Record<string, string>>;

const LINK = "https://owsem.dev/join/7Kq2";

const initial = { label: "", variant: "ghost", size: "sm" };
type Cfg = typeof initial;

/**
 * A scene's press is not the visitor's, and browsers let only a visitor's own press write the
 * clipboard: for that one press the stage stands in for the clipboard, which also leaves the
 * visitor's own clipboard alone.
 */
function standIn(event: MouseEvent) {
  const clipboard = navigator.clipboard;
  if (event.isTrusted || !clipboard) return;
  const write = clipboard.writeText;
  clipboard.writeText = () => {
    clipboard.writeText = write;
    return Promise.resolve();
  };
}

/** An invite link in a field, with its Copy Button at the end. */
function Demo({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-card demo-copy">
      <p className="demo-title">{t.title}</p>
      <div className="demo-copy-field">
        <span className="visually-hidden">{t.field}</span>
        <code>{LINK}</code>
        <CopyButton
          value={LINK}
          labels={{ copy: t.copy, copied: t.copied }}
          showLabel={cfg.label === "on"}
          variant={cfg.variant as ButtonVariant}
          size={cfg.size as ButtonSize}
          onClick={standIn}
          data-demo="copy"
        />
      </div>
      <p className="demo-muted">{t.note}</p>
    </div>
  );
}

/** A Copy Button that copies once it mounts, and holds Copied, for the states matrix. */
function Copied(props: { lang: Lang; label: boolean; variant: ButtonVariant }) {
  const t = TEXT[props.lang];
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.click();
  }, []);
  return (
    <CopyButton
      ref={ref}
      value={LINK}
      labels={{ copy: t.copy, copied: t.copied }}
      showLabel={props.label}
      variant={props.variant}
      size="sm"
      timeout={86_400_000}
      onClick={standIn}
    />
  );
}

const THEMES = ["light", "dark"] as const;
const ROWS = [
  { key: "icon", label: false, copied: false, variant: "ghost" },
  { key: "iconCopied", label: false, copied: true, variant: "ghost" },
  { key: "label", label: true, copied: false, variant: "outline" },
  { key: "labelCopied", label: true, copied: true, variant: "outline" },
] as const;

/** Icon only and with a label, ready and copied, in both themes. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={ROWS.map((row) => ({
        label: t[row.key],
        cells: THEMES.map((theme) => (
          <div key={theme} data-theme={theme} className="demo-cell">
            {row.copied ? (
              <Copied lang={lang} label={row.label} variant={row.variant} />
            ) : (
              <CopyButton
                value={LINK}
                labels={{ copy: t.copy, copied: t.copied }}
                showLabel={row.label}
                variant={row.variant}
                size="sm"
                onClick={standIn}
              />
            )}
          </div>
        )),
      }))}
    />
  );
}

// Copies the link, and waits for the check to go back.
const copying: SceneScript = async (stage) => {
  await stage.click(stage.get('[data-demo="copy"]'));
  await stage.wait(2400);
};

const copyButtonLab = defineLab({
  initial,
  controls: [
    {
      key: "label",
      type: "choice",
      label: { id: "Label", en: "Label" },
      options: [
        { value: "", label: { id: "Ikon saja", en: "Icon only" } },
        { value: "on", label: { id: "Tampil", en: "Shown" } },
      ],
    },
    {
      key: "variant",
      type: "choice",
      label: { id: "Varian", en: "Variant" },
      options: ["ghost", "outline", "secondary"].map((value) => ({
        value,
        label: { id: value, en: value },
      })),
    },
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: ["sm", "md", "lg"].map((value) => ({ value, label: { id: value, en: value } })),
    },
  ],

  parts: [
    {
      name: "Root",
      selector: '[data-demo="copy"]',
      note: {
        id: "Sebuah Button: varian, ukuran, dan materialnya dari Button. data-copied selama ia menampilkan Tersalin.",
        en: "A Button: its variant, size, and materials are Button's. data-copied while it shows Copied.",
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
      selector: '[data-demo="copy"] .ow-copy-button__icon',
      note: {
        id: "Ikon salin atau centang Lucide, ditukar oleh Icon Morph. Centangnya tergambar saat masuk.",
        en: "Lucide's copy or check icon, swapped by Icon Morph. The check draws itself in as it enters.",
      },
    },
    {
      name: "Label",
      selector: '[data-demo="copy"] .ow-copy-button__label',
      note: {
        id: "Dengan showLabel: kedua kata di satu sel, jadi lebarnya tetap. Yang tersembunyi tidak dibaca.",
        en: "With showLabel: both words in one cell, so the width holds. The hidden one is not read.",
      },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other token setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/owsem" : "@/components/owsem/copy-button";
    const props = [
      "value={url}",
      'labels={{ copy: "Copy link" }}',
      ...(cfg.label === "on" ? ["showLabel"] : []),
      ...(cfg.variant === "ghost" ? [] : [`variant="${cfg.variant}"`]),
      ...(cfg.size === "md" ? [] : [`size="${cfg.size}"`]),
    ];
    const usage = [
      `import { CopyButton } from "${from}";`,
      "",
      "export function InviteLink({ url }: { url: string }) {",
      "  return (",
      '    <div className="invite-link">',
      "      <code>{url}</code>",
      `      <CopyButton ${props.join(" ")} />`,
      "    </div>",
      "  );",
      "}",
    ];
    return [{ name: "invite-link.tsx", code: usage.join("\n") }];
  },

  scenes: {
    copying: { play: copying },
    label: { cfg: { label: "on", variant: "outline" }, play: copying },
    anatomy: { inspect: true, cfg: { label: "on" } },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function CopyButtonLab(props: LabProps) {
  return <LabShell lab={copyButtonLab} {...props} />;
}
