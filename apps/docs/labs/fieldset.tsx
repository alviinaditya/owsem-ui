"use client";

import { Field, Fieldset, Toggle } from "owsem-ui/base";
import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    billing: "Alamat penagihan",
    same: "Sama dengan alamat kirim",
    street: "Jalan",
    city: "Kota",
    postal: "Kode pos",
    light: "Terang",
    dark: "Gelap",
    enabled: "Aktif",
    disabled: "Disabled",
    token: "Token",
    className: "className",
    render: "render",
    gap: "gap",
  },
  en: {
    billing: "Billing address",
    same: "Same as shipping",
    street: "Street",
    city: "City",
    postal: "Postal code",
    light: "Light",
    dark: "Dark",
    enabled: "Enabled",
    disabled: "Disabled",
    token: "Token",
    className: "className",
    render: "render",
    gap: "gap",
  },
} satisfies Record<Lang, Record<string, string>>;

type Theme = "light" | "dark";

const THEMES: readonly Theme[] = ["light", "dark"];

const initial = { gap: "default", dark: "", light: "" };
type Cfg = typeof initial;

const tokens = (cfg: Cfg) =>
  ({
    "--ow-line-dark": cfg.dark || undefined,
    "--ow-line-light": cfg.light || undefined,
  }) as CSSProperties;

const GAPS: Record<string, string | undefined> = {
  default: undefined,
  tight: "demo-fieldset-tight",
  roomy: "demo-fieldset-roomy",
};

/** A group's fields; the address never changes, so every demo reads the same. */
function Fields({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <>
      <Field.Root>
        <Field.Label>{t.street}</Field.Label>
        <Field.Control defaultValue="Jl. Melati 12" />
      </Field.Root>
      <Field.Root>
        <Field.Label>{t.city}</Field.Label>
        <Field.Control defaultValue="Bandung" />
      </Field.Root>
    </>
  );
}

