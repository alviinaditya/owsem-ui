---
"owsem-ui": patch
---

Code Block eases its height between snippets on the glide spring, with the new code fading in,
instead of jumping (not with reduced motion, where only the fade stays). Copy Button's Tooltip now
stays open on a click and turns "Copy" into "Copied" in place, with a short cross-fade and slide
and an eased width, then back when the icon returns.

In Tabs, Toggle Group, and Code Block tabs, the hover highlight no longer shows on the selected item
or slides out from under the indicator: it fades out where it is when it meets a selected item, and
fades in in place on the next one. Glide has an opt-in `skip` option for this.

The gooey stretch of the Toggle Group thumb, the Tabs indicator, and the Code Block tab thumb now
grows from the leading edge: it arrives with the item and never passes it or the track, while the
tail lags and catches up, and it only stretches: no squash, no rebound. The Switch thumb does the same.
