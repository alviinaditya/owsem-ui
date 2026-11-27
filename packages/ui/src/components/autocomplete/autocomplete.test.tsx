import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, onTestFinished, test, vi } from "vitest";
import { commands, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { axeReport } from "../../../test/a11y.ts";
import { measureIdle, settle } from "../../../test/raf-counter.ts";
import { Field } from "../field";
import { Autocomplete } from "./index";

const root = document.documentElement;
const TAGS = ["feature", "fix", "bug", "docs", "internal", "mobile"];

const q = <T extends HTMLElement>(selector: string) => document.querySelector(selector) as T;
const all = (selector: string) => [...document.querySelectorAll<HTMLElement>(selector)];
const options = () => all('[role="option"]').map((el) => el.textContent);
/**
 * Finishes every running transition, so a popup is at rest. Base UI drops data-starting-style a
 * frame after a part mounts, and its transition starts only then.
 */
const land = async () => {
  await expect.poll(() => document.querySelector("[data-starting-style]")).toBeNull();
  for (const animation of document.getAnimations()) animation.finish();
};

const input = () => q<HTMLInputElement>('[data-slot="autocomplete-input"]');
const popup = () => q('[data-slot="autocomplete-popup"]');

function Tags({
  mode,
  empty = "No suggestions.",
  ...props
}: Partial<Omit<Autocomplete.Root.Props<string>, "items">> & { empty?: string }) {
  return (
    <Autocomplete.Root items={TAGS} mode={mode} {...props}>
      <Autocomplete.Input aria-label="Tag" />
      <Autocomplete.Popup>
        <Autocomplete.Empty>{empty}</Autocomplete.Empty>
        <Autocomplete.List>
          {(tag: string) => (
            <Autocomplete.Item key={tag} value={tag}>
              {tag}
            </Autocomplete.Item>
          )}
        </Autocomplete.List>
      </Autocomplete.Popup>
    </Autocomplete.Root>
  );
}

describe("Autocomplete", () => {
  test("the shortest use is an input that looks like an Input, with suggestions under it", async () => {
    await render(<Tags />);
    expect(input().className).toContain("ow-input");
    await userEvent.type(input(), "f");
    await expect.poll(options).toEqual(["feature", "fix"]);
    expect(popup().className).toContain("ow-combobox__popup");
    expect(popup().className).toContain("ow-select__popup");
  });

  test("the value is free text: pressing a suggestion fills the input, and other text stays", async () => {
    await render(<Tags />);
    await userEvent.type(input(), "d");
    await expect.poll(options).toEqual(["docs"]);
    await userEvent.click(all('[role="option"]')[0] as HTMLElement);
    await expect.poll(() => input().value).toBe("docs");
    await userEvent.clear(input());
    await userEvent.type(input(), "something else");
    expect(input().value).toBe("something else");
  });

  test("Empty shows its text when nothing matches; with no text the popup is hidden", async () => {
    await render(<Tags />);
    await userEvent.type(input(), "zzz");
    await expect
      .poll(() => q('[data-slot="autocomplete-empty"]')?.textContent)
      .toBe("No suggestions.");
    expect(getComputedStyle(popup()).display).not.toBe("none");
    await userEvent.clear(input());
    await userEvent.type(input(), "{Escape}");
    const bare = await render(<Tags empty="" />);
    const second = bare.container.querySelector("input") as HTMLInputElement;
    await userEvent.type(second, "zzz");
    await expect
      .poll(() => all('[data-slot="autocomplete-popup"]').at(-1)?.getAttribute("data-empty"))
      .toBe("");
    expect(
      getComputedStyle(all('[data-slot="autocomplete-popup"]').at(-1) as HTMLElement).display,
    ).toBe("none");
  });

  test('mode="both" fills the input with the highlighted suggestion as the arrows move', async () => {
    await render(<Tags mode="both" />);
    await userEvent.click(input());
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(popup).not.toBeNull();
    await land();
    await userEvent.keyboard("{ArrowDown}");
    // The input now says "feature", which is all the list filters to.
    await expect.poll(() => input().value).toBe("feature");
    expect(input().getAttribute("aria-autocomplete")).toBe("both");
  });

  test('mode="inline" fills without filtering', async () => {
    await render(<Tags mode="inline" />);
    await userEvent.click(input());
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(popup).not.toBeNull();
    await land();
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => input().value).toBe("feature");
    await userEvent.keyboard("{ArrowDown}");
    expect(options()).toEqual(TAGS);
    await expect.poll(() => input().value).toBe("fix");
    expect(input().getAttribute("aria-autocomplete")).toBe("inline");
  });

  test("the arrows and Enter work, and Glide follows the highlight", async () => {
    await render(<Tags />);
    await userEvent.click(input());
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(popup).not.toBeNull();
    await land();
    const lit = () => q('[role="option"][data-highlighted]')?.textContent;
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(lit).toBe("feature");
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(lit).toBe("fix");
    await expect.poll(() => q(".ow-glide")?.hasAttribute("data-visible")).toBe(true);
    await userEvent.keyboard("{Enter}");
    await expect.poll(() => input().value).toBe("fix");
  });

  test("grouped suggestions show their labels", async () => {
    const groups = [
      { value: "Type", items: ["feature", "fix"] },
      { value: "Area", items: ["button", "dialog"] },
    ];
    await render(
      <Autocomplete.Root items={groups}>
        <Autocomplete.Input aria-label="Tag" />
        <Autocomplete.Popup>
          <Autocomplete.List>
            {(group: (typeof groups)[number]) => (
              <Autocomplete.Group key={group.value} items={group.items}>
                <Autocomplete.GroupLabel>{group.value}</Autocomplete.GroupLabel>
                <Autocomplete.Collection>
                  {(tag: string) => (
                    <Autocomplete.Item key={tag} value={tag}>
                      {tag}
                    </Autocomplete.Item>
                  )}
                </Autocomplete.Collection>
              </Autocomplete.Group>
            )}
          </Autocomplete.List>
        </Autocomplete.Popup>
      </Autocomplete.Root>,
    );
    await userEvent.click(input());
    await userEvent.keyboard("{ArrowDown}");
    await expect.poll(() => all('[data-slot="autocomplete-group-label"]')).toHaveLength(2);
    await userEvent.type(input(), "di");
    await expect.poll(() => all('[data-slot="autocomplete-group-label"]')).toHaveLength(1);
    expect(options()).toEqual(["dialog"]);
  });

  test("an InputGroup draws the field, with a Clear and a Trigger that draw themselves", async () => {
    await render(
      <Autocomplete.Root items={TAGS} defaultValue="fix">
        <Autocomplete.InputGroup>
          <Autocomplete.Input aria-label="Tag" />
          <Autocomplete.Clear />
          <Autocomplete.Trigger />
        </Autocomplete.InputGroup>
        <Autocomplete.Popup>
          <Autocomplete.List>
            {(tag: string) => (
              <Autocomplete.Item key={tag} value={tag}>
                {tag}
              </Autocomplete.Item>
            )}
          </Autocomplete.List>
        </Autocomplete.Popup>
      </Autocomplete.Root>,
    );
    const group = q('[data-slot="autocomplete-input-group"]');
    expect(group.className).toContain("ow-combobox__input-group");
    expect(input().className).toBe("ow-combobox__input");
    expect(q('[data-slot="autocomplete-trigger"] svg')).not.toBeNull();
    expect(q('[data-slot="autocomplete-clear"] svg')).not.toBeNull();
    await userEvent.click(q('[data-slot="autocomplete-clear"]'));
    expect(input().value).toBe("");
    await userEvent.click(q('[data-slot="autocomplete-trigger"]'));
    await expect.poll(popup).not.toBeNull();
  });

  test("size reaches the input and the popup", async () => {
    await render(<Tags size="lg" />);
    expect(input().className).toContain("ow-input--lg");
    await userEvent.type(input(), "f");
    await expect.poll(popup).not.toBeNull();
    expect(popup().className).toContain("ow-select__popup--lg");
  });

  test("in a Field the label names the input and an error marks it invalid", async () => {
    await render(
      <Field.Root name="tag" invalid>
        <Field.Label>Tag</Field.Label>
        <Tags />
        <Field.Error match>Pick a tag.</Field.Error>
      </Field.Root>,
    );
    const named =
      input().labels?.[0]?.textContent ??
      document.getElementById(input().getAttribute("aria-labelledby") ?? "")?.textContent;
    expect(named).toBe("Tag");
    expect(input().hasAttribute("data-invalid")).toBe(true);
  });

  test("disabled dims the input", async () => {
    await render(<Tags disabled />);
    expect(input().disabled).toBe(true);
    expect(getComputedStyle(input()).opacity).toBe("0.45");
  });

  test("passes className and ref through, and every part has its data-slot", async () => {
    const refs = {
      group: createRef<HTMLDivElement>(),
      input: createRef<HTMLInputElement>(),
      popup: createRef<HTMLDivElement>(),
      item: createRef<HTMLDivElement>(),
    };
    await render(
      <Autocomplete.Root items={TAGS} open>
        <Autocomplete.InputGroup ref={refs.group} className="a">
          <Autocomplete.Input ref={refs.input} className="b" aria-label="Tag" />
          <Autocomplete.Clear />
          <Autocomplete.Trigger />
        </Autocomplete.InputGroup>
        <Autocomplete.Popup ref={refs.popup} className="c">
          <Autocomplete.Status />
          <Autocomplete.Empty />
          <Autocomplete.List>
            <Autocomplete.Group>
              <Autocomplete.GroupLabel>Group</Autocomplete.GroupLabel>
              <Autocomplete.Item ref={refs.item} className="d" value="fix">
                fix
              </Autocomplete.Item>
            </Autocomplete.Group>
            <Autocomplete.Separator />
          </Autocomplete.List>
        </Autocomplete.Popup>
      </Autocomplete.Root>,
    );
    for (const [name, ref] of Object.entries(refs)) expect(ref.current, name).not.toBeNull();
    expect(refs.group.current?.classList.contains("a")).toBe(true);
    expect(refs.input.current?.classList.contains("b")).toBe(true);
    expect(refs.popup.current?.classList.contains("c")).toBe(true);
    expect(refs.item.current?.classList.contains("d")).toBe(true);
    const slots = new Set(all("[data-slot]").map((el) => el.getAttribute("data-slot")));
    for (const slot of [
      "autocomplete-input-group",
      "autocomplete-input",
      "autocomplete-trigger",
      "autocomplete-icon",
      "autocomplete-positioner",
      "autocomplete-popup",
      "autocomplete-status",
      "autocomplete-empty",
      "autocomplete-list",
      "autocomplete-group",
      "autocomplete-group-label",
      "autocomplete-item",
      "autocomplete-separator",
    ]) {
      expect(slots, slot).toContain(slot);
    }
  });

  test("renders on the server, without warnings", () => {
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    onTestFinished(() => errors.mockRestore());
    const html = renderToString(
      <Autocomplete.Root items={TAGS}>
        <Autocomplete.InputGroup>
          <Autocomplete.Input aria-label="Tag" />
          <Autocomplete.Trigger />
        </Autocomplete.InputGroup>
      </Autocomplete.Root>,
    );
    expect(html).toContain("ow-combobox__input-group");
    expect(errors).not.toHaveBeenCalled();
  });

  test("has no axe violations in light and dark, shut and open", async () => {
    onTestFinished(() => {
      delete root.dataset.theme;
    });
    const screen = await render(
      <main style={{ display: "grid", gap: 24, inlineSize: 300, paddingBlockEnd: 260 }}>
        <Field.Root name="a">
          <Field.Label>Tag</Field.Label>
          <Tags />
          <Field.Description>Free text.</Field.Description>
        </Field.Root>
      </main>,
    );
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(screen.container)).toEqual({ violations: [], contrastUnknown: [] });
    }
    await userEvent.type(input(), "f");
    await expect.poll(popup).not.toBeNull();
    await land();
    for (const theme of ["light", "dark"]) {
      root.dataset.theme = theme;
      expect(await axeReport(popup())).toEqual({ violations: [], contrastUnknown: [] });
    }
  });

  test("runs no rAF and no animations when idle, open or shut", async () => {
    await render(<Tags />);
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
    await userEvent.type(input(), "f");
    await expect.poll(popup).not.toBeNull();
    await land();
    await settle();
    expect(await measureIdle()).toEqual({ rafCalls: 0, runningAnimations: [] });
  });

  test("forced colors and more contrast reach the input", async () => {
    onTestFinished(async () => {
      await commands.setForcedColors("none");
      await commands.setContrast("no-preference");
    });
    await render(<Tags />);
    await commands.setContrast("more");
    expect(getComputedStyle(input()).boxShadow).not.toBe("none");
    await commands.setForcedColors("active");
    expect(getComputedStyle(input()).outlineStyle).toBe("solid");
  });
});
