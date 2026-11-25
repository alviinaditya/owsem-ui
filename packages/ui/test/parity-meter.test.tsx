import type { ReactElement } from "react";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Meter as CssMeter } from "../src/components/meter/index";
import { cn } from "../src/tailwind/lib/cn";
import { Meter as TwMeter } from "../src/tailwind/meter/index";
import {
  type MeterSize,
  type MeterTone,
  meterLegendItemVariants,
  meterLegendVariants,
  meterSegmentVariants,
  meterSlots,
  meterVariants,
} from "../src/tailwind/meter/meter-variants";
import {
  type Case,
  classNames,
  expectStyles,
  PROPS,
  PSEUDO,
  setMedia,
  tailwindParity,
} from "./parity";

// Meter in Tailwind CSS v4 (src/tailwind/meter) against meter.css.

const SIZES: MeterSize[] = ["sm", "md", "lg"];
const TONES: MeterTone[] = ["accent", "good", "warning", "critical"];
const OVERRIDES =
  "rounded-none bg-red-500 h-10 text-sm translate-x-4 opacity-50 outline-red-500 mb-0 font-normal";

const tw = tailwindParity(
  classNames(
    ...Object.values(meterSlots),
    ...SIZES.map((size) => meterVariants({ size })),
    ...TONES.map((tone) => meterVariants({ tone })),
    ...TONES.flatMap((tone) => [meterSegmentVariants({ tone }), meterLegendItemVariants({ tone })]),
    ...SIZES.map((size) => meterLegendVariants({ size })),
    meterSegmentVariants(),
    meterLegendItemVariants(),
    OVERRIDES,
    "bg-green-500 rounded-none h-10 gap-x-8 mt-0 bg-red-500 text-sm font-bold",
  ),
);

// What a bar draws that PROPS leaves out: the fill's translate and the grid it sits in.
const props = [
  ...PROPS,
  "translate",
  "gridRowEnd",
  "gridColumnEnd",
  "gridTemplateColumns",
  "justifySelf",
  "fontVariantNumeric",
  "printColorAdjust",
  "flexBasis",
];

// What the rest pill and the legend's dot draw, as ::after and ::before.
const pseudo = [
  ...PSEUDO,
  "flexGrow",
  "flexBasis",
  "minWidth",
  "opacity",
  "outlineStyle",
  "outlineWidth",
  "outlineColor",
  "printColorAdjust",
];

type Kit = typeof CssMeter;
const make = (name: string, ui: (Meter: Kit) => ReactElement): Case => ({
  name,
  css: ui(CssMeter),
  tw: ui(TwMeter),
});

const whole = (Meter: Kit, value: number, size?: MeterSize, tone?: MeterTone) => (
  <div style={{ inlineSize: 280 }}>
    <Meter.Root value={value} size={size} tone={tone}>
      <Meter.Label>Uploading</Meter.Label>
      <Meter.Value />
      <Meter.Track />
    </Meter.Root>
  </div>
);

