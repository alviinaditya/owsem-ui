import { type CSSProperties, createRef, type ReactNode } from "react";
import { describe, expect, onTestFinished, test } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Tooltip } from "../tooltip";
import { Avatar } from "./index";

const root = document.documentElement;

/** A 1 × 1 picture, inline, so no test asks the network for anything. */
const PICTURE =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 4 4'%3E%3Crect width='4' height='4' fill='%232563eb'/%3E%3C/svg%3E";

async function mount(ui: ReactNode): Promise<HTMLElement[]> {
  const screen = await render(ui);
  return [...screen.container.querySelectorAll<HTMLElement>(".ow-avatar")];
}

async function one(ui: ReactNode): Promise<HTMLElement> {
  const [avatar] = await mount(ui);
  if (!avatar) throw new Error("no avatar");
  return avatar;
}

/** Resolves a value (e.g. `var(--ow-edge)`) of `property` to its computed form in `scope`. */
function resolve(property: "color", value: string, scope: Element = document.body) {
  const probe = document.createElement("span");
  probe.style.setProperty(property, value);
  scope.append(probe);
  const computed = getComputedStyle(probe).getPropertyValue(property);
  probe.remove();
  return computed;
}

const TINT = "color-mix(in oklab, var(--ow-fg) 10%, transparent)";

