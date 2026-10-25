"use client";

import { Button, IconButton, Toggle } from "owsem-ui/base";
import { IconMorph } from "owsem-ui/owsem";
import { type CSSProperties, useEffect, useState } from "react";
import { FrozenMorph } from "@/components/frozen-morph";
import { Icon } from "@/components/icons/icon";
import { type LabProps, LabShell } from "@/components/lab/lab-shell";
import { Matrix } from "@/components/lab/matrix";
import { defineLab, type SceneScript } from "@/components/lab/types";
import type { Lang } from "@/lib/i18n";
import { isDefaultSetup } from "@/lib/token-setup";

const TEXT = {
  id: {
    meta: "Podcast · 24 menit",
    title: "Episode 12: Gerak yang menjelaskan",
    play: "Putar",
    pause: "Jeda",
    like: "Suka",
    copy: "Salin link",
    copied: "Link disalin",
    scale: "Skala gerak {n}",
    rest: "Diam",
  },
  en: {
    meta: "Podcast · 24 min",
    title: "Episode 12: Motion that explains",
    play: "Play",
    pause: "Pause",
    like: "Like",
    copy: "Copy link",
    copied: "Link copied",
    scale: "Motion scale {n}",
    rest: "At rest",
  },
} satisfies Record<Lang, Record<string, string>>;

const LINK = "https://owsem.dev/en/icon-morph";
// The settle spring's own duration, four times over: slow enough to watch a swap.
const SLOW = "2292ms";

const initial = { motion: "1", speed: "normal" };
type Cfg = typeof initial;

const morphStyle = (cfg: Cfg) =>
  ({
    "--ow-motion-scale": cfg.motion === "1" ? undefined : cfg.motion,
    "--ow-spring-settle-duration": cfg.speed === "slow" ? SLOW : undefined,
  }) as CSSProperties;

/** An episode card: Play swaps to Pause, Like fills its heart, and Copy link checks off. */
function Demo({ cfg, lang }: { cfg: Cfg; lang: Lang }) {
  const t = TEXT[lang];
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);
  const style = morphStyle(cfg);
  return (
    <div className="demo-card demo-morph">
      <div>
        <p className="demo-muted">{t.meta}</p>
        <p className="demo-title">{t.title}</p>
      </div>
      <div className="demo-morph-row">
        <IconButton
          variant="primary"
          aria-label={playing ? t.pause : t.play}
          onClick={() => setPlaying((on) => !on)}
          data-demo="play"
          icon={
            <IconMorph style={style}>
              {playing ? <Icon key="pause" name="pause" /> : <Icon key="play" name="play" />}
            </IconMorph>
          }
        />
        <Toggle
          aria-label={t.like}
          pressed={liked}
          onPressedChange={setLiked}
          data-demo="like"
          startIcon={
            <IconMorph style={style}>
              {liked ? <Icon key="liked" name="heart" filled /> : <Icon key="like" name="heart" />}
            </IconMorph>
          }
        />
        <Button
          variant="outline"
          onClick={(event) => {
            // Only the visitor's own press copies: a scene's press leaves their clipboard alone.
            // The check shows either way, as the demo is about the icon.
            if (event.isTrusted) navigator.clipboard?.writeText(LINK).catch(() => {});
            setCopied(true);
          }}
          data-demo="copy"
          startIcon={
            <IconMorph style={style}>
              {copied ? <Icon key="check" name="check" /> : <Icon key="copy" name="copy" />}
            </IconMorph>
          }
        >
          {t.copy}
        </Button>
        <span role="status" className="visually-hidden">
          {copied ? t.copied : ""}
        </span>
      </div>
    </div>
  );
}

const MOMENTS = [0, 80, 160, 320] as const;
const SCALES = ["1", "0.5", "0"] as const;

/** A filmstrip: one swap held at moments along the spring, at three motion scales. */
function States({ lang }: { lang: Lang }) {
  const t = TEXT[lang];
  return (
    <Matrix
      columns={SCALES.map((scale) => t.scale.replace("{n}", scale))}
      rows={[...MOMENTS, null].map((at) => ({
        label: at === null ? t.rest : `${at} ms`,
        cells: SCALES.map((scale) => (
          <span key={scale} className="demo-morph-frame">
            <FrozenMorph
              from="copy"
              to="check"
              at={at}
              size={28}
              style={{ "--ow-motion-scale": scale } as CSSProperties}
            />
          </span>
        )),
      }))}
    />
  );
}

