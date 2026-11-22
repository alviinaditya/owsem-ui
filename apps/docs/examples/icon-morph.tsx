"use client";

import { Button, IconButton, Toggle } from "owsem-ui/base";
import { IconMorph } from "owsem-ui/owsem";
import { useEffect, useState } from "react";
import { ComponentPage, type ExamplePageProps } from "@/components/component-page/component-page";
import { Icon } from "@/components/icons/icon";
import { defineComponent, exampleFile } from "@/lib/examples";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup, type TokenSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    meta: "Podcast · 24 menit",
    title: "Episode 12: Gerak yang menjelaskan",
    play: "Putar",
    pause: "Jeda",
    like: "Suka",
    copy: "Salin link",
    copied: "Link disalin",
  },
  en: {
    meta: "Podcast · 24 min",
    title: "Episode 12: Motion that explains",
    play: "Play",
    pause: "Pause",
    like: "Like",
    copy: "Copy link",
    copied: "Link copied",
  },
} satisfies Record<Lang, Record<string, string>>;

const LINK = "https://owsem.dev/en/icon-morph";
const SLOW = "1200ms";

function PlayButton({ lang, duration }: { lang: Lang; duration?: string }) {
  const t = TEXT[lang];
  const [playing, setPlaying] = useState(false);
  return (
    <IconButton
      variant="primary"
      aria-label={playing ? t.pause : t.play}
      onClick={() => setPlaying((on) => !on)}
      icon={
        <IconMorph duration={duration}>
          {playing ? <Icon key="pause" name="pause" /> : <Icon key="play" name="play" />}
        </IconMorph>
      }
    />
  );
}

function LikeToggle({ lang }: { lang: Lang }) {
  const [liked, setLiked] = useState(false);
  return (
    <Toggle
      aria-label={TEXT[lang].like}
      pressed={liked}
      onPressedChange={setLiked}
      startIcon={
        <IconMorph>
          {liked ? <Icon key="liked" name="heart" filled /> : <Icon key="like" name="heart" />}
        </IconMorph>
      }
    />
  );
}

function CopyLink({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <>
      <Button
        variant="outline"
        onClick={() => {
          navigator.clipboard?.writeText(LINK).catch(() => {});
          setCopied(true);
        }}
        startIcon={
          <IconMorph>
            {copied ? <Icon key="check" name="check" /> : <Icon key="copy" name="copy" />}
          </IconMorph>
        }
      >
        {t.copy}
      </Button>
      <span role="status" className="visually-hidden">
        {copied ? t.copied : ""}
      </span>
    </>
  );
}

/** An episode card: Play swaps to Pause, Like fills its heart, and Copy link checks off. */
function Episode({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <div className="demo-card demo-morph">
      <div>
        <p className="demo-muted">{t.meta}</p>
        <p className="demo-title">{t.title}</p>
      </div>
      <div className="demo-morph-row">
        <PlayButton lang={lang} />
        <LikeToggle lang={lang} />
        <CopyLink lang={lang} />
      </div>
    </div>
  );
}

/** The registry item each Base component is in. Any other setup uses the owsem CLI's copies. */
const ITEM = { Button: "button", IconButton: "button", Toggle: "toggle" } as const;

const imports = (setup: TokenSetup, base: (keyof typeof ITEM)[], extra: string[] = []) => {
  const cli = !isDefaultSetup(setup);
  const groups = new Map<string, string[]>();
  for (const name of base) {
    const path = cli ? `@/components/owsem/${ITEM[name]}` : "owsem-ui/base";
    groups.set(path, [...(groups.get(path) ?? []), name]);
  }
  return [
    ...extra,
    ...[...groups].map(([path, names]) => `import { ${names.join(", ")} } from "${path}";`),
    `import { IconMorph } from "${cli ? "@/components/owsem/icon-morph" : "owsem-ui/owsem"}";`,
  ];
};