describe("Avatar", () => {
  test("shows the fallback with no image, and the image over it once it has loaded", async () => {
    const [plain, pictured] = await mount(
      <>
        <Avatar.Root>
          <Avatar.Fallback>AR</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Image src={PICTURE} alt="Ana Rahman" />
          <Avatar.Fallback>AR</Avatar.Fallback>
        </Avatar.Root>
      </>,
    );
    if (!plain || !pictured) throw new Error("no avatars");
    expect(plain.querySelector(".ow-avatar__fallback")?.textContent).toBe("AR");
    expect(plain.querySelector("img")).toBeNull();
    await expect.poll(() => pictured.querySelector("img")).not.toBeNull();
    await expect.poll(() => pictured.querySelector(".ow-avatar__fallback")).toBeNull();
    expect(pictured.querySelector("img")?.getAttribute("alt")).toBe("Ana Rahman");
  });

  test("an image that fails leaves the fallback", async () => {
    const statuses: string[] = [];
    const avatar = await one(
      <Avatar.Root>
        <Avatar.Image
          src="data:image/png;base64,AAAA"
          alt=""
          onLoadingStatusChange={(status) => statuses.push(status)}
        />
        <Avatar.Fallback>AR</Avatar.Fallback>
      </Avatar.Root>,
    );
    await expect.poll(() => statuses).toContain("error");
    expect(avatar.querySelector("img")).toBeNull();
    expect(avatar.querySelector(".ow-avatar__fallback")?.textContent).toBe("AR");
  });

  test("a circle on Button's heights, md by default", async () => {
    const [md, sm, lg] = await mount(
      <>
        <Avatar.Root>
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root size="sm">
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root size="lg">
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
      </>,
    );
    if (!md || !sm || !lg) throw new Error("no avatars");
    expect([sm, md, lg].map((el) => el.dataset.size)).toEqual(["sm", "md", "lg"]);
    expect([sm, md, lg].map((el) => getComputedStyle(el).width)).toEqual(["32px", "40px", "48px"]);
    expect([sm, md, lg].map((el) => getComputedStyle(el).height)).toEqual(["32px", "40px", "48px"]);
    expect(getComputedStyle(md).borderTopLeftRadius).toBe("50%");
    expect(getComputedStyle(md).overflow).toBe("hidden");
  });

  test("a flat tint of the text color with no edge or shadow; initials in the text color", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const avatar = await one(
      <Avatar.Root>
        <Avatar.Fallback>AR</Avatar.Fallback>
      </Avatar.Root>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      const style = getComputedStyle(avatar);
      expect(style.backgroundColor).toBe(resolve("color", TINT));
      expect(style.boxShadow).toBe("none");
      expect(style.borderTopWidth).toBe("0px");
      expect(style.color).toBe(resolve("color", "var(--ow-fg)"));
      expect(style.fontWeight).toBe("500");
      expect(style.userSelect).toBe("none");
    }
  });

  test("an icon in the fallback is the font's size plus 2px", async () => {
    const avatar = await one(
      <Avatar.Root size="lg">
        <Avatar.Fallback>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="9" r="4" />
          </svg>
        </Avatar.Fallback>
      </Avatar.Root>,
    );
    const icon = avatar.querySelector("svg") as SVGElement;
    expect(getComputedStyle(icon).width).toBe("18px");
    expect(getComputedStyle(icon).height).toBe("18px");
  });

  test("the picture covers the circle and fades in from the tint", async () => {
    const avatar = await one(
      <Avatar.Root>
        <Avatar.Image src={PICTURE} alt="Ana" />
      </Avatar.Root>,
    );
    await expect.poll(() => avatar.querySelector("img")).not.toBeNull();
    const image = avatar.querySelector("img") as HTMLImageElement;
    const style = getComputedStyle(image);
    expect(style.objectFit).toBe("cover");
    expect(style.width).toBe("40px");
    expect(style.height).toBe("40px");
    expect(style.transitionProperty).toBe("opacity");
    // Resting: shown. It began from data-starting-style at zero.
    await expect.poll(() => getComputedStyle(image).opacity).toBe("1");
  });

  test("no fade under reduced motion", async () => {
    onTestFinished(() => commands.setReducedMotion("no-preference"));
    await commands.setReducedMotion("reduce");
    const avatar = await one(
      <Avatar.Root>
        <Avatar.Image src={PICTURE} alt="Ana" />
      </Avatar.Root>,
    );
    await expect.poll(() => avatar.querySelector("img")).not.toBeNull();
    const image = avatar.querySelector("img") as HTMLImageElement;
    expect(getComputedStyle(image).transitionProperty).toBe("none");
    expect(image.getAnimations()).toEqual([]);
  });

  test("passes className, style, render, and ref through on every part", async () => {
    const rootRef = createRef<HTMLElement>();
    const groupRef = createRef<HTMLDivElement>();
    const fallbackRef = createRef<HTMLSpanElement>();
    const screen = await render(
      <Avatar.Group ref={groupRef} className="team" aria-label="Team" style={{ gap: 3 }}>
        <Avatar.Root ref={rootRef} className="mine" style={{ marginInline: "3px" }}>
          <Avatar.Fallback ref={fallbackRef} className="ink" style={{ opacity: 0.5 }}>
            A
          </Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root render={<a href="/ana" aria-label="Ana" />}>
          <Avatar.Fallback render={<i />}>B</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>,
    );
    const [plain, link] = [...screen.container.querySelectorAll<HTMLElement>(".ow-avatar")];
    if (!plain || !link) throw new Error("no avatars");
    expect(rootRef.current).toBe(plain);
    expect(groupRef.current).toBe(screen.container.firstElementChild);
    expect(fallbackRef.current).toBe(plain.firstElementChild);
    expect(plain.className).toBe("ow-avatar ow-avatar--md mine");
    expect(plain.style.marginInline).toBe("3px");
    expect(groupRef.current?.className).toBe("ow-avatar__group team");
    expect(groupRef.current?.style.gap).toBe("3px");
    expect(fallbackRef.current?.className).toBe("ow-avatar__fallback ink");
    expect(link.tagName).toBe("A");
    expect(link.firstElementChild?.tagName).toBe("I");
  });

  test("a link is focusable and draws a 2px ring 2px out, in the focus token", async () => {
    const link = await one(
      <Avatar.Root render={<a href="/ana" aria-label="Ana" />}>
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>,
    );
    await userEvent.tab();
    expect(document.activeElement).toBe(link);
    const style = getComputedStyle(link);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("2px");
    expect(style.outlineOffset).toBe("2px");
    expect(style.outlineColor).toBe(resolve("color", "var(--ow-focus)"));
    expect(style.textDecorationLine).toBe("none");
  });

  test("a button looks exactly like a span: no border, padding, or margin, the same type", async () => {
    const [plain, button, link] = await mount(
      <>
        <Avatar.Root>
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root render={<button type="button" />} aria-label="Ana">
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root render={<a href="/ana" />} aria-label="Ana">
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
      </>,
    );
    if (!plain || !button || !link) throw new Error("no avatars");
    const reference = getComputedStyle(plain);
    for (const el of [button, link]) {
      const style = getComputedStyle(el);
      for (const property of [
        "borderTopWidth",
        "borderLeftWidth",
        "paddingTop",
        "paddingLeft",
        "marginTop",
        "marginLeft",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "lineHeight",
        "width",
        "height",
        "backgroundColor",
        "color",
      ] as const) {
        expect(style[property], property).toBe(reference[property]);
      }
      expect(style.cursor).toBe("pointer");
    }
    expect(reference.cursor).not.toBe("pointer");
  });

  test("in a group, a hovered button or link shows whole above its neighbors; a span does not", async () => {
    const [plain, button, link, last] = await mount(
      <Avatar.Group aria-label="Team">
        <Avatar.Root>
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root render={<button type="button" />} aria-label="Budi">
          <Avatar.Fallback>B</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root render={<a href="/cici" />} aria-label="Cici">
          <Avatar.Fallback>C</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>D</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>,
    );
    if (!plain || !button || !link || !last) throw new Error("no avatars");
    expect(getComputedStyle(button).maskImage).not.toBe("none");
    await userEvent.hover(plain);
    expect(getComputedStyle(plain).maskImage).not.toBe("none");
    expect(getComputedStyle(plain).zIndex).toBe("auto");
    await userEvent.hover(button);
    expect(getComputedStyle(button).maskImage).toBe("none");
    expect(getComputedStyle(button).zIndex).toBe("1");
    await userEvent.hover(link);
    expect(getComputedStyle(link).maskImage).toBe("none");
    expect(getComputedStyle(link).zIndex).toBe("1");
    expect(getComputedStyle(button).maskImage).not.toBe("none");
  });

  describe("in front, whole; the one after it is cut where it sits", () => {
    const cuts = (el: HTMLElement) =>
      getComputedStyle(el).maskImage.match(/radial-gradient/g)?.length ?? 0;

    const row = (tag: "button" | "span", dir: "ltr" | "rtl" = "ltr") => (
      <div dir={dir}>
        <Avatar.Group aria-label="Team">
          {["A", "B", "C", "D", "E"].map((letter) => (
            <Avatar.Root
              key={letter}
              {...(tag === "button"
                ? { render: <button type="button" />, "aria-label": letter }
                : {})}
            >
              <Avatar.Fallback>{letter}</Avatar.Fallback>
            </Avatar.Root>
          ))}
        </Avatar.Group>
      </div>
    );

    // At rest every avatar but the last has the cut after it; the last has none.
    const rest = [1, 1, 1, 1, 0];

    for (const [name, front, expected] of [
      ["the first", 0, [0, 2, 1, 1, 0]],
      ["a middle one", 2, [1, 1, 0, 2, 0]],
      ["the next-to-last", 3, [1, 1, 1, 0, 1]],
    ] as const) {
      for (const how of ["hover", "focus"] as const) {
        test(`${how} on ${name} shows it whole above the rest and cuts the next one at its start`, async () => {
          const avatars = await mount(row("button"));
          expect(avatars.map(cuts)).toEqual(rest);
          const el = avatars[front];
          if (!el) throw new Error("no avatar");
          if (how === "hover") await userEvent.hover(el);
          else {
            for (let i = 0; i <= front; i++) await userEvent.tab();
            expect(document.activeElement).toBe(el);
          }
          expect(getComputedStyle(el).maskImage).toBe("none");
          expect(getComputedStyle(el).zIndex).toBe("1");
          expect(avatars.map(cuts)).toEqual(expected);
          // The others stay below it.
          for (const other of avatars.filter((one) => one !== el)) {
            expect(getComputedStyle(other).zIndex).toBe("auto");
          }
          // Two cuts are intersected: the gap shows on both sides.
          const next = avatars[front + 1];
          if (next && expected[front + 1] === 2) {
            expect(getComputedStyle(next).maskComposite).toMatch(/^intersect(, intersect)*$/);
          }
        });
      }
    }

    test("an avatar that is a span does not react to the pointer", async () => {
      const avatars = await mount(row("span"));
      await userEvent.hover(avatars[1] as HTMLElement);
      expect(avatars.map(cuts)).toEqual(rest);
      expect(getComputedStyle(avatars[1] as HTMLElement).zIndex).toBe("auto");
    });

    test("an open tooltip popup does not change the cuts", async () => {
      const avatars = await mount(
        <Avatar.Group aria-label="Team">
          <Avatar.Root render={<button type="button" data-popup-open="" />} aria-label="A">
            <Avatar.Fallback>A</Avatar.Fallback>
          </Avatar.Root>
          <Avatar.Root>
            <Avatar.Fallback>B</Avatar.Fallback>
          </Avatar.Root>
        </Avatar.Group>,
      );
      expect(avatars.map(cuts)).toEqual([1, 0]);
      expect(getComputedStyle(avatars[0] as HTMLElement).zIndex).toBe("auto");
    });

    test("leaving restores the cut", async () => {
      const avatars = await mount(row("button"));
      await userEvent.hover(avatars[1] as HTMLElement);
      expect(avatars.map(cuts)).toEqual([1, 0, 2, 1, 0]);
      await userEvent.unhover(avatars[1] as HTMLElement);
      expect(avatars.map(cuts)).toEqual(rest);
    });

    test("right to left mirrors both cuts", async () => {
      const avatars = await mount(row("button", "rtl"));
      await userEvent.hover(avatars[1] as HTMLElement);
      const [, front, next] = avatars;
      if (!front || !next) throw new Error("no avatars");
      expect(getComputedStyle(front).maskImage).toBe("none");
      expect(cuts(next)).toBe(2);
      // Cuts as offsets from the avatar's own center: the next avatar is to the left in rtl.
      const offsets = [
        ...getComputedStyle(next).maskImage.matchAll(/at calc\(50% ([+-]) ([\d.]+)px\)/g),
      ].map((found) => (found[1] === "-" ? -1 : 1) * Number(found[2]));
      // The first layer is the cut before (the one in front, to the right), the second the cut after.
      expect(offsets[0]).toBeGreaterThan(0);
      expect(offsets[1]).toBeLessThan(0);
    });
  });

  test("with a Tooltip on each: siblings stay direct children, Tab opens the name, the ring is whole", async () => {
    const people = ["Ana Putri", "Budi Santoso", "Cici Lestari"];
    const screen = await render(
      <Tooltip.Provider delay={0}>
        <Avatar.Group aria-label="Team">
          {people.map((name) => (
            <Tooltip.Root key={name}>
              <Tooltip.Trigger
                render={
                  <Avatar.Root render={<button type="button" />} aria-label={name}>
                    <Avatar.Fallback>{name.slice(0, 1)}</Avatar.Fallback>
                  </Avatar.Root>
                }
              />
              <Tooltip.Portal>
                <Tooltip.Positioner>
                  <Tooltip.Popup>{name}</Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          ))}
        </Avatar.Group>
      </Tooltip.Provider>,
    );
    const popupText = () =>
      document.querySelector('[data-slot="tooltip-popup"]')?.textContent ?? null;
    const group = screen.getByRole("group", { name: "Team" }).element() as HTMLElement;
    const avatars = [...group.children] as HTMLElement[];
    expect(avatars.map((el) => el.classList.contains("ow-avatar"))).toEqual([true, true, true]);
    expect(avatars.map((el) => getComputedStyle(el).maskImage === "none")).toEqual([
      false,
      false,
      true,
    ]);
    const [first, second] = avatars;
    if (!first || !second) throw new Error("no avatars");
    expect(getComputedStyle(second).marginInlineStart).toBe("-5px");
    await userEvent.tab();
    expect(document.activeElement).toBe(first);
    await expect.poll(popupText).toBe("Ana Putri");
    expect(first.getAttribute("aria-label")).toBe("Ana Putri");
    expect(getComputedStyle(first).maskImage).toBe("none");
    expect(getComputedStyle(first).zIndex).toBe("1");
    expect(getComputedStyle(first).outlineStyle).toBe("solid");
    await userEvent.keyboard("{Tab}");
    await expect.poll(popupText).toBe("Budi Santoso");
    expect(getComputedStyle(second).maskImage).toBe("none");
  });

  test("more contrast draws the edge in --ow-edge", async () => {
    onTestFinished(() => commands.setContrast("no-preference"));
    const avatar = await one(
      <Avatar.Root>
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>,
    );
    await commands.setContrast("more");
    expect(getComputedStyle(avatar).outlineColor).toBe(resolve("color", "var(--ow-edge)"));
    expect(getComputedStyle(avatar).outlineWidth).toBe("1px");
  });

  test("keeps its edge in forced colors", async () => {
    onTestFinished(() => commands.setForcedColors("none"));
    const avatar = await one(
      <Avatar.Root>
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>,
    );
    await commands.setForcedColors("active");
    const style = getComputedStyle(avatar);
    expect(style.outlineStyle).toBe("solid");
    expect(style.outlineWidth).toBe("1px");
    expect(style.outlineColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("a theme token set on an avatar changes it alone", async () => {
    const tokens = { "--ow-fg": "rgb(1, 2, 3)" } as CSSProperties;
    const [own, other] = await mount(
      <>
        <Avatar.Root style={tokens}>
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>B</Avatar.Fallback>
        </Avatar.Root>
      </>,
    );
    if (!own || !other) throw new Error("no avatars");
    expect(getComputedStyle(own).color).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(other).color).toBe(resolve("color", "var(--ow-fg)"));
    expect(getComputedStyle(own).backgroundColor).toBe(resolve("color", TINT, own));
  });

  test("an unlayered rule on a className beats its own value", async () => {
    const sheet = document.createElement("style");
    sheet.textContent = ".brand { background-color: rgb(1, 2, 3); width: 100px; }";
    document.head.append(sheet);
    onTestFinished(() => sheet.remove());
    const avatar = await one(
      <Avatar.Root className="brand">
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>,
    );
    expect(getComputedStyle(avatar).backgroundColor).toBe("rgb(1, 2, 3)");
    expect(getComputedStyle(avatar).width).toBe("100px");
  });

  test("has no axe violations in light and dark", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 16, justifyItems: "start" }}>
        <Avatar.Root>
          <Avatar.Image src={PICTURE} alt="Ana Rahman" />
          <Avatar.Fallback>AR</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root size="sm">
          <Avatar.Fallback>+3</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Group aria-label="Team">
          <Avatar.Root render={<a href="/ana" aria-label="Ana" />}>
            <Avatar.Fallback>A</Avatar.Fallback>
          </Avatar.Root>
          <Avatar.Root render={<a href="/budi" aria-label="Budi" />}>
            <Avatar.Fallback>B</Avatar.Fallback>
          </Avatar.Root>
        </Avatar.Group>
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, after the picture has loaded", async () => {
    const avatar = await one(
      <Avatar.Root>
        <Avatar.Image src={PICTURE} alt="Ana" />
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>,
    );
    await expect.poll(() => avatar.querySelector("img")).not.toBeNull();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });
});

