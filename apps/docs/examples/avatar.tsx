"use client";

import { Avatar, type AvatarSize, Tooltip } from "owsem-ui/base";
import type { ReactNode } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { defineComponent, exampleFile, importPath } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";

const TEXT = {
  id: {
    sm: "Kecil",
    md: "Sedang",
    lg: "Besar",
    team: "Tim desain",
    initials: "Tanpa gambar",
    icon: "Ikon",
    broken: "Gambar rusak",
    guest: "Tamu",
    ana: "Ana Rahman",
    people: "Anggota tim",
    rest: "Dewi dan Eko",
  },
  en: {
    sm: "Small",
    md: "Medium",
    lg: "Large",
    team: "Design team",
    initials: "No image",
    icon: "Icon",
    broken: "Broken image",
    guest: "Guest",
    ana: "Ana Rahman",
    people: "Team members",
    rest: "Dewi and Eko",
  },
} satisfies Record<Lang, unknown>;

const SIZES: readonly AvatarSize[] = ["sm", "md", "lg"];

/** A picture drawn inline, so the demo asks the network for nothing. */
const portrait = (back: string, skin: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="${back}"/><circle cx="24" cy="19" r="8" fill="${skin}"/><path d="M8 48c0-10 7-16 16-16s16 6 16 16z" fill="${skin}"/></svg>`,
  )}`;

const ANA = portrait("#c7d7fe", "#4f46e5");
const BUDI = portrait("#fde68a", "#b45309");
const CICI = portrait("#bbf7d0", "#15803d");

const User = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="8.5" r="4" />
    <path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7z" />
  </svg>
);

function Default({ lang }: { lang: Lang }) {
  return (
    <Avatar.Root>
      <Avatar.Image src={ANA} alt={TEXT[lang].ana} />
      <Avatar.Fallback>AR</Avatar.Fallback>
    </Avatar.Root>
  );
}

function Sizes() {
  return (
    <div className="demo-avatar-row">
      {SIZES.map((size) => (
        <Avatar.Root key={size} size={size}>
          <Avatar.Fallback>AR</Avatar.Fallback>
        </Avatar.Root>
      ))}
    </div>
  );
}

/** An avatar with a line under it that says why it looks as it does. */
function Captioned({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="demo-avatar-captioned">
      {children}
      <span>{caption}</span>
    </div>
  );
}

function Fallbacks({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-avatar-row">
      <Captioned caption={t.initials}>
        <Avatar.Root aria-label="Ana Rahman" role="img">
          <Avatar.Fallback>AR</Avatar.Fallback>
        </Avatar.Root>
      </Captioned>
      <Captioned caption={t.icon}>
        <Avatar.Root aria-label={t.guest} role="img">
          <Avatar.Fallback>
            <User />
          </Avatar.Fallback>
        </Avatar.Root>
      </Captioned>
      <Captioned caption={t.broken}>
        <Avatar.Root aria-label="Budi Santoso" role="img">
          <Avatar.Image src="/missing.png" alt="" />
          <Avatar.Fallback>BS</Avatar.Fallback>
        </Avatar.Root>
      </Captioned>
    </div>
  );
}

function Team({ lang }: { lang: Lang }) {
  return (
    <div className="demo-col">
      <Avatar.Group aria-label={TEXT[lang].team}>
        <Avatar.Root render={<a href="#ana" aria-label="Ana" />}>
          <Avatar.Image src={ANA} alt="" />
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root render={<a href="#budi" aria-label="Budi" />}>
          <Avatar.Image src={BUDI} alt="" />
          <Avatar.Fallback>B</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root render={<a href="#cici" aria-label="Cici" />}>
          <Avatar.Image src={CICI} alt="" />
          <Avatar.Fallback>C</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>+3</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>
      <Avatar.Group size="sm" aria-label={TEXT[lang].team}>
        <Avatar.Root>
          <Avatar.Fallback>AR</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>BS</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>+9</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>
    </div>
  );
}