/** The gap in use, read from the layout (the stage may scale the demo). */
function Gap({ of }: { of: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [gap, setGap] = useState("");
  useLayoutEffect(() => {
    const set = ref.current?.parentElement?.querySelector<HTMLElement>(".ow-fieldset");
    if (!set) return;
    const observer = new ResizeObserver(() => setGap(getComputedStyle(set).rowGap));
    observer.observe(set);
    return () => observer.disconnect();
  }, []);
  return (
    <p ref={ref} className="demo-caption" data-demo="gap">
      {of}: {gap}
    </p>
  );
}

/** A billing address that the Toggle turns off in one move. */
function Demo({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const [same, setSame] = useState(false);
  return (
    <div className="demo-card demo-fieldset">
      <Toggle
        size="sm"
        startIcon={<Icon name="link" />}
        pressed={same}
        onPressedChange={setSame}
        data-demo="same"
      >
        {t.same}
      </Toggle>
      <Fieldset.Root disabled={same} className={GAPS[cfg.gap]} style={tokens(cfg)}>
        <Fieldset.Legend>{t.billing}</Fieldset.Legend>
        <Fields lang={lang} />
      </Fieldset.Root>
      <Gap of={t.gap} />
    </div>
  );
}

/** Enabled and disabled, in both themes. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme])}
      rows={(["enabled", "disabled"] as const).map((state) => ({
        label: t[state],
        cells: THEMES.map((theme) => (
          <div key={theme} data-theme={theme} className="demo-cell demo-field-cell">
            <Fieldset.Root disabled={state === "disabled"}>
              <Fieldset.Legend>{t.billing}</Fieldset.Legend>
              <Fields lang={lang} />
            </Fieldset.Root>
          </div>
        )),
      }))}
    />
  );
}

/** The three ways to change it, side by side: a token, a className rule, and `render`. */
function Customized({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-card demo-fieldset demo-field-custom">
      <span className="demo-caption">{t.token}</span>
      <Fieldset.Root style={tokens(cfg)}>
        <Fieldset.Legend>{t.billing}</Fieldset.Legend>
      </Fieldset.Root>
      <span className="demo-caption">{t.className}</span>
      <Fieldset.Root className="demo-fieldset-columns">
        <Fieldset.Legend className="demo-fieldset-plain">{t.billing}</Fieldset.Legend>
        <Fields lang={lang} />
      </Fieldset.Root>
      <span className="demo-caption">{t.render}</span>
      <Fieldset.Root>
        <Fieldset.Legend render={<h3>{t.billing}</h3>} />
      </Fieldset.Root>
    </div>
  );
}

// The toggle turns the whole group off, then on again.
const group: SceneScript = async (stage) => {
  const same = stage.get('[data-demo="same"]');
  await stage.click(same);
  await stage.wait(1400);
  await stage.click(same);
  await stage.wait(600);
};

const fieldsetLab = defineLab({
  initial,
  controls: [
    {
      key: "gap",
      type: "choice",
      label: { id: "Jarak", en: "Gap" },
      options: [
        { value: "default", label: { id: "Bawaan", en: "Default" } },
        { value: "tight", label: { id: "Rapat", en: "Tight" } },
        { value: "roomy", label: { id: "Lega", en: "Roomy" } },
      ],
    },
    {
      key: "dark",
      type: "color",
      label: { id: "Garis gelap", en: "Dark line" },
      token: "--ow-line-dark",
    },
    {
      key: "light",
      type: "color",
      label: { id: "Garis terang", en: "Light line" },
      token: "--ow-line-light",
    },
  ],

  parts: [
    {
      name: "Root",
      selector: ".ow-fieldset",
      note: {
        id: "fieldset dari Base UI: satu kolom dengan jarak yang sama, tanpa bingkai dan tanpa margin luar.",
        en: "Base UI's fieldset: one column with even gaps, no frame, and no outer margins.",
      },
    },
    {
      name: "Legend",
      selector: ".ow-fieldset__legend",
      note: {
        id: "Menamai grup lewat aria-labelledby, di atas garis terukir.",
        en: "Names the group through aria-labelledby, over an etched line.",
      },
      tokens: {
        "--ow-fg": "--_fg",
        "--ow-line-dark": "--_dark",
        "--ow-line-light": "--_light",
      },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the component into the project.
    const from = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/fieldset";
    const fieldFrom = isDefaultSetup(setup) ? "owsem-ui/base" : "@/components/owsem/field";
    const custom = cfg.dark || cfg.light || cfg.gap !== "default";
    const imports = isDefaultSetup(setup)
      ? [`import { Field, Fieldset } from "${from}";`]
      : [`import { Fieldset } from "${from}";`, `import { Field } from "${fieldFrom}";`];
    const usage = [
      ...imports,
      "",
      "export function Billing() {",
      "  return (",
      `    <Fieldset.Root${custom ? ' className="billing"' : ""}>`,
      "      <Fieldset.Legend>Billing address</Fieldset.Legend>",
      "      <Field.Root>",
      "        <Field.Label>Street</Field.Label>",
      "        <Field.Control />",
      "      </Field.Root>",
      "      <Field.Root>",
      "        <Field.Label>City</Field.Label>",
      "        <Field.Control />",
      "      </Field.Root>",
      "    </Fieldset.Root>",
      "  );",
      "}",
    ];
    const files = [{ name: "billing.tsx", code: usage.join("\n") }];
    if (custom) {
      const token = `--${setup.prefix}-line`;
      const lines = [
        "/* Unlayered, so it beats the Fieldset's own values */",
        ".billing {",
        ...(cfg.gap === "tight" ? ["  gap: 0.5em;"] : []),
        ...(cfg.gap === "roomy" ? ["  gap: 2em;"] : []),
        ...(cfg.dark ? [`  ${token}-dark: ${cfg.dark};`] : []),
        ...(cfg.light ? [`  ${token}-light: ${cfg.light};`] : []),
        "}",
      ];
      files.push({ name: "billing.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    group: { play: group },
    anatomy: { inspect: true },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: {
      controls: true,
      demo: (cfg, lang) => <Customized cfg={cfg} lang={lang} />,
    },
    ship: { code: true },
  },
});

export default function FieldsetLab(props: LabProps) {
  return <LabShell lab={fieldsetLab} {...props} />;
}
