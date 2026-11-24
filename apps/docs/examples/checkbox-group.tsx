"use client";

import { Checkbox, CheckboxGroup, type CheckboxGroupSize } from "owsem-ui/base";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import type { TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    toppings: "Topping",
    cheese: "Keju",
    olives: "Zaitun",
    onions: "Bawang",
    mushrooms: "Jamur",
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    all: "Semua topping",
    disabled: "Nonaktif",
    oneOff: "Satu nonaktif",
  },
  en: {
    toppings: "Toppings",
    cheese: "Cheese",
    olives: "Olives",
    onions: "Onions",
    mushrooms: "Mushrooms",
    sm: "Small",
    md: "Medium",
    lg: "Large",
    all: "All toppings",
    disabled: "Disabled",
    oneOff: "One disabled",
  },
} satisfies Record<Lang, Record<string, string>>;

const SIZES: readonly CheckboxGroupSize[] = ["sm", "md", "lg"];
const TOPPINGS = ["cheese", "olives", "onions"] as const;
const ALL = [...TOPPINGS, "mushrooms"] as const;

/** The rows: a label around a Checkbox, which takes its name from it. */
function Rows({ lang, values = TOPPINGS }: { lang: Lang; values?: readonly string[] }) {
  return values.map((value) => (
    <label key={value}>
      <Checkbox.Root value={value} />
      {TEXT[lang][value as keyof (typeof TEXT)["en"]]}
    </label>
  ));
}

function Default({ lang }: { lang: Lang }) {
  return (
    <CheckboxGroup aria-label={TEXT[lang].toppings} defaultValue={["cheese"]}>
      <Rows lang={lang} />
    </CheckboxGroup>
  );
}

function Sizes({ lang }: { lang: Lang }) {
  return (
    <div className="demo-checkbox-group-set">
      {SIZES.map((size) => (
        <CheckboxGroup
          key={size}
          aria-label={`${TEXT[lang].toppings}, ${size}`}
          size={size}
          defaultValue={["cheese"]}
        >
          <Rows lang={lang} values={["cheese", "olives"]} />
        </CheckboxGroup>
      ))}
    </div>
  );
}

function SelectAll({ lang }: { lang: Lang }) {
  return (
    <CheckboxGroup
      aria-label={TEXT[lang].toppings}
      defaultValue={["cheese", "olives"]}
      allValues={[...ALL]}
    >
      <label>
        <Checkbox.Root parent />
        {TEXT[lang].all}
      </label>
      <div style={{ paddingInlineStart: "calc(1.5em + 6px)" }}>
        <Rows lang={lang} values={ALL} />
      </div>
    </CheckboxGroup>
  );
}

function Locked({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-checkbox-group-set">
      <CheckboxGroup aria-label={t.disabled} defaultValue={["cheese"]} disabled>
        <Rows lang={lang} values={["cheese", "olives"]} />
      </CheckboxGroup>
      <CheckboxGroup aria-label={t.oneOff} defaultValue={["cheese"]}>
        <label>
          <Checkbox.Root value="cheese" />
          {t.cheese}
        </label>
        <label>
          <Checkbox.Root value="olives" disabled />
          {t.olives}
        </label>
      </CheckboxGroup>
    </div>
  );
}

const imp = (setup: TokenSetup) => [
  `import { Checkbox } from "${importPath(setup, "checkbox")}";`,
  `import { CheckboxGroup } from "${importPath(setup, "checkbox-group")}";`,
];

const row = (lang: Lang, value: string, extra = "") => [
  "<label>",
  `  <Checkbox.Root value="${value}"${extra} />`,
  `  ${TEXT[lang][value as keyof (typeof TEXT)["en"]]}`,
  "</label>",
];

