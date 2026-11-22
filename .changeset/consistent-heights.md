---
"owsem-ui": patch
---

Control heights are now consistent: sm, md, and lg are 32, 40, and 48px for every control, and a
group that wraps items in a track (Toolbar, Toggle Group, Tabs) is as tall as a single control of
its size. Toolbar was 8px taller (its items were full control height inside its padding); its items
are now 8px shorter. Icon-only items in Toggle Group and Tabs no longer make the group shorter.