/** One avatar with its name in a tooltip: the Tooltip's trigger is the avatar rendered as a button. */
function Named({ name, children }: { name: string; children: ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={
          <Avatar.Root render={<button type="button" />} aria-label={name}>
            {children}
          </Avatar.Root>
        }
      />
      <Tooltip.Portal>
        <Tooltip.Positioner>
          <Tooltip.Popup>
            <Tooltip.Arrow />
            {name}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

function Names({ lang }: { lang: Lang }) {
  return (
    <Tooltip.Provider delay={100}>
      <Avatar.Group aria-label={TEXT[lang].people}>
        <Named name="Ana Rahman">
          <Avatar.Image src={ANA} alt="" />
          <Avatar.Fallback>AR</Avatar.Fallback>
        </Named>
        <Named name="Budi Santoso">
          <Avatar.Image src={BUDI} alt="" />
          <Avatar.Fallback>BS</Avatar.Fallback>
        </Named>
        <Named name="Cici Lestari">
          <Avatar.Fallback>CL</Avatar.Fallback>
        </Named>
        <Named name={TEXT[lang].rest}>
          <Avatar.Fallback>+2</Avatar.Fallback>
        </Named>
      </Avatar.Group>
    </Tooltip.Provider>
  );
}

export const avatarDefinition = defineComponent({
  item: "avatar",
  imports: ["Avatar"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Gambar profil dengan inisial sebagai cadangan: inisial tampil sampai gambar termuat, lalu gambar memudar masuk di atas tint.",
        en: "A profile picture with initials as its fallback: the initials show until the picture has loaded, then it fades in over the tint.",
      },
      uses: ["Avatar", "Avatar.Image", "Avatar.Fallback"],
      demo: (lang) => <Default lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Profile",
          [`import { Avatar } from "${importPath(setup, "avatar")}";`],
          [
            "<Avatar.Root>",
            `  <Avatar.Image src="/ana.jpg" alt="${TEXT[lang].ana}" />`,
            "  <Avatar.Fallback>AR</Avatar.Fallback>",
            "</Avatar.Root>",
          ],
        ),
      ],
    },
    {
      id: "sizes",
      title: { id: "Ukuran", en: "Sizes" },
      description: {
        id: "sm, md, dan lg setinggi Button: 32, 40, dan 48px.",
        en: "sm, md, and lg are as tall as Button: 32, 40, and 48px.",
      },
      uses: ["Avatar", "Avatar.Fallback"],
      demo: () => <Sizes />,
      code: (setup) => [
        exampleFile(
          "Sizes",
          [`import { Avatar } from "${importPath(setup, "avatar")}";`],
          SIZES.flatMap((size) => [
            `<Avatar.Root size="${size}">`,
            "  <Avatar.Fallback>AR</Avatar.Fallback>",
            "</Avatar.Root>",
          ]),
        ),
      ],
    },
    {
      id: "fallback",
      title: { id: "Cadangan", en: "Fallback" },
      description: {
        id: "Inisial, ikon, atau gambar yang gagal termuat: Fallback tampil bila tak ada gambar.",
        en: "Initials, an icon, or a picture that fails to load: Fallback shows whenever there is no picture.",
      },
      uses: ["Avatar", "Avatar.Image", "Avatar.Fallback"],
      demo: (lang) => <Fallbacks lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Fallbacks",
          [
            `import { Avatar } from "${importPath(setup, "avatar")}";`,
            'import { User } from "lucide-react";',
          ],
          [
            '<Avatar.Root aria-label="Ana Rahman" role="img">',
            "  <Avatar.Fallback>AR</Avatar.Fallback>",
            "</Avatar.Root>",
            `<Avatar.Root aria-label="${TEXT[lang].guest}" role="img">`,
            "  <Avatar.Fallback>",
            "    <User />",
            "  </Avatar.Fallback>",
            "</Avatar.Root>",
            "{/* The image fails to load, so the fallback shows. */}",
            '<Avatar.Root aria-label="Budi Santoso" role="img">',
            '  <Avatar.Image src="/missing.png" alt="" />',
            "  <Avatar.Fallback>BS</Avatar.Fallback>",
            "</Avatar.Root>",
          ],
        ),
      ],
    },
    {
      id: "group",
      title: { id: "Grup", en: "Group" },
      description: {
        id: "Avatar.Group menumpuk avatar, masing-masing terpotong dari yang sebelumnya; ukurannya berlaku untuk isinya.",
        en: "Avatar.Group overlaps avatars, each cut out of the one before it; its size applies to what is inside.",
      },
      uses: ["Avatar", "Avatar.Group", "Avatar.Image", "Avatar.Fallback"],
      demo: (lang) => <Team lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Team",
          [`import { Avatar } from "${importPath(setup, "avatar")}";`],
          [
            `<Avatar.Group aria-label="${TEXT[lang].team}">`,
            '  <Avatar.Root render={<a href="/ana" aria-label="Ana" />}>',
            '    <Avatar.Image src="/ana.jpg" alt="" />',
            "    <Avatar.Fallback>A</Avatar.Fallback>",
            "  </Avatar.Root>",
            '  <Avatar.Root render={<a href="/budi" aria-label="Budi" />}>',
            '    <Avatar.Image src="/budi.jpg" alt="" />',
            "    <Avatar.Fallback>B</Avatar.Fallback>",
            "  </Avatar.Root>",
            "  <Avatar.Root>",
            "    <Avatar.Fallback>+3</Avatar.Fallback>",
            "  </Avatar.Root>",
            "</Avatar.Group>",
            `<Avatar.Group size="sm" aria-label="${TEXT[lang].team}">`,
            "  <Avatar.Root>",
            "    <Avatar.Fallback>AR</Avatar.Fallback>",
            "  </Avatar.Root>",
            "  <Avatar.Root>",
            "    <Avatar.Fallback>+9</Avatar.Fallback>",
            "  </Avatar.Root>",
            "</Avatar.Group>",
          ],
        ),
      ],
    },
    {
      id: "names",
      title: { id: "Nama", en: "Names" },
      description: {
        id: "Tooltip menampilkan nama saat avatar disorot atau difokus: avatar dirender sebagai tombol dan menjadi pemicu Tooltip. Avatar yang disorot tampil utuh di atas tetangganya.",
        en: "A Tooltip shows the name on hover or focus: the avatar is rendered as a button and is the Tooltip's trigger. A hovered avatar shows whole, above its neighbors.",
      },
      uses: ["Avatar", "Avatar.Group", "Avatar.Image", "Avatar.Fallback", "Tooltip"],
      demo: (lang) => <Names lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "Names",
          [
            `import { Avatar } from "${importPath(setup, "avatar")}";`,
            `import { Tooltip } from "${importPath(setup, "tooltip")}";`,
          ],
          [
            "<Tooltip.Provider delay={100}>",
            `  <Avatar.Group aria-label="${TEXT[lang].people}">`,
            "    <Tooltip.Root>",
            "      <Tooltip.Trigger",
            "        render={",
            '          <Avatar.Root render={<button type="button" />} aria-label="Ana Rahman">',
            '            <Avatar.Image src="/ana.jpg" alt="" />',
            "            <Avatar.Fallback>AR</Avatar.Fallback>",
            "          </Avatar.Root>",
            "        }",
            "      />",
            "      <Tooltip.Portal>",
            "        <Tooltip.Positioner>",
            "          <Tooltip.Popup>",
            "            <Tooltip.Arrow />",
            "            Ana Rahman",
            "          </Tooltip.Popup>",
            "        </Tooltip.Positioner>",
            "      </Tooltip.Portal>",
            "    </Tooltip.Root>",
            "    {/* One Tooltip.Root per avatar, the same way. */}",
            "  </Avatar.Group>",
            "</Tooltip.Provider>",
          ],
        ),
      ],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <Avatar.Group aria-label={TEXT[lang].team} size="lg">
        <Avatar.Root>
          <Avatar.Image src={ANA} alt="" keepMounted />
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>+3</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>
    ),
  },
  parts: [
    {
      name: "Group",
      selector: ".ow-avatar__group",
      note: {
        id: "Menumpuk avatar seperdelapan ukurannya; tiap avatar terpotong dengan mask di tempat avatar berikutnya berada, jadi celahnya menampakkan latar apa pun.",
        en: "Overlaps avatars by an eighth; each is cut with a mask where the next one sits, so the gap shows whatever is behind.",
      },
    },
    {
      name: "Root",
      selector: ".ow-avatar",
      size: true,
      note: {
        id: "Lingkaran setinggi Button: tint 10% dari warna teks tanpa tepi, inisial di tengah. Bila dirender sebagai tautan, ia bisa difokus dan menggambar cincin fokus.",
        en: "A circle as tall as Button: a 10% tint of the text color with no edge, initials at the center. Rendered as a link, it takes focus and draws a focus ring.",
      },
      tokens: {
        "--ow-fg": "--_ink",
        "--ow-focus": "--_focus",
      },
    },
    {
      name: "Image",
      selector: ".ow-avatar__image",
      note: {
        id: "Gambar yang menutupi lingkaran. Ia ada di DOM hanya setelah termuat, lalu memudar masuk di atas tint.",
        en: "The picture, covering the circle. It is in the DOM only once it has loaded, and fades in over the tint.",
      },
    },
    {
      name: "Fallback",
      selector: ".ow-avatar__fallback",
      note: {
        id: "Inisial atau ikon di tengah, tampil selama gambar belum termuat atau tak ada. Ikon seukuran font ditambah 2px.",
        en: "Initials or an icon at the center, shown until the picture has loaded or when there is none. An icon is the font's size plus 2px.",
      },
    },
  ],
});

export default function AvatarPage(props: ExamplePageProps) {
  return <ComponentPage definition={avatarDefinition} {...props} />;
}
