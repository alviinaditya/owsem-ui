"use client";

import { Select, type SelectSize } from "owsem-ui/base";
import { type CSSProperties, Fragment, type ReactNode, useEffect, useState } from "react";
import { Icon } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    fruit: "Buah",
    fruits: "Buah-buahan",
    pick: "Pilih buah",
    year: "Tahun",
    decade: (start: number) => `${start}-an`,
    orchard: "Kebun",
    tropical: "Tropis",
    placeholder: "Placeholder",
    disabled: "Disabled",
    invalid: "Invalid",
    open: "Terbuka",
    lightCol: "Terang",
    darkCol: "Gelap",
    names: {
      apple: "Apel",
      banana: "Pisang",
      cherry: "Ceri",
      durian: "Durian",
      mango: "Mangga",
      guava: "Jambu",
      lychee: "Leci",
      papaya: "Pepaya",
    },
  },
  en: {
    fruit: "Fruit",
    fruits: "Fruits",
    pick: "Pick a fruit",
    year: "Year",
    decade: (start: number) => `${start}s`,
    orchard: "Orchard",
    tropical: "Tropical",
    placeholder: "Placeholder",
    disabled: "Disabled",
    invalid: "Invalid",
    open: "Open",
    lightCol: "Light",
    darkCol: "Dark",
    names: {
      apple: "Apple",
      banana: "Banana",
      cherry: "Cherry",
      durian: "Durian",
      mango: "Mango",
      guava: "Guava",
      lychee: "Lychee",
      papaya: "Papaya",
    },
  },
} satisfies Record<Lang, Record<string, unknown>>;

type Fruit = keyof typeof TEXT.en.names;
type Theme = "light" | "dark";
const THEMES: readonly Theme[] = ["light", "dark"];
const SIZES: readonly SelectSize[] = ["sm", "md", "lg"];
const SHORT: readonly Fruit[] = ["apple", "banana", "cherry", "durian", "mango"];
const ORCHARD: readonly Fruit[] = ["apple", "cherry"];
const TROPICAL: readonly Fruit[] = ["banana", "durian", "guava", "lychee", "mango", "papaya"];
const DECADES = [2000, 2010, 2020, 2030];

const labels = (lang: Lang) =>
  [...ORCHARD, ...TROPICAL].map((value) => ({ value, label: TEXT[lang].names[value] }));

const initial = { size: "md", width: "fit", parts: "short", well: "", bg: "", fg: "" };
type Cfg = typeof initial;

/**
 * Popups portal into the demo itself, so they take the stage's theme, and scene scripts and Inspect
 * find them: into an empty box out of the layout. A container from state: Base UI waits while null.
 */
function usePortal() {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  return { container, box: <div ref={setContainer} className="demo-portal" /> };
}

/**
 * Over its trigger, the popup is placed with `position: fixed`, in the screen's coordinates, which
 * a stage that is scaled or moved (a panel open, a narrow window) would throw off. Such a stage
 * opens it beside the trigger, as touch does.
 */
function useFlatStage(inside: HTMLElement | null) {
  const [flat, setFlat] = useState(false);
  useEffect(() => {
    const fit = inside?.closest<HTMLElement>(".lab-fit");
    if (!fit) return;
    const read = () => setFlat(fit.style.transform === "none");
    read();
    const observer = new MutationObserver(read);
    observer.observe(fit, { attributes: true, attributeFilter: ["style"] });
    return () => observer.disconnect();
  }, [inside]);
  return flat;
}

/**
 * Base UI scrolls the selected item into view on opening, which moved the page here, and with it
 * the scene. A fixed popup does not.
 */
const fixed = { positionMethod: "fixed" } as const;

function fieldTokens(cfg: Cfg) {
  return { "--ow-well-bg": cfg.well || undefined, "--ow-fg": cfg.fg || undefined } as CSSProperties;
}

function popupTokens(cfg: Cfg) {
  return { "--ow-panel": cfg.bg || undefined, "--ow-fg": cfg.fg || undefined } as CSSProperties;
}

