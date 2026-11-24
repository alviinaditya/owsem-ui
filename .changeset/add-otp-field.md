---
"owsem-ui": minor
---

Add OTP Field, from `owsem-ui/base`, with `Root` and `Input` as Base UI has them. `OTPField.Root
length={6}` alone draws one slot for each character, named from `aria-label`; with children the slots
are yours. Slots are drawn as Input (`size` `sm`, `md`, `lg`: 32, 40, 48 px squares), from the start
edge and 0.5em apart, and an invalid field shakes the whole row once. Both flavors, CSS and Tailwind.