describe("Avatar.Group", () => {
  test("is a group, and its size is the avatars' unless they have their own", async () => {
    const screen = await render(
      <Avatar.Group size="lg" aria-label="Team">
        <Avatar.Root>
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root size="sm">
          <Avatar.Fallback>B</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>,
    );
    const group = screen.getByRole("group", { name: "Team" }).element() as HTMLElement;
    const [first, second] = [...group.querySelectorAll<HTMLElement>(".ow-avatar")];
    expect(group.dataset.size).toBe("lg");
    expect(first?.dataset.size).toBe("lg");
    expect(getComputedStyle(first as Element).width).toBe("48px");
    expect(second?.dataset.size).toBe("sm");
    expect(getComputedStyle(second as Element).width).toBe("32px");
  });

  test("each avatar with another after it is cut out; the last is not", async () => {
    const screen = await render(
      <Avatar.Group aria-label="Team">
        <Avatar.Root>
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>B</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root>
          <Avatar.Fallback>+3</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>,
    );
    const [a, b, c] = [...screen.container.querySelectorAll<HTMLElement>(".ow-avatar")];
    if (!a || !b || !c) throw new Error("no avatars");
    expect(getComputedStyle(a).maskImage).toContain("radial-gradient");
    expect(getComputedStyle(b).maskImage).toContain("radial-gradient");
    expect(getComputedStyle(c).maskImage).toBe("none");
    expect(getComputedStyle(a).marginInlineStart).toBe("0px");
    expect(getComputedStyle(b).marginInlineStart).toBe("-5px");
  });

  test("a focused avatar shows its whole ring: no cut, above the others", async () => {
    const screen = await render(
      <Avatar.Group aria-label="Team">
        <Avatar.Root render={<a href="/ana" aria-label="Ana" />}>
          <Avatar.Fallback>A</Avatar.Fallback>
        </Avatar.Root>
        <Avatar.Root render={<a href="/budi" aria-label="Budi" />}>
          <Avatar.Fallback>B</Avatar.Fallback>
        </Avatar.Root>
      </Avatar.Group>,
    );
    const [a, b] = [...screen.container.querySelectorAll<HTMLElement>(".ow-avatar")];
    if (!a || !b) throw new Error("no avatars");
    expect(getComputedStyle(a).maskImage).toContain("radial-gradient");
    await userEvent.tab();
    expect(document.activeElement).toBe(a);
    expect(getComputedStyle(a).maskImage).toBe("none");
    expect(getComputedStyle(a).zIndex).toBe("1");
    await userEvent.tab();
    expect(document.activeElement).toBe(b);
    expect(getComputedStyle(a).maskImage).toContain("radial-gradient");
  });
});

test("every part has its data-slot", async () => {
  const screen = await render(
    <Avatar.Group aria-label="Team">
      <Avatar.Root>
        <Avatar.Image src={PICTURE} alt="Ana" />
        <Avatar.Fallback>A</Avatar.Fallback>
      </Avatar.Root>
      <Avatar.Root>
        <Avatar.Fallback>B</Avatar.Fallback>
      </Avatar.Root>
    </Avatar.Group>,
  );
  await expect.poll(() => screen.container.querySelector("img")).not.toBeNull();
  const slots = [...screen.container.querySelectorAll("[data-slot]")].map((el) =>
    el.getAttribute("data-slot"),
  );
  expect(slots).toEqual(["avatar-group", "avatar", "avatar-image", "avatar", "avatar-fallback"]);
});