export const checkboxGroupDefinition = defineComponent({
  item: "checkbox-group",
  imports: ["CheckboxGroup", "Checkbox"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Baris label berisi Checkbox; value grup berisi nama yang dicentang.",
        en: "Label rows holding Checkboxes; the group's value lists the names that are ticked.",
      },
      uses: ["CheckboxGroup", "Checkbox"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile("Toppings", imp(setup), [
          `<CheckboxGroup aria-label="${TEXT[lang].toppings}" defaultValue={["cheese"]}>`,
          ...TOPPINGS.flatMap((value) => row(lang, value).map((line) => `  ${line}`)),
          "</CheckboxGroup>",
        ]),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "size pada grup sampai ke Checkbox di dalamnya: baris 32, 40, atau 48px.",
        en: "size on the group reaches the Checkboxes in it: rows 32, 40, or 48px tall.",
      },
      uses: ["CheckboxGroup", "Checkbox"],
      demo: (lang) => <Sizes lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Sizes",
          imp(setup),
          SIZES.flatMap((size) => [
            `<CheckboxGroup aria-label="${TEXT[lang].toppings}, ${size}" size="${size}" defaultValue={["cheese"]}>`,
            ...["cheese", "olives"].flatMap((value) => row(lang, value).map((line) => `  ${line}`)),
            "</CheckboxGroup>",
          ]),
        ),
      ],
    },
    {
      id: "select-all",
      title: { id: "Pilih semua", en: "Select all" },
      description: {
        id: "allValues dan parent: kotak induk mencentang semuanya dan menampilkan minus bila hanya sebagian. Daftar bersarang hanyalah tata letak biasa.",
        en: "allValues and parent: the parent box ticks everything and shows a minus when only some are ticked. The nested list is plain layout.",
      },
      uses: ["CheckboxGroup", "Checkbox"],
      demo: (lang) => <SelectAll lang={lang} />,
      code: (setup, lang) => [
        exampleFile("SelectAll", imp(setup), [
          "<CheckboxGroup",
          `  aria-label="${TEXT[lang].toppings}"`,
          '  defaultValue={["cheese", "olives"]}',
          `  allValues={[${ALL.map((value) => `"${value}"`).join(", ")}]}`,
          ">",
          "  <label>",
          "    <Checkbox.Root parent />",
          `    ${TEXT[lang].all}`,
          "  </label>",
          '  <div style={{ paddingInlineStart: "calc(1.5em + 6px)" }}>',
          ...ALL.flatMap((value) => row(lang, value).map((line) => `    ${line}`)),
          "  </div>",
          "</CheckboxGroup>",
        ]),
      ],
    },
    {
      id: "disabled",
      title: { id: "Nonaktif", en: "Disabled" },
      description: {
        id: "disabled pada grup menonaktifkan semua kotaknya; satu kotak juga bisa nonaktif sendiri.",
        en: "disabled on the group turns off all its boxes; one box can be disabled on its own too.",
      },
      uses: ["CheckboxGroup", "Checkbox"],
      demo: (lang) => <Locked lang={lang} />,
      code: (setup, lang) => [
        exampleFile("Disabled", imp(setup), [
          `<CheckboxGroup aria-label="${TEXT[lang].disabled}" defaultValue={["cheese"]} disabled>`,
          ...["cheese", "olives"].flatMap((value) => row(lang, value).map((line) => `  ${line}`)),
          "</CheckboxGroup>",
          `<CheckboxGroup aria-label="${TEXT[lang].oneOff}" defaultValue={["cheese"]}>`,
          ...row(lang, "cheese").map((line) => `  ${line}`),
          ...row(lang, "olives", " disabled").map((line) => `  ${line}`),
          "</CheckboxGroup>",
        ]),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <CheckboxGroup
        aria-label={TEXT[lang].toppings}
        defaultValue={["cheese"]}
        size="lg"
        allValues={["cheese", "olives"]}
      >
        <label>
          <Checkbox.Root parent />
          {TEXT[lang].all}
        </label>
        <label>
          <Checkbox.Root value="cheese" />
          {TEXT[lang].cheese}
        </label>
      </CheckboxGroup>
    ),
  },
  parts: [
    {
      name: "Group",
      selector: ".ow-checkbox-group",
      note: {
        id: "Div dari Base UI dengan role group, tanpa lebar: ia muat pada barisnya. Memegang baris dan sorotan Glide, dan size-nya sampai ke Checkbox.",
        en: "Base UI's div with the group role, with no width of its own: it fits its rows. Holds the rows and Glide's highlight, and its size reaches the Checkboxes.",
      },
      tokens: {
        "--ow-fg": "--_fg",
        "--ow-muted": "--_muted",
      },
    },
    {
      name: "Row",
      selector: ".ow-checkbox-group label",
      note: {
        id: "Milik Anda, tanpa class sendiri: label apa pun yang memegang Checkbox, di kedalaman berapa pun. Geometrinya seperti Button.",
        en: "Yours, with no class of its own: any label holding a Checkbox, at any depth. It has Button's geometry.",
      },
    },
    {
      name: "Checkbox",
      selector: ".ow-checkbox",
      note: {
        id: "Checkbox.Root biasa. Di dalam grup ia memakai size grup, kecuali punya size sendiri. Kotak induk (parent) menampilkan minus bila sebagian dicentang.",
        en: "The ordinary Checkbox.Root. In a group it takes the group's size, unless it has its own. A parent box shows a minus while some are ticked.",
      },
      size: true,
    },
  ],
});

export default function CheckboxGroupPage(props: ExamplePageProps) {
  return <ComponentPage definition={checkboxGroupDefinition} {...props} />;
}
