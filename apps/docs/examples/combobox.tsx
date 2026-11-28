"use client";

import { Combobox, type ComboboxSize, Field } from "owsem-ui/base";
import { Fragment, useEffect, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    fruit: "Buah",
    fruits: "Buah-buahan",
    remove: "Hapus",
    pick: "Pilih buah",
    none: "Tidak ada buah yang cocok.",
    searching: "Mencari…",
    search: "Cari buah",
    help: "Ketik untuk menyaring.",
    error: "Pilih buah dari daftar.",
    orchard: "Kebun",
    tropical: "Tropis",
    disabled: "Nonaktif",
    readOnly: "Hanya baca",
    invalid: "Tidak valid",
    names: ["Apel", "Pisang", "Ceri", "Durian", "Mangga", "Jambu", "Leci", "Pepaya"],
  },
  en: {
    fruit: "Fruit",
    fruits: "Fruits",
    remove: "Remove",
    pick: "Pick a fruit",
    none: "No fruit matches.",
    searching: "Searching…",
    search: "Search fruit",
    help: "Type to filter.",
    error: "Pick a fruit from the list.",
    orchard: "Orchard",
    tropical: "Tropical",
    disabled: "Disabled",
    readOnly: "Read only",
    invalid: "Invalid",
    names: ["Apple", "Banana", "Cherry", "Durian", "Mango", "Guava", "Lychee", "Papaya"],
  },
} satisfies Record<Lang, Record<string, unknown>>;

const SIZES: readonly ComboboxSize[] = ["sm", "md", "lg"];

/** The orchard and the tropics, by position in the names. */
const groups = (lang: Lang) => {
  const t = TEXT[lang];
  const at = (...n: number[]) => n.map((i) => t.names[i] as string);
  return [
    { value: t.orchard, items: at(0, 2) },
    { value: t.tropical, items: at(1, 3, 4, 5, 6, 7) },
  ];
};