// Plays, likes, and copies, then pauses and unlikes: the card ends as it started.
const swap: SceneScript = async (stage) => {
  for (const key of ["play", "like", "copy"]) {
    await stage.click(stage.get(`[data-demo="${key}"]`));
    await stage.wait(1100);
  }
  await stage.wait(900);
  for (const key of ["play", "like"]) {
    await stage.click(stage.get(`[data-demo="${key}"]`));
    await stage.wait(1100);
  }
};

// Presses Play four times, quicker than a swap: each press turns the icons around mid-way.
const interrupt: SceneScript = async (stage) => {
  const play = stage.get('[data-demo="play"]');
  for (let round = 0; round < 2; round++) {
    for (let press = 0; press < 4; press++) {
      await stage.click(play);
      await stage.wait(260);
    }
    await stage.wait(2600);
  }
};

const iconMorphLab = defineLab({
  initial,
  controls: [
    {
      key: "motion",
      type: "choice",
      label: { id: "Skala gerak", en: "Motion scale" },
      options: ["1", "0.5", "0"].map((value) => ({ value, label: { id: value, en: value } })),
    },
    {
      key: "speed",
      type: "choice",
      label: { id: "Kecepatan", en: "Speed" },
      options: [
        { value: "normal", label: { id: "Normal", en: "Normal" } },
        { value: "slow", label: { id: "Lambat (4×)", en: "Slow (4×)" } },
      ],
    },
  ],

  parts: [
    {
      name: "Root",
      selector: '[data-demo="play"] .ow-icon-morph',
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
      selector: '[data-demo="play"] .ow-icon-morph__item',
      note: {
        id: "Membungkus satu ikon. Saat ikon masuk ia mendapat data-starting-style sebentar; saat keluar, data-ending-style dan aria-hidden.",
        en: "Wraps one icon. An entering one has data-starting-style for a moment; a leaving one has data-ending-style and aria-hidden.",
      },
    },
  ],

  demo(cfg, lang) {
    return <Demo cfg={cfg} lang={lang} />;
  },

  code(cfg, setup) {
    // Any other token setup comes from the owsem CLI, which copies the components into the project.
    const cli = !isDefaultSetup(setup);
    const base = cli ? "@/components/owsem/toggle" : "owsem-ui/base";
    const owsem = cli ? "@/components/owsem/icon-morph" : "owsem-ui/owsem";
    const tuned = cfg.motion !== "1" || cfg.speed === "slow";
    const usage = [
      '"use client";',
      "",
      `import { Toggle } from "${base}";`,
      `import { IconMorph } from "${owsem}";`,
      'import { Heart } from "lucide-react";',
      'import { useState } from "react";',
      "",
      "export function LikeToggle() {",
      "  const [liked, setLiked] = useState(false);",
      "  return (",
      "    <Toggle",
      '      aria-label="Like"',
      ...(tuned ? ['      className="like"'] : []),
      "      pressed={liked}",
      "      onPressedChange={setLiked}",
      "      startIcon={",
      "        <IconMorph>",
      '          {liked ? <Heart key="liked" fill="currentColor" /> : <Heart key="like" />}',
      "        </IconMorph>",
      "      }",
      "    />",
      "  );",
      "}",
    ];
    const files = [{ name: "like-toggle.tsx", code: usage.join("\n") }];
    if (tuned) {
      const token = `--${setup.prefix}`;
      // On the icon itself: the settle spring also times the toggle's press.
      const lines = [
        ".like .ow-icon-morph {",
        ...(cfg.motion === "1" ? [] : [`  ${token}-motion-scale: ${cfg.motion};`]),
        ...(cfg.speed === "slow" ? [`  ${token}-spring-settle-duration: ${SLOW};`] : []),
        "}",
      ];
      files.push({ name: "like.css", code: lines.join("\n") });
    }
    return files;
  },

  scenes: {
    swap: { play: swap },
    interrupt: { cfg: { speed: "slow" }, play: interrupt },
    anatomy: { inspect: true },
    states: { demo: (_cfg, lang) => <States lang={lang} /> },
    customization: { controls: true },
    ship: { code: true },
  },
});

export default function IconMorphLab(props: LabProps) {
  return <LabShell lab={iconMorphLab} {...props} />;
}