const cases: Case[] = [
  ...SIZES.map((size) => make(size, (Meter) => whole(Meter, 40, size))),
  ...TONES.map((tone) => make(tone, (Meter) => whole(Meter, 72, "md", tone))),
  ...TONES.map((tone) => make(`${tone}, small`, (Meter) => whole(Meter, 20, "sm", tone))),
  make("empty", (Meter) => whole(Meter, 0)),
  make("full", (Meter) => whole(Meter, 100)),
  make("a bare bar", (Meter) => (
    <div style={{ inlineSize: 280 }}>
      <Meter.Root value={65} aria-label="Plain" />
    </div>
  )),
  make("a label and a value, no track", (Meter) => (
    <div style={{ inlineSize: 280 }}>
      <Meter.Root value={40}>
        <Meter.Label>Name</Meter.Label>
        <Meter.Value />
      </Meter.Root>
    </div>
  )),
  make("only a value", (Meter) => (
    <div style={{ inlineSize: 280 }}>
      <Meter.Root value={25} aria-label="Plain">
        <Meter.Value />
        <Meter.Track />
      </Meter.Root>
    </div>
  )),
  make("only a label", (Meter) => (
    <div style={{ inlineSize: 280 }}>
      <Meter.Root value={25}>
        <Meter.Label>Name</Meter.Label>
        <Meter.Track />
      </Meter.Root>
    </div>
  )),
  make("a scale", (Meter) => (
    <div style={{ inlineSize: 280 }}>
      <Meter.Root value={30} min={10} max={50} aria-label="Scale">
        <Meter.Value />
        <Meter.Track />
      </Meter.Root>
    </div>
  )),
  make("a format", (Meter) => (
    <div style={{ inlineSize: 280 }}>
      <Meter.Root value={3} max={8} format={{ style: "unit", unit: "megabyte" }} aria-label="U">
        <Meter.Label>Upload</Meter.Label>
        <Meter.Value />
        <Meter.Track />
      </Meter.Root>
    </div>
  )),
  make("a long label", (Meter) => (
    <div style={{ inlineSize: 180 }}>
      <Meter.Root value={50}>
        <Meter.Label>A long label that has to wrap before it reaches the value</Meter.Label>
        <Meter.Value />
        <Meter.Track />
      </Meter.Root>
    </div>
  )),
  make("in a larger font", (Meter) => (
    <div style={{ inlineSize: 280, fontSize: 24 }}>
      <Meter.Root value={50}>
        <Meter.Label>Big</Meter.Label>
        <Meter.Value />
        <Meter.Track />
      </Meter.Root>
    </div>
  )),
  make("an indicator of your own", (Meter) => (
    <div style={{ inlineSize: 280 }}>
      <Meter.Root value={50} aria-label="Own">
        <Meter.Track>
          <Meter.Indicator />
        </Meter.Track>
      </Meter.Root>
    </div>
  )),
];

const PARTS = ["focus", "meetings", "reviews", "support"] as const;

/** A week as parts of a whole, with its legend. */
const breakdown = (
  Meter: Kit,
  {
    active,
    size,
    width = 300,
    names = PARTS,
    value = 32,
    tones,
  }: {
    active?: string;
    size?: MeterSize;
    width?: number;
    names?: readonly string[];
    value?: number;
    tones?: readonly MeterTone[];
  } = {},
) => (
  <div style={{ inlineSize: width }}>
    <Meter.Group defaultActive={active} size={size}>
      <Meter.Root value={value} max={40} aria-label="Week">
        <Meter.Track>
          {names.map((name, i) => (
            <Meter.Segment key={name} name={name} value={14 - i * 2} tone={tones?.[i]} />
          ))}
        </Meter.Track>
      </Meter.Root>
      <Meter.Legend aria-label="Parts">
        {names.map((name, i) => (
          <Meter.LegendItem key={name} name={name} tone={tones?.[i]}>
            {name} <Meter.LegendValue>{14 - i * 2} h</Meter.LegendValue>
          </Meter.LegendItem>
        ))}
      </Meter.Legend>
    </Meter.Group>
  </div>
);