/** The shortest use: an input, a Clear, a Trigger, and a list of items with a check. */
function Fruits({
  lang,
  size,
  defaultValue,
  label,
  disabled,
  readOnly,
}: {
  lang: Lang;
  size?: ComboboxSize;
  defaultValue?: string;
  label?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const t = TEXT[lang];
  return (
    <Combobox.Root
      items={t.names}
      size={size}
      defaultValue={defaultValue}
      disabled={disabled}
      readOnly={readOnly}
    >
      <Combobox.InputGroup>
        <Combobox.Input aria-label={label} placeholder={t.pick} />
        <Combobox.Clear />
        <Combobox.Trigger />
      </Combobox.InputGroup>
      <Combobox.Popup>
        <Combobox.Empty>{t.none}</Combobox.Empty>
        <Combobox.List>
          {(name: string) => (
            <Combobox.Item key={name} value={name}>
              {name}
              <Combobox.ItemIndicator />
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Root>
  );
}

function Default({ lang }: { lang: Lang }) {
  return (
    <Field.Root name="fruit" className="demo-combobox-field">
      <Field.Label>{TEXT[lang].fruit}</Field.Label>
      <Fruits lang={lang} />
    </Field.Root>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-col">
      {SIZES.map((size) => (
        <div key={size} className="demo-combobox-field">
          <Fruits
            lang={lang}
            size={size}
            defaultValue={TEXT[lang].names[2] as string}
            label={`${TEXT[lang].fruit}, ${size}`}
          />
        </div>
      ))}
    </div>
  );
}

/** Picks become chips in the field; Backspace in the empty input removes the last. */
function Multiple({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Field.Root name="fruits" className="demo-combobox-field">
      <Field.Label>{t.fruits}</Field.Label>
      <Combobox.Root
        items={t.names}
        multiple
        defaultValue={[t.names[0] as string, t.names[2] as string]}
      >
        <Combobox.InputGroup>
          <Combobox.Chips>
            <Combobox.Value>
              {(value: string[]) =>
                value.map((name) => (
                  <Combobox.Chip key={name}>
                    {name}
                    <Combobox.ChipRemove aria-label={`${t.remove} ${name}`} />
                  </Combobox.Chip>
                ))
              }
            </Combobox.Value>
            <Combobox.Input placeholder={t.pick} />
          </Combobox.Chips>
          <Combobox.Clear />
        </Combobox.InputGroup>
        <Combobox.Popup>
          <Combobox.Empty>{t.none}</Combobox.Empty>
          <Combobox.List>
            {(name: string) => (
              <Combobox.Item key={name} value={name}>
                {name}
                <Combobox.ItemIndicator />
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Root>
    </Field.Root>
  );
}

function Groups({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Field.Root name="groups" className="demo-combobox-field">
      <Field.Label>{t.fruit}</Field.Label>
      <Combobox.Root items={groups(lang)}>
        <Combobox.InputGroup>
          <Combobox.Input placeholder={t.pick} />
          <Combobox.Trigger />
        </Combobox.InputGroup>
        <Combobox.Popup>
          <Combobox.Empty>{t.none}</Combobox.Empty>
          <Combobox.List>
            {(group: ReturnType<typeof groups>[number], index: number) => (
              <Fragment key={group.value}>
                {index > 0 ? <Combobox.Separator /> : null}
                <Combobox.Group items={group.items}>
                  <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
                  <Combobox.Collection>
                    {(name: string) => (
                      <Combobox.Item key={name} value={name}>
                        {name}
                        <Combobox.ItemIndicator />
                      </Combobox.Item>
                    )}
                  </Combobox.Collection>
                </Combobox.Group>
              </Fragment>
            )}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Root>
    </Field.Root>
  );
}

/** A search that answers late: the Status says so, and an Empty speaks only once it is done. */
function Async({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (query === "") {
      setFound([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(() => {
      setFound(t.names.filter((name) => name.toLowerCase().includes(query.toLowerCase())));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [query, t.names]);
  return (
    <Field.Root name="search" className="demo-combobox-field">
      <Field.Label>{t.search}</Field.Label>
      <Combobox.Root items={found} filter={null} onInputValueChange={setQuery}>
        <Combobox.InputGroup>
          <Combobox.Input placeholder={t.pick} />
          <Combobox.Clear />
        </Combobox.InputGroup>
        <Combobox.Popup>
          <Combobox.Status>{loading ? t.searching : null}</Combobox.Status>
          <Combobox.Empty>{loading ? null : t.none}</Combobox.Empty>
          <Combobox.List>
            {(name: string) => (
              <Combobox.Item key={name} value={name}>
                {name}
              </Combobox.Item>
            )}
          </Combobox.List>
        </Combobox.Popup>
      </Combobox.Root>
    </Field.Root>
  );
}

function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-col">
      <div className="demo-combobox-field">
        <Fruits lang={lang} disabled defaultValue={t.names[2] as string} label={t.disabled} />
      </div>
      <div className="demo-combobox-field">
        <Fruits lang={lang} readOnly defaultValue={t.names[2] as string} label={t.readOnly} />
      </div>
      <Field.Root name="invalid" invalid className="demo-combobox-field">
        <Field.Label>{t.invalid}</Field.Label>
        <Fruits lang={lang} />
        <Field.Description>{t.help}</Field.Description>
        <Field.Error match>{t.error}</Field.Error>
      </Field.Root>
    </div>
  );
}

/**
 * The field with a value, and a grouped list held open: the popup lands in its own box, `inert`
 * and with no focus taken, so Inspect can magnify all of it. Chips are drawn by the Multiple
 * example; in one specimen they crowd the leaders.
 */
function Specimen({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [box, setBox] = useState<HTMLElement | null>(null);
  return (
    <div ref={setBox} className="demo-combobox-specimen">
      <Combobox.Root items={groups(lang)} defaultValue={t.names[0] as string} open modal={false}>
        <Combobox.InputGroup>
          <Combobox.Input aria-label={t.fruit} />
          <Combobox.Clear />
          <Combobox.Trigger />
        </Combobox.InputGroup>
        <Combobox.Portal container={box}>
          <Combobox.Positioner positionMethod="absolute">
            <Combobox.Popup inert initialFocus={false}>
              <Combobox.List>
                {(group: ReturnType<typeof groups>[number]) => (
                  <Combobox.Group key={group.value} items={group.items}>
                    <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>
                    <Combobox.Collection>
                      {(name: string) => (
                        <Combobox.Item key={name} value={name}>
                          {name}
                          <Combobox.ItemIndicator />
                        </Combobox.Item>
                      )}
                    </Combobox.Collection>
                    {group.value === t.orchard ? <Combobox.Separator /> : null}
                  </Combobox.Group>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}

const imp = (setup: TokenSetup, extra: string[] = []) => [
  `import { ${["Combobox", ...extra].join(", ")} } from "${importPath(setup, "combobox")}";`,
];

const FIELD_CSS = {
  name: "field.css",
  code: [".field {", "  display: grid;", "  inline-size: 18rem;", "}"].join("\n"),
};

const names = (lang: Lang) => `[${TEXT[lang].names.map((n) => `"${n}"`).join(", ")}]`;

const item = (indicator = true) => [
  "    {(name: string) => (",
  "      <Combobox.Item key={name} value={name}>",
  "        {name}",
  ...(indicator ? ["        <Combobox.ItemIndicator />"] : []),
  "      </Combobox.Item>",
  "    )}",
];

const popup = (empty: string, indicator = true) => [
  "<Combobox.Popup>",
  `  <Combobox.Empty>${empty}</Combobox.Empty>`,
  "  <Combobox.List>",
  ...item(indicator).map((l) => `  ${l}`),
  "  </Combobox.List>",
  "</Combobox.Popup>",
];

const indent = (lines: string[], by = 2) => lines.map((l) => `${" ".repeat(by)}${l}`);

const single = (lang: Lang, size?: ComboboxSize, value?: string) => [
  `<Combobox.Root items={fruits}${size ? ` size="${size}"` : ""}${value ? ` defaultValue="${value}"` : ""}>`,
  "  <Combobox.InputGroup>",
  `    <Combobox.Input aria-label="${TEXT[lang].fruit}" placeholder="${TEXT[lang].pick}" />`,
  "    <Combobox.Clear />",
  "    <Combobox.Trigger />",
  "  </Combobox.InputGroup>",
  ...indent(popup(TEXT[lang].none)),
  "</Combobox.Root>",
];

export const comboboxDefinition = defineComponent({
  item: "combobox",
  imports: ["Combobox"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Input, Clear, dan Trigger di dalam InputGroup, lalu Popup berisi daftar. Mengetik menyaring daftar; Clear dan Trigger menggambar × dan chevron sendiri.",
        en: "An input, a Clear, and a Trigger in an InputGroup, then a Popup with the list. Typing filters it; Clear and Trigger draw their own × and chevron.",
      },
      uses: ["Combobox", "Field"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "FruitCombobox",
          [...imp(setup, ["Field"])],
          [
            '<Field.Root name="fruit" className="field">',
            `  <Field.Label>${TEXT[lang].fruit}</Field.Label>`,
            ...indent(single(lang)),
            "</Field.Root>",
          ],
          [`  const fruits = ${names(lang)};`],
        ),
        FIELD_CSS,
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "size di Root mengatur font bidang dan item: 13, 14, atau 16px; tinggi bidang sama dengan Input.",
        en: "size on the Root sets the field's and the items' type scale: 13, 14, or 16px; the field is as tall as an Input.",
      },
      uses: ["Combobox"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          imp(setup),
          SIZES.flatMap((size) => single(lang, size, TEXT[lang].names[2])),
          [`  const fruits = ${names(lang)};`],
        ),
        FIELD_CSS,
      ],
    },
    {
      id: "multiple",
      title: { id: "Banyak", en: "Multiple" },
      description: {
        id: "multiple milik Base UI: pilihan menjadi chip di dalam bidang, daftar tetap terbuka, dan Backspace di input kosong menghapus chip terakhir.",
        en: "Base UI's multiple: picks become chips inside the field, the list stays open, and Backspace in the empty input removes the last chip.",
      },
      uses: ["Combobox", "Field"],
      demo: (lang) => <Multiple lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "FruitsCombobox",
          imp(setup, ["Field"]),
          [
            '<Field.Root name="fruits" className="field">',
            `  <Field.Label>${TEXT[lang].fruits}</Field.Label>`,
            `  <Combobox.Root items={fruits} multiple defaultValue={["${TEXT[lang].names[0]}", "${TEXT[lang].names[2]}"]}>`,
            "    <Combobox.InputGroup>",
            "      <Combobox.Chips>",
            "        <Combobox.Value>",
            "          {(value: string[]) =>",
            "            value.map((name) => (",
            "              <Combobox.Chip key={name}>",
            "                {name}",
            `                <Combobox.ChipRemove aria-label={\`${TEXT[lang].remove} \${name}\`} />`,
            "              </Combobox.Chip>",
            "            ))",
            "          }",
            "        </Combobox.Value>",
            `        <Combobox.Input placeholder="${TEXT[lang].pick}" />`,
            "      </Combobox.Chips>",
            "      <Combobox.Clear />",
            "    </Combobox.InputGroup>",
            ...indent(popup(TEXT[lang].none), 4),
            "  </Combobox.Root>",
            "</Field.Root>",
          ],
          [`  const fruits = ${names(lang)};`],
        ),
        FIELD_CSS,
      ],
    },
    {
      id: "groups",
      title: { id: "Grup", en: "Groups" },
      description: {
        id: "Item dikelompokkan dengan Group dan GroupLabel, dengan Separator di antara grup; menyaring membuang grup yang tidak punya yang cocok.",
        en: "Items grouped with Group and GroupLabel and a Separator between the groups; filtering drops a group with no match.",
      },
      uses: ["Combobox", "Field"],
      demo: (lang) => <Groups lang={lang} />,
      code: (setup, lang) => {
        const g = groups(lang);
        return [
          exampleFile(
            "GroupedCombobox",
            [...imp(setup, ["Field"]), 'import { Fragment } from "react";'],
            [
              '<Field.Root name="groups" className="field">',
              `  <Field.Label>${TEXT[lang].fruit}</Field.Label>`,
              "  <Combobox.Root items={groups}>",
              "    <Combobox.InputGroup>",
              `      <Combobox.Input placeholder="${TEXT[lang].pick}" />`,
              "      <Combobox.Trigger />",
              "    </Combobox.InputGroup>",
              "    <Combobox.Popup>",
              `      <Combobox.Empty>${TEXT[lang].none}</Combobox.Empty>`,
              "      <Combobox.List>",
              "        {(group: Group, index: number) => (",
              "          <Fragment key={group.value}>",
              "            {index > 0 ? <Combobox.Separator /> : null}",
              "            <Combobox.Group items={group.items}>",
              "              <Combobox.GroupLabel>{group.value}</Combobox.GroupLabel>",
              "              <Combobox.Collection>",
              "                {(name: string) => (",
              "                  <Combobox.Item key={name} value={name}>",
              "                    {name}",
              "                    <Combobox.ItemIndicator />",
              "                  </Combobox.Item>",
              "                )}",
              "              </Combobox.Collection>",
              "            </Combobox.Group>",
              "          </Fragment>",
              "        )}",
              "      </Combobox.List>",
              "    </Combobox.Popup>",
              "  </Combobox.Root>",
              "</Field.Root>",
            ],
            [
              "  type Group = { value: string; items: string[] };",
              `  const groups: Group[] = ${JSON.stringify(g)};`,
            ],
          ),
          FIELD_CSS,
        ];
      },
    },
    {
      id: "async",
      title: { id: "Async", en: "Async" },
      description: {
        id: "Daftar datang terlambat: filter={null} menyerahkan penyaringan ke Anda, Status memberi tahu bahwa pencarian berjalan, dan Empty baru bicara setelah selesai.",
        en: "The list arrives late: filter={null} leaves the filtering to you, the Status says a search is running, and the Empty speaks only once it is done.",
      },
      uses: ["Combobox", "Field"],
      demo: (lang) => <Async lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "SearchCombobox",
          imp(setup, ["Field"]),
          [
            '<Field.Root name="search" className="field">',
            `  <Field.Label>${TEXT[lang].search}</Field.Label>`,
            "  <Combobox.Root items={found} filter={null} onInputValueChange={setQuery}>",
            "    <Combobox.InputGroup>",
            `      <Combobox.Input placeholder="${TEXT[lang].pick}" />`,
            "      <Combobox.Clear />",
            "    </Combobox.InputGroup>",
            "    <Combobox.Popup>",
            `      <Combobox.Status>{loading ? "${TEXT[lang].searching}" : null}</Combobox.Status>`,
            `      <Combobox.Empty>{loading ? null : "${TEXT[lang].none}"}</Combobox.Empty>`,
            "      <Combobox.List>",
            ...item(false).map((l) => `    ${l}`),
            "      </Combobox.List>",
            "    </Combobox.Popup>",
            "  </Combobox.Root>",
            "</Field.Root>",
          ],
          [
            '  const [query, setQuery] = useState("");',
            "  const [found, setFound] = useState<string[]>([]);",
            "  const [loading, setLoading] = useState(false);",
            "  // Fetch on `query`: set `loading` while you wait, then `found` and not `loading`.",
          ],
        ),
        FIELD_CSS,
      ],
    },
    {
      id: "states",
      title: { id: "Status", en: "States" },
      description: {
        id: "Nonaktif meredupkan bidang dan tidak membuka apa pun; hanya baca menyimpan nilainya; di dalam Field yang invalid, bidang menjadi critical dan menggetar sekali.",
        en: "Disabled dims the field and opens nothing; read only keeps the value; in an invalid Field it turns critical and shakes once.",
      },
      uses: ["Combobox", "Field"],
      demo: (lang) => <States lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "States",
          imp(setup, ["Field"]),
          [
            `<Combobox.Root items={fruits} disabled defaultValue="${TEXT[lang].names[2]}">`,
            "  {/* …the same parts */}",
            "</Combobox.Root>",
            `<Combobox.Root items={fruits} readOnly defaultValue="${TEXT[lang].names[2]}">`,
            "  {/* … */}",
            "</Combobox.Root>",
            '<Field.Root name="invalid" invalid>',
            `  <Field.Label>${TEXT[lang].invalid}</Field.Label>`,
            "  <Combobox.Root items={fruits}>{/* … */}</Combobox.Root>",
            `  <Field.Description>${TEXT[lang].help}</Field.Description>`,
            `  <Field.Error match>${TEXT[lang].error}</Field.Error>`,
            "</Field.Root>",
          ],
          [`  const fruits = ${names(lang)};`],
        ),
        FIELD_CSS,
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => <Specimen lang={lang} />,
  },
  parts: [
    {
      name: "Root",
      selector: ".demo-combobox-specimen",
      note: {
        id: "Tidak merender elemen: ia memegang state dan membagikan size. Inspect menandai kotak yang memuat bidang dan popupnya.",
        en: "Renders no element: it holds the state and shares size. Inspect outlines the box that holds the field and its popup.",
      },
    },
    {
      name: "InputGroup",
      selector: ".ow-combobox__input-group",
      note: {
        id: "Bidangnya: isian 6% dari warna teks tanpa tepi, 9% saat hover, cincin fokus saat input fokus. Invalid mewarnainya critical dan menggetarkannya sekali. Tingginya sama dengan Input.",
        en: "The field: a 6% tint of the text color with no edge, 9% on hover, a ring while the input has focus. Invalid turns it critical and shakes it once. As tall as an Input.",
      },
      tokens: {
        "--ow-fg": "--_fg",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Input",
      selector: ".ow-combobox__input",
      note: {
        id: "Isian teks polos di dalam grup; sendirian, ia tampil seperti Input.",
        en: "A bare text field in the group; alone, it looks like an Input.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Clear",
      selector: ".ow-combobox__clear",
      note: {
        id: "Persegi datar di ujung bidang; menggambar × dan hanya tampil selama ada yang bisa dihapus.",
        en: "A flat square at the field's end; it draws an × and shows only while there is something to clear.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Trigger",
      selector: ".ow-combobox__trigger",
      note: {
        id: "Persegi datar yang membuka dan menutup daftar; tanpa children ia menggambar Icon chevron.",
        en: "A flat square that opens and shuts the list; without children it draws the chevron Icon.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Icon",
      selector: ".ow-combobox__icon",
      note: {
        id: "Chevron sebesar ikon.",
        en: "A chevron, icon-sized.",
      },
      size: true,
    },
    {
      name: "Popup",
      selector: ".ow-combobox__popup",
      note: {
        id: "Panel milik Select: material raised dengan bayangan popup. Tersembunyi bila tidak ada yang cocok dan Empty tanpa teks.",
        en: "Select's panel: the raised material with the popup shadow. Hidden when nothing matches and the Empty has no text.",
      },
      tokens: {
        "--ow-raised-bg": "--_bg",
        "--ow-popup-shadow": "--_popup-shadow",
        "--ow-fg": "--_fg",
      },
    },
    {
      name: "GroupLabel",
      selector: ".ow-select__group-label",
      note: {
        id: "Nama grup sebagai judul: huruf kapital kecil, muted, dengan jarak huruf, seperti Menu.",
        en: "A group's name as a heading: small, muted capitals with tracking, as Menu's.",
      },
      tokens: { "--ow-muted": "--_muted" },
    },
    {
      name: "Item",
      selector: ".ow-combobox__item[data-selected]",
      note: {
        id: "Datar; Glide yang menyalakannya, mengikuti panah keyboard juga.",
        en: "Flat; Glide lights it, following the arrow keys too.",
      },
      tokens: { "--ow-fg": "--_fg" },
    },
    {
      name: "Separator",
      selector: ".ow-select__separator",
      note: {
        id: "Garis tipis di antara grup.",
        en: "A hairline between groups.",
      },
      tokens: { "--ow-line": "--ow-line" },
    },
  ],
});

export default function ComboboxPage(props: ExamplePageProps) {
  return <ComponentPage definition={comboboxDefinition} {...props} />;
}
