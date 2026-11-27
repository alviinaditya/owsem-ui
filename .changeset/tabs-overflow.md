---
"owsem-ui": minor
---

Tabs that do not fit scroll inside the list, with the edges fading where more tabs hide and a
chevron button there (`scrollButtons={false}` keeps the fade alone). The selected tab is brought
into view, and a vertical wheel scrolls a horizontal list until it reaches an end. The tabs now
sit in a `.ow-tabs__track` inside the list: a rule like `.mine > .ow-tabs__tab` needs a
descendant selector.