/** The field, the short way or with every part spelled out. */
function Demo({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const portal = usePortal();
  const flat = useFlatStage(portal.container);
  const explicit = cfg.parts === "explicit";
  const items = SHORT.map((value) => (
    <Select.Item key={value} value={value} disabled={value === "durian"} data-demo={value}>
      {explicit ? (
        <>
          <Select.ItemText>{t.names[value]}</Select.ItemText>
          <Select.ItemIndicator />
        </>
      ) : (
        t.names[value]
      )}
    </Select.Item>
  ));
  return (
    <div className="demo-select">
      <div className="demo-select-field" data-width={cfg.width}>
        <Select.Root
          items={labels(lang)}
          defaultValue="cherry"
          modal={false}
          size={cfg.size as SelectSize}
        >
          <Select.Label>{t.fruit}</Select.Label>
          <Select.Trigger style={fieldTokens(cfg)} data-demo="trigger">
            {explicit ? (
              <>
                <Select.Value placeholder={t.pick} />
                <Select.Icon>
                  <Icon name="chevron-down" />
                </Select.Icon>
              </>
            ) : undefined}
          </Select.Trigger>
          <Select.Portal container={portal.container}>
            <Select.Positioner alignItemWithTrigger={flat} {...fixed}>
              <Select.Popup style={popupTokens(cfg)}>
                {explicit ? (
                  <>
                    <Select.ScrollUpArrow />
                    <Select.List>{items}</Select.List>
                    <Select.ScrollDownArrow />
                  </>
                ) : (
                  items
                )}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>
      {portal.box}
    </div>
  );
}

/** Forty years by decade, more than a screen holds, with one in the middle selected. */
function Long({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const portal = usePortal();
  const flat = useFlatStage(portal.container);
  return (
    <div className="demo-select">
      <div className="demo-select-field" data-width="fill">
        <Select.Root defaultValue="2026" modal={false} size={cfg.size as SelectSize}>
          <Select.Label>{t.year}</Select.Label>
          <Select.Trigger style={fieldTokens(cfg)} data-demo="trigger" />
          <Select.Portal container={portal.container}>
            <Select.Positioner alignItemWithTrigger={flat} {...fixed}>
              <Select.Popup style={popupTokens(cfg)}>
                {DECADES.map((start, i) => (
                  <Fragment key={start}>
                    {i > 0 ? <Select.Separator /> : null}
                    <Select.Group>
                      <Select.GroupLabel>{t.decade(start)}</Select.GroupLabel>
                      {Array.from({ length: 10 }, (_, n) => String(start + n)).map((year) => (
                        <Select.Item key={year} value={year} data-demo={year}>
                          {year}
                        </Select.Item>
                      ))}
                    </Select.Group>
                  </Fragment>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>
      {portal.box}
    </div>
  );
}

/** Base UI's `multiple`: picks add up in the trigger, and the popup stays open beside it. */
function Multiple({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const portal = usePortal();
  return (
    <div className="demo-select" data-side="top">
      <div className="demo-select-field" data-width="fill">
        <Select.Root
          items={labels(lang)}
          multiple
          defaultValue={["cherry"]}
          modal={false}
          size={cfg.size as SelectSize}
        >
          <Select.Label>{t.fruits}</Select.Label>
          <Select.Trigger style={fieldTokens(cfg)} data-demo="trigger" placeholder={t.pick} />
          <Select.Portal container={portal.container}>
            <Select.Positioner {...fixed}>
              <Select.Popup style={popupTokens(cfg)}>
                {SHORT.map((value) => (
                  <Select.Item key={value} value={value} data-demo={value}>
                    {t.names[value]}
                  </Select.Item>
                ))}
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        </Select.Root>
      </div>
      {portal.box}
    </div>
  );
}

/** A popup held open beside its trigger; `inert`, so it leaves focus with the page. */
function Pinned({
  size,
  lang,
  container,
  children,
}: {
  size: SelectSize;
  lang: Lang;
  container: HTMLElement | null;
  children?: ReactNode;
}) {
  const t = TEXT[lang];
  return (
    <Select.Root items={labels(lang)} open modal={false} defaultValue="cherry" size={size}>
      {children ? <Select.Label>{t.fruit}</Select.Label> : null}
      <Select.Trigger {...(children ? {} : { "aria-label": t.fruit })} data-demo="trigger" />
      <Select.Portal container={container}>
        <Select.Positioner alignItemWithTrigger={false} {...fixed}>
          <Select.Popup inert>
            {children ??
              ORCHARD.map((value) => (
                <Select.Item key={value} value={value}>
                  {t.names[value]}
                </Select.Item>
              ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}

/** One part of every kind in one pinned popup, for Inspect. */
function Anatomy({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const portal = usePortal();
  return (
    <div className="demo-select" data-side="top" data-pinned="">
      <div className="demo-select-field" data-width="fill">
        <Pinned size={cfg.size as SelectSize} lang={lang} container={portal.container}>
          <Select.Group>
            <Select.GroupLabel>{t.orchard}</Select.GroupLabel>
            {ORCHARD.map((value) => (
              <Select.Item key={value} value={value} data-demo={value}>
                {t.names[value]}
              </Select.Item>
            ))}
          </Select.Group>
          <Select.Separator />
          {TROPICAL.map((value) => (
            <Select.Item key={value} value={value}>
              {t.names[value]}
            </Select.Item>
          ))}
        </Pinned>
      </div>
      {portal.box}
    </div>
  );
}

/** A trigger as it rests, or a small popup held open in the cell. */
function Cell({
  theme,
  row,
  lang,
}: {
  theme: Theme;
  row: SelectSize | "placeholder" | "disabled" | "invalid" | "open";
  lang: Lang;
}) {
  const t = TEXT[lang];
  const portal = usePortal();
  const size = row === "sm" || row === "lg" ? row : "md";
  if (row === "open") {
    return (
      <div data-theme={theme} className="demo-cell demo-select-cell" data-open="">
        <Pinned size="md" lang={lang} container={portal.container} />
        {portal.box}
      </div>
    );
  }
  return (
    <div data-theme={theme} className="demo-cell demo-select-cell">
      <Select.Root
        items={labels(lang)}
        defaultValue={row === "placeholder" ? null : "cherry"}
        disabled={row === "disabled"}
        modal={false}
        size={size}
      >
        <Select.Trigger
          aria-label={t.fruit}
          placeholder={t.pick}
          aria-invalid={row === "invalid" ? true : undefined}
        />
        <Select.Portal container={portal.container}>
          <Select.Positioner alignItemWithTrigger={false} {...fixed}>
            <Select.Popup>
              {SHORT.map((value) => (
                <Select.Item key={value} value={value}>
                  {t.names[value]}
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
      {portal.box}
    </div>
  );
}

/** Each size and state, in both themes. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const rows = [
    ...SIZES.map((size) => ({ key: size, label: size })),
    { key: "placeholder", label: t.placeholder },
    { key: "disabled", label: t.disabled },
    { key: "invalid", label: t.invalid },
    { key: "open", label: t.open },
  ] as const;
  return (
    <Matrix
      columns={THEMES.map((theme) => t[theme === "light" ? "lightCol" : "darkCol"])}
      rows={rows.map((row) => ({
        label: row.label,
        cells: THEMES.map((theme) => <Cell key={theme} theme={theme} row={row.key} lang={lang} />),
      }))}
    />
  );
}

// Opens over the trigger with Cherry on the value, picks Mango, then opens again with Mango there,
// and goes back.
const align: SceneScript = async (stage) => {
  const trigger = stage.get('[data-demo="trigger"]');
  await stage.click(trigger);
  await stage.wait(800);
  await stage.click(stage.get('[data-demo="mango"]'));
  await stage.wait(900);
  await stage.click(trigger);
  await stage.wait(800);
  await stage.click(stage.get('[data-demo="cherry"]'));
};

// Opens the long list on its selected year, rolls it as the arrows do, and picks that year again.
const scroll: SceneScript = async (stage) => {
  await stage.click(stage.get('[data-demo="trigger"]'));
  await stage.wait(700);
  const list = stage.get(".ow-select__list");
  await stage.point(stage.get('[data-demo="2028"]'));
  for (const step of [32, 32, 32, 32, -32, -32, -32, -32]) {
    list.scrollTop += step;
    await stage.wait(160);
  }
  await stage.wait(400);
  await stage.click(stage.get('[data-demo="2026"]'));
};

// Adds Mango and Apple, reads the trigger, then takes them off and shuts it.
const multiple: SceneScript = async (stage) => {
  const trigger = stage.get('[data-demo="trigger"]');
  await stage.click(trigger);
  await stage.wait(600);
  for (const key of ["mango", "apple", "mango", "apple"]) {
    await stage.click(stage.get(`[data-demo="${key}"]`));
    await stage.wait(700);
  }
  await stage.click(trigger);
};

const selectLab = defineLab({
  initial,
  controls: [
    {
      key: "size",
      type: "choice",
      label: { id: "Ukuran", en: "Size" },
      options: SIZES.map((size) => ({ value: size, label: { id: size, en: size } })),
    },
    {
      key: "width",
      type: "choice",
      label: { id: "Lebar", en: "Width" },
      options: [
        { value: "fit", label: { id: "Isi", en: "Fit" } },
        { value: "fill", label: { id: "Regang", en: "Stretch" } },
      ],
    },
    {
      key: "parts",
      type: "choice",
      label: { id: "Bagian", en: "Parts" },
      options: [
        { value: "short", label: { id: "Ringkas", en: "Short" } },
        { value: "explicit", label: { id: "Lengkap", en: "Explicit" } },
      ],
    },
    { key: "well", type: "color", label: { id: "Field", en: "Field" }, token: "--ow-well-bg" },
    { key: "bg", type: "color", label: { id: "Permukaan", en: "Surface" }, token: "--ow-panel" },
    { key: "fg", type: "color", label: { id: "Teks", en: "Text" }, token: "--ow-fg" },
  ],

  parts: [
    {
      name: "Label",
      selector: ".ow-select__label",
      note: {
        id: "Menamai trigger. Tanpanya, trigger butuh aria-label.",
        en: "Names the trigger. Without it, the trigger needs an aria-label.",
      },
      tokens: { "--ow-fg": "--_fg" },
    },
    {
      name: "Trigger",
      selector: ".ow-select__trigger",
      note: {
        id: "Material field: well datar dengan tepi 3:1. Tingginya sama dengan Button; tanpa children, ia menggambar Value dan Icon.",
        en: "The Field material: a flat well with a 3:1 edge. As tall as a Button; without children, it draws a Value and an Icon.",
      },
      tokens: {
        "--ow-well-bg": "--_bg",
        "--ow-well-shadow": "--_shadow",
        "--ow-edge": "--_edge",
        "--ow-fg": "--_fg",
        "--ow-focus": "--_focus",
        "--ow-critical": "--_critical",
      },
    },
    {
      name: "Value",
      selector: ".ow-select__value",
      note: {
        id: "Label item terpilih, atau placeholder yang muted. Yang panjang diakhiri elipsis.",
        en: "The selected item's label, or the muted placeholder. A long one ends in an ellipsis.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Icon",
      selector: ".ow-select__icon",
      note: {
        id: "Chevron atas dan bawah sebesar ikon, sejauh dari tepi seperti dari atas dan bawah.",
        en: "Up and down chevrons, icon-sized, as far from the edge as from the top and bottom.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Popup",
      selector: ".ow-select__popup",
      note: {
        id: "Material panel dengan bayangan popup. Radiusnya radius item ditambah padding 4px.",
        en: "The panel material with the popup shadow. Its radius is the item's plus the 4px padding.",
      },
      tokens: {
        "--ow-panel": "--_bg",
        "--ow-popup-shadow": "--_shadow",
        "--ow-fg": "--_fg",
      },
    },
    {
      name: "GroupLabel",
      selector: ".ow-select__group-label",
      note: {
        id: "Nama grup, kecil dan muted; juga menamai grup untuk teknologi asistif.",
        en: "A group's name, small and muted; it names the group for assistive technology too.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Item",
      selector: '[data-demo="cherry"]',
      note: {
        id: "Datar; Glide yang menyalakannya. Isi biasa masuk ke ItemText setelah ItemIndicator.",
        en: "Flat; Glide lights it. Plain children go in an ItemText after an ItemIndicator.",
      },
      tokens: { "--ow-fg": "--_fg", "--ow-focus": "--_focus" },
    },
    {
      name: "ItemIndicator",
      selector: '[data-demo="cherry"] .ow-select__item-indicator',
      note: {
        id: "Centang. Tetap menyimpan tempatnya saat tidak terpilih, jadi label tetap sejajar.",
        en: "A check. It keeps its room while unselected, so labels stay in line.",
      },
    },
    {
      name: "ItemText",
      selector: '[data-demo="cherry"] .ow-select__item-text',
      note: {
        id: "Teks yang mendarat di atas teks trigger, dan yang dicocokkan saat mengetik.",
        en: "The text that lands on the trigger's, and what typing matches.",
      },
    },
    {
      name: "Separator",
      selector: ".ow-select__separator",
      note: {
        id: "Alur terukir di antara grup.",
        en: "An etched groove between groups.",
      },
      tokens: { "--ow-line-dark": "--_dark", "--ow-line-light": "--_light" },
    },
    {
      name: "ScrollDownArrow",
      selector: ".ow-select__scroll-down-arrow",
      note: {
        id: "Muncul selama masih ada isi di bawah; pointer yang berhenti di atasnya menggulir.",
        en: "Shows while there is more below; the pointer resting on it scrolls.",
      },
      tokens: { "--ow-panel": "--_bg", "--ow-muted": "--_muted" },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other setup comes from the owsem CLI, which copies the components into the project.
    const imports = isDefaultSetup(setup)
      ? 'import { Select } from "owsem-ui/base";'
      : 'import { Select } from "@/components/owsem/select";';
    const size = cfg.size === "md" ? "" : ` size="${cfg.size}"`;
    const fieldClass = cfg.well || cfg.fg || cfg.width === "fill";
    const popupClass = cfg.bg || cfg.fg;
    const trigger = `<Select.Trigger aria-label="Fruit"${fieldClass ? ' className="field"' : ""}`;
    const popup = `<Select.Popup${popupClass ? ' className="popup"' : ""}>`;
    const usage =
      cfg.parts === "explicit"
        ? [
            imports,
            'import { ChevronDown } from "lucide-react";',
            "",
            "const fruits = [",
            '  { value: "apple", label: "Apple" },',
            '  { value: "banana", label: "Banana" },',
            '  { value: "cherry", label: "Cherry" },',
            '  { value: "mango", label: "Mango" },',
            "];",
            "",
            "export function FruitSelect() {",
            "  return (",
            `    <Select.Root items={fruits} defaultValue="cherry"${size}>`,
            "      <Select.Label>Fruit</Select.Label>",
            `      <Select.Trigger${fieldClass ? ' className="field"' : ""}>`,
            '        <Select.Value placeholder="Pick a fruit" />',
            "        <Select.Icon>",
            "          <ChevronDown />",
            "        </Select.Icon>",
            "      </Select.Trigger>",
            "      <Select.Portal>",
            "        <Select.Positioner>",
            `          ${popup}`,
            "            <Select.ScrollUpArrow />",
            "            <Select.List>",
            "              {fruits.map((fruit) => (",
            "                <Select.Item key={fruit.value} value={fruit.value}>",
            "                  <Select.ItemText>{fruit.label}</Select.ItemText>",
            "                  <Select.ItemIndicator />",
            "                </Select.Item>",
            "              ))}",
            "            </Select.List>",
            "            <Select.ScrollDownArrow />",
            "          </Select.Popup>",
            "        </Select.Positioner>",
            "      </Select.Portal>",
            "    </Select.Root>",
            "  );",
            "}",
          ]
        : [
            imports,
            "",
            "export function FruitSelect() {",
            "  return (",
            `    <Select.Root defaultValue="Cherry"${size}>`,
            `      ${trigger} />`,
            `      ${popup}`,
            '        <Select.Item value="Apple">Apple</Select.Item>',
            '        <Select.Item value="Banana">Banana</Select.Item>',
            '        <Select.Item value="Cherry">Cherry</Select.Item>',
            '        <Select.Item value="Durian" disabled>',
            "          Durian",
            "        </Select.Item>",
            '        <Select.Item value="Mango">Mango</Select.Item>',
            "      </Select.Popup>",
            "    </Select.Root>",
            "  );",
            "}",
          ];
    const files = [{ name: "fruit-select.tsx", code: usage.join("\n") }];
    if (fieldClass || popupClass) {
      files.push({
        name: "select.css",
        code: [
          "/* Plain CSS wins over the component's own. */",
          ...(fieldClass
            ? [
                ".field {",
                ...(cfg.width === "fill" ? ["  inline-size: 100%;"] : []),
                ...(cfg.well ? [`  --${setup.prefix}-well-bg: ${cfg.well};`] : []),
                ...(cfg.fg ? [`  --${setup.prefix}-fg: ${cfg.fg};`] : []),
                "}",
              ]
            : []),
          ...(popupClass
            ? [
                "",
                "/* The popup itself: it renders in a portal, outside the trigger's subtree. */",
                ".popup {",
                ...(cfg.bg ? [`  --${setup.prefix}-panel: ${cfg.bg};`] : []),
                ...(cfg.fg ? [`  --${setup.prefix}-fg: ${cfg.fg};`] : []),
                "}",
              ]
            : []),
        ].join("\n"),
      });
    }
    return files;
  },

  scenes: {
    align: { cfg: { width: "fill" }, play: align },
    scroll: { demo: (cfg, lang) => <Long cfg={cfg} lang={lang} />, play: scroll },
    multiple: { demo: (cfg, lang) => <Multiple cfg={cfg} lang={lang} />, play: multiple },
    anatomy: { inspect: true, demo: (cfg, lang) => <Anatomy cfg={cfg} lang={lang} /> },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function SelectLab(props: LabProps) {
  return <LabShell lab={selectLab} {...props} />;
}