const playCode = (setup: TokenSetup, lang: Lang, duration?: string) =>
  exampleFile(
    duration ? "SlowPlayButton" : "PlayButton",
    imports(setup, ["IconButton"], ['import { Pause, Play } from "lucide-react";']).concat(
      'import { useState } from "react";',
    ),
    [
      "<IconButton",
      '  variant="primary"',
      `  aria-label={playing ? "${TEXT[lang].pause}" : "${TEXT[lang].play}"}`,
      "  onClick={() => setPlaying((on) => !on)}",
      "  icon={",
      `    <IconMorph${duration ? ` duration="${duration}"` : ""}>`,
      '      {playing ? <Pause key="pause" /> : <Play key="play" />}',
      "    </IconMorph>",
      "  }",
      "/>",
    ],
    ["  const [playing, setPlaying] = useState(false);"],
  );

export const iconMorphDefinition = defineComponent({
  item: "icon-morph",
  imports: ["IconMorph"],
  examples: [
    {
      id: "default",
      title: { id: "Dasar", en: "Default" },
      description: {
        id: "Play menjadi Pause, hati terisi, dan Salin link tercentang: ikon lama keluar dan yang baru masuk di tempat yang sama.",
        en: "Play swaps to Pause, a heart fills, and Copy link checks off: the old icon leaves as the new one enters, in the same place.",
      },
      uses: ["IconMorph", "IconButton", "Toggle", "Button"],
      demo: (lang) => <Episode lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "EpisodeActions",
          imports(
            setup,
            ["Button", "IconButton", "Toggle"],
            [
              'import { Check, Copy, Heart, Pause, Play } from "lucide-react";',
              'import { useState } from "react";',
            ],
          ),
          [
            "<IconButton",
            '  variant="primary"',
            `  aria-label={playing ? "${TEXT[lang].pause}" : "${TEXT[lang].play}"}`,
            "  onClick={() => setPlaying((on) => !on)}",
            "  icon={",
            "    <IconMorph>",
            '      {playing ? <Pause key="pause" /> : <Play key="play" />}',
            "    </IconMorph>",
            "  }",
            "/>",
            "<Toggle",
            `  aria-label="${TEXT[lang].like}"`,
            "  pressed={liked}",
            "  onPressedChange={setLiked}",
            "  startIcon={",
            "    <IconMorph>",
            '      {liked ? <Heart key="liked" fill="currentColor" /> : <Heart key="like" />}',
            "    </IconMorph>",
            "  }",
            "/>",
            '<Button variant="outline" onClick={copyLink} startIcon={',
            "  <IconMorph>",
            '    {copied ? <Check key="check" /> : <Copy key="copy" />}',
            "  </IconMorph>",
            `}>${TEXT[lang].copy}</Button>`,
          ],
          [
            "  const [playing, setPlaying] = useState(false);",
            "  const [liked, setLiked] = useState(false);",
            "  const [copied, setCopied] = useState(false);",
            "  const copyLink = () => {",
            `    navigator.clipboard.writeText("${LINK}");`,
            "    setCopied(true);",
            "  };",
          ],
        ),
      ],
    },
    {
      id: "button",
      title: { id: "Tombol ikon", en: "Icon button" },
      description: {
        id: "Di slot ikon, ia mengisi slot itu, jadi tombol tidak berubah ukuran.",
        en: "In an icon slot it fills the slot, so the button does not change size.",
      },
      uses: ["IconMorph", "IconButton"],
      demo: (lang) => <PlayButton lang={lang} />,
      code: (setup, lang) => [playCode(setup, lang)],
    },
    {
      id: "toggle",
      title: { id: "Toggle", en: "Toggle" },
      description: {
        id: "Ikon yang sama berganti bentuk: hati kosong menjadi terisi.",
        en: "The same icon changes shape: an empty heart becomes a filled one.",
      },
      uses: ["IconMorph", "Toggle"],
      demo: (lang) => <LikeToggle lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "LikeToggle",
          imports(
            setup,
            ["Toggle"],
            ['import { Heart } from "lucide-react";', 'import { useState } from "react";'],
          ),
          [
            "<Toggle",
            `  aria-label="${TEXT[lang].like}"`,
            "  pressed={liked}",
            "  onPressedChange={setLiked}",
            "  startIcon={",
            "    <IconMorph>",
            '      {liked ? <Heart key="liked" fill="currentColor" /> : <Heart key="like" />}',
            "    </IconMorph>",
            "  }",
            "/>",
          ],
          ["  const [liked, setLiked] = useState(false);"],
        ),
      ],
    },
    {
      id: "label",
      title: { id: "Dengan label", en: "With a label" },
      description: {
        id: "Ikon di samping teks: label tidak bergeser saat ikon berganti.",
        en: "An icon beside text: the label does not move as the icon swaps.",
      },
      uses: ["IconMorph", "Button"],
      demo: (lang) => <CopyLink lang={lang} />,
      code: (setup, lang) => [
        exampleFile(
          "CopyLink",
          imports(
            setup,
            ["Button"],
            ['import { Check, Copy } from "lucide-react";', 'import { useState } from "react";'],
          ),
          [
            '<Button variant="outline" onClick={copyLink} startIcon={',
            "  <IconMorph>",
            '    {copied ? <Check key="check" /> : <Copy key="copy" />}',
            "  </IconMorph>",
            `}>${TEXT[lang].copy}</Button>`,
          ],
          [
            "  const [copied, setCopied] = useState(false);",
            "  const copyLink = () => {",
            `    navigator.clipboard.writeText("${LINK}");`,
            "    setCopied(true);",
            "    setTimeout(() => setCopied(false), 1600);",
            "  };",
          ],
        ),
      ],
    },
    {
      id: "duration",
      title: { id: "Durasi", en: "Duration" },
      description: {
        id: "duration memperpanjang satu pergantian; kurva pegasnya tetap. Tekan lagi di tengah jalan: ikon berbalik di tempatnya.",
        en: "duration lengthens one swap; the spring's curve keeps its shape. Press again mid-swap and the icons turn around where they are.",
      },
      uses: ["IconMorph", "IconButton"],
      demo: (lang) => <PlayButton lang={lang} duration={SLOW} />,
      code: (setup, lang) => [playCode(setup, lang, SLOW)],
    },
  ],
  anatomy: {
    specimen: (lang) => (
      <IconButton
        variant="primary"
        aria-label={TEXT[lang].pause}
        icon={
          <IconMorph>
            <Icon key="pause" name="pause" />
          </IconMorph>
        }
      />
    ),
  },
  parts: [
    {
      name: "Root",
      selector: ".ow-icon-morph",
      note: {
        id: "Satu sel grid tempat ikon lama dan baru bertumpuk, jadi tidak ada yang bergeser. Di slot ikon Button atau Toggle, ia mengisi slot itu.",
        en: "One grid cell where the old and the new icon stack, so nothing moves. In a Button's or Toggle's icon slot, it fills the slot.",
      },
      tokens: {
        "--ow-motion-scale": "--_motion",
        "--ow-spring-settle-duration": "--_duration",
        "--ow-spring-settle": "--_spring",
      },
    },
    {
      name: "Item",
      selector: ".ow-icon-morph__item",
      note: {
        id: "Membungkus satu ikon. Saat ikon masuk ia mendapat data-starting-style sebentar; saat keluar, data-ending-style dan aria-hidden.",
        en: "Wraps one icon. An entering one has data-starting-style for a moment; a leaving one has data-ending-style and aria-hidden.",
      },
    },
  ],
});

export default function IconMorphPage(props: ExamplePageProps) {
  return <ComponentPage definition={iconMorphDefinition} {...props} />;
}
