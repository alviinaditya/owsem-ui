import { describe, expect, test } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { Sidebar } from "./index";

function Nav({ count, active }: { count: number; active?: string }) {
  const hrefs = Array.from({ length: count }, (_, i) => `/p${i}`);
  return (
    <Sidebar.Provider>
      <Sidebar.Root style={{ blockSize: 300 }}>
        <Sidebar.Content>
          <Sidebar.Indicator />
          <Sidebar.Group>
            <Sidebar.GroupLabel>Pages</Sidebar.GroupLabel>
            <Sidebar.List>
              {hrefs.map((href) => (
                <Sidebar.Item key={href} href={href} active={href === active}>
                  {href}
                </Sidebar.Item>
              ))}
            </Sidebar.List>
          </Sidebar.Group>
        </Sidebar.Content>
      </Sidebar.Root>
    </Sidebar.Provider>
  );
}

const content = () => document.querySelector(".ow-sidebar__content") as HTMLElement;
const flags = () => [
  content().hasAttribute("data-overflow-start"),
  content().hasAttribute("data-overflow-end"),
];

describe("Sidebar Content overflow", () => {
  test("no fade when nothing overflows", async () => {
    await render(<Nav count={3} />);
    expect(flags()).toEqual([false, false]);
    expect(getComputedStyle(content()).maskImage).toBe("none");
  });

  test("fades toward the overflowing side only", async () => {
    await render(<Nav count={40} />);
    const el = content();
    expect(flags()).toEqual([false, true]);
    expect(getComputedStyle(el).maskImage).toContain("linear-gradient");
    el.scrollTop = 300;
    await expect.poll(flags).toEqual([true, true]);
    el.scrollTop = el.scrollHeight;
    await expect.poll(flags).toEqual([true, false]);
    expect(getComputedStyle(el).maskImage).toContain("linear-gradient");
  });

  test("the scrollbar is hidden and the list still scrolls", async () => {
    await render(<Nav count={40} />);
    const el = content();
    expect(getComputedStyle(el).scrollbarWidth).toBe("none");
    expect(el.offsetWidth - el.clientWidth).toBe(0);
    el.scrollBy(0, 100);
    await expect.poll(() => el.scrollTop).toBeGreaterThan(0);
    el.scrollTop = 0;
    const link = el.querySelector("a") as HTMLElement;
    link.focus();
    await userEvent.keyboard("{Tab}".repeat(20));
    await expect.poll(() => el.scrollTop).toBeGreaterThan(0);
  });

  test("the last item scrolls clear of the bottom edge", async () => {
    await render(<Nav count={40} />);
    const el = content();
    el.scrollTop = el.scrollHeight;
    const last = [...el.querySelectorAll("a")].at(-1) as HTMLElement;
    await expect
      .poll(() => el.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom)
      .toBeGreaterThanOrEqual(24);
  });

  test("the liquid stays on the active item after scrolling", async () => {
    await render(<Nav count={40} active="/p20" />);
    const el = content();
    const dot = el.querySelector(".ow-sidebar__liquid-dot") as Element;
    const link = el.querySelector('a[href="/p20"]') as HTMLElement;
    const centered = () => {
      const a = dot.getBoundingClientRect();
      const b = link.getBoundingClientRect();
      return Math.abs(a.top + a.height / 2 - (b.top + b.height / 2));
    };
    await expect.poll(centered).toBeLessThan(2);
    el.scrollTop += 40;
    await expect.poll(centered).toBeLessThan(2);
  });
});