const parts: Case[] = [
  make("parts", (Meter) => breakdown(Meter)),
  make("parts, one picked", (Meter) => breakdown(Meter, { active: "meetings" })),
  ...SIZES.map((size) =>
    make(`parts, ${size}, one picked`, (Meter) => breakdown(Meter, { size, active: "focus" })),
  ),
  make("parts, seven of them", (Meter) =>
    breakdown(Meter, {
      names: ["a", "b", "c", "d", "e", "f", "g"],
      value: 40,
      active: "f",
      width: 360,
    }),
  ),
  make("parts with tones", (Meter) =>
    breakdown(Meter, { tones: TONES, active: "reviews", value: 32 }),
  ),
  make("parts, full", (Meter) => breakdown(Meter, { value: 40, active: "support" })),
  make("parts, empty", (Meter) => breakdown(Meter, { value: 0 })),
  make("parts, a narrow wrap", (Meter) => breakdown(Meter, { width: 120, active: "reviews" })),
  make("parts with a label and a value", (Meter) => (
    <div style={{ inlineSize: 300 }}>
      <Meter.Group defaultActive="a">
        {(shown) => (
          <>
            <Meter.Root value={10} aria-label="W">
              <Meter.Label>Working week</Meter.Label>
              <Meter.Value>{() => shown}</Meter.Value>
              <Meter.Track>
                <Meter.Segment name="a" value={6} />
                <Meter.Segment name="b" value={4} />
              </Meter.Track>
            </Meter.Root>
            <Meter.Legend aria-label="P">
              <Meter.LegendItem name="a">A</Meter.LegendItem>
              <Meter.LegendItem name="b" disabled>
                B
              </Meter.LegendItem>
            </Meter.Legend>
          </>
        )}
      </Meter.Group>
    </div>
  )),
  make("parts without a group", (Meter) => (
    <div style={{ inlineSize: 300 }}>
      <Meter.Root value={10} aria-label="W">
        <Meter.Track>
          <Meter.Segment value={6} />
          <Meter.Segment value={0} />
          <Meter.Segment value={4} tone="critical" />
        </Meter.Track>
      </Meter.Root>
      <Meter.Legend aria-label="P">
        <Meter.LegendItem name="a">A</Meter.LegendItem>
      </Meter.Legend>
    </div>
  )),
  make("a legend item as another element", (Meter) => (
    <div style={{ inlineSize: 300 }}>
      <Meter.Group defaultActive="a">
        <Meter.Legend aria-label="P">
          <Meter.LegendItem name="a" nativeButton={false} render={<div />}>
            A
          </Meter.LegendItem>
        </Meter.Legend>
      </Meter.Group>
    </div>
  )),
];

const ITEM = "[data-slot=meter-legend-item]";
const SEGMENT = "[data-slot=meter-segment]";

describe("Meter in Tailwind CSS v4 against meter.css", () => {
  test("every size and state matches in the light theme", async () => {
    await tw.parity(cases, { props });
  });

  test("and in the dark theme", async () => {
    await tw.parity(cases, { theme: "dark", props });
  });

  test("and in a right-to-left page, where the fill grows from the right", async () => {
    await tw.parity(cases, { dir: "rtl", props });
  });

  test("forced colors match: the track's edge shows and the fill is Highlight", async () => {
    await setMedia("forced-colors");
    await tw.parity(cases, { props });
  });

  test("reduced motion matches: no transition", async () => {
    await setMedia("reduced-motion");
    await tw.parity(cases, { props });
    await tw.motion(cases);
  });

  test("more contrast brings the track's edge back", async () => {
    await setMedia("more-contrast");
    await tw.parity(cases, { props });
  });

  test("transitions are the same: the fill's translate", async () => {
    await tw.motion(cases);
  });
});

describe("Meter with parts in Tailwind CSS v4 against meter.css", () => {
  const both = { props, pseudo };

  test("every part, size, and state matches in the light theme", async () => {
    await tw.parity(parts, both);
  });

  test("and in the dark theme", async () => {
    await tw.parity(parts, { ...both, theme: "dark" });
  });

  test("and in a right-to-left page, where the pills and the legend start at the right", async () => {
    await tw.parity(parts, { ...both, dir: "rtl" });
  });

  test("hovering an item tints it, and a hovered part shows its segment", {
    timeout: 60_000,
  }, async () => {
    await tw.states(parts, "parts", "hover", { ...both, target: ITEM });
    await tw.states(parts, "parts, one picked", "hover", { ...both, target: ITEM });
    await tw.states(parts, "parts, one picked", "hover", { ...both, target: SEGMENT });
  });

  test("a held press goes deepest and in to 0.97", { timeout: 60_000 }, async () => {
    await tw.states(parts, "parts", "held", { ...both, target: ITEM });
    await tw.states(parts, "parts, one picked", "held", { ...both, target: ITEM });
  });

  test("keyboard focus draws the ring", async () => {
    await tw.states(parts, "parts", "focus", { ...both, target: ITEM });
    await tw.states(parts, "parts, one picked", "focus", { ...both, target: ITEM });
  });

  test("forced colors match: parts are text color, shown is Highlight, others gray", {
    timeout: 60_000,
  }, async () => {
    await setMedia("forced-colors");
    await tw.parity(parts, both);
    await tw.states(parts, "parts, one picked", "hover", { ...both, target: ITEM });
    await tw.states(parts, "parts, one picked", "held", { ...both, target: ITEM });
    await tw.states(parts, "parts, one picked", "focus", { ...both, target: ITEM });
  });

  test("reduced motion matches: a held press does not move, the fade stays", {
    timeout: 60_000,
  }, async () => {
    await setMedia("reduced-motion");
    await tw.parity(parts, both);
    await tw.states(parts, "parts", "held", { ...both, target: ITEM });
    await tw.motion(parts);
  });

  test("more contrast matches: the pills and the rest have an edge", async () => {
    await setMedia("more-contrast");
    await tw.parity(parts, both);
  });

  test("transitions are the same: the fade, and the press", async () => {
    await tw.motion(parts);
    await tw.states(parts, "parts", "held", {
      props: ["transitionDuration", "transitionTimingFunction", "transitionProperty"],
      live: true,
      target: ITEM,
    });
  });
});

