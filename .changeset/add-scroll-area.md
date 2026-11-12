---
"owsem-ui": minor
---

Add Scroll Area, on Base UI: `<ScrollArea.Root>` with only content inside draws a Viewport and a
thin scrollbar of its own, which floats over the content and shows on hover and while scrolling. Its
size comes from your CSS. Add `fade` to fade the edges that have more to scroll, and write out the
parts when one needs its own props. Native scrollbars are hidden from the stylesheet, so
`<CSPProvider disableStyleElements>` leaves no `<style>` at runtime.