describe("a meter in Tailwind CSS v4 moves", () => {
  test("a change of value moves the fill on a transition of translate", async () => {
    tw.load();
    function Bar({ value }: { value: number }) {
      return (
        <div style={{ inlineSize: 200 }}>
          <TwMeter.Root value={value} aria-label="A" />
        </div>
      );
    }
    const screen = await render(<Bar value={10} />);
    const fill = screen.container.querySelector<HTMLElement>("[data-slot=meter-indicator]");
    if (!fill) throw new Error("not rendered");
    expect(fill.getAnimations()).toEqual([]);
    await screen.rerender(<Bar value={90} />);
    await expect
      .poll(() => fill.getAnimations().map((a) => (a as CSSTransition).transitionProperty))
      .toContain("translate");
  });
});

describe("className on the parts of Meter in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's on a segment, an item, and the legend", async () => {
    tw.load();
    const screen = await render(
      <TwMeter.Group>
        <TwMeter.Root value={4} aria-label="A">
          <TwMeter.Track>
            <TwMeter.Segment name="a" value={4} className="bg-green-500 rounded-none h-10" />
          </TwMeter.Track>
        </TwMeter.Root>
        <TwMeter.Legend aria-label="L" className="gap-x-8 mt-0">
          <TwMeter.LegendItem name="a" className="rounded-none bg-red-500 text-sm">
            A <TwMeter.LegendValue className="font-bold">4</TwMeter.LegendValue>
          </TwMeter.LegendItem>
        </TwMeter.Legend>
      </TwMeter.Group>,
    );
    const el = (slot: string) => screen.container.querySelector(`[data-slot=${slot}]`) as Element;
    expectStyles(el("meter-segment"), {
      backgroundColor: "oklch(0.723 0.219 149.579)",
      borderTopLeftRadius: "0px",
    });
    expectStyles(el("meter-legend"), { columnGap: "32px", marginTop: "0px" });
    expectStyles(el("meter-legend-item"), {
      backgroundColor: "oklch(0.637 0.237 25.331)",
      borderTopLeftRadius: "0px",
    });
    expectStyles(el("meter-legend-value"), { fontWeight: "700" });
  });
});

describe("className on Meter in Tailwind CSS v4", () => {
  test("a user's utilities beat the component's", async () => {
    tw.load();
    const screen = await render(
      <TwMeter.Root value={40} aria-label="A">
        <TwMeter.Track className={OVERRIDES}>
          <TwMeter.Indicator className="bg-green-500 rounded-none" />
        </TwMeter.Track>
      </TwMeter.Root>,
    );
    const track = screen.container.querySelector("[data-slot=meter-track]");
    const fill = screen.container.querySelector("[data-slot=meter-indicator]");
    if (!track || !fill) throw new Error("not rendered");
    expectStyles(track, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.637 0.237 25.331)",
      height: "40px",
      opacity: "0.5",
      outlineColor: "oklch(0.637 0.237 25.331)",
    });
    expectStyles(fill, {
      borderTopLeftRadius: "0px",
      backgroundColor: "oklch(0.723 0.219 149.579)",
    });
  });

  test("meterVariants() output merges with a className, the user's last", () => {
    const merged = cn(meterVariants({ size: "sm" }), "text-lg gap-x-0");
    expect(merged).toContain("text-lg");
    expect(merged).not.toContain("text-[0.8125rem]");
    expect(merged).not.toContain("gap-x-[12px]");
  });
});
