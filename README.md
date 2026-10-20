# @alexandernygard/illustrations

Generative illustrations in one house style, for covers (og:image) and art on websites: warm paper
or dark ink backgrounds, a soft colour haze, abstract motifs in fine hand-drawn line, an optional small
subject drawing, Libron type and paper grain. Each image is made from a small JSON spec.

![examples](examples/sheet.png)

```ts
import { compose } from "@alexandernygard/illustrations";

const { svg, width, height } = compose({
  title: "Timeblock",
  tagline: "Plan the day in blocks.",
  motif: "orbit",
  accent: "clay",
});
```

`compose()` returns an SVG string. It's plain TypeScript with no dependencies, so it runs in the
browser, during server rendering and in Node or Bun. The same spec always gives the same image.

To turn the SVG into PNG or WebP files (for og:image or large backgrounds), use the
`site-cover` CLI, which adds resvg and sharp.

## How it works

- **The renderer owns the style.** A spec can only choose from a fixed set of motifs, themes and
  accents. Stroke weights, the wobble filter, grain, type and layout are not configurable from a spec,
  which keeps images from different projects looking like one family.
- **Specs choose the meaning.** The motif is a visual metaphor (orbit for time, flow for data, contour
  for maps...). The optional `subject` is a tiny line drawing in a 100×100 box that the renderer
  restyles into the house line weight and palette.
- **Deterministic.** Change `seed` to reroll the random details.

## Spec

| Field | Values |
|---|---|
| `title`, `tagline`, `byline` | Text for covers. Omit `title` for art only. |
| `motif` | One of 29, below. |
| `theme` | `paper` (default), `ink` (dark), `mist` (cool grey) |
| `accent`, `accent2` | `clay` `ochre` `sage` `sky` `heather` `rose` `teal`. `accent2` defaults to a matched companion. |
| `seed` | Any string. Defaults to the title. |
| `size` | `og` (1200×630, default), `square`, `wide`, or `"WIDTHxHEIGHT"` |
| `layout` | `split` (art right, text left; default with a title) or `art` |
| `position` | Where art sits in an `art` layout: `center` (default), `left`, `right`, `top`, `bottom` |
| `fade` | Fade the art out on the side away from it. On by default when off-centre. |
| `background` | `theme` (default) or `none` for transparent |
| `texture` | Colour haze and paper grain. On by default. |
| `idPrefix` | Prefix for ids inside the SVG. Automatic and unique per spec, so inline SVGs don't clash. |
| `subject` | SVG elements in a `0 0 100 100` box, using colour tokens `ink`, `bg`, `accent`, `accent2`, `accent-soft`, `accent2-soft` |

## Motifs

29 motifs in five groups: time, data, place, connection and making.

![motifs](examples/motifs.png)

| Group | Motifs |
|---|---|
| time | orbit, sundial, pendulum, timeline, hourglass |
| data | flow, tree, matrix, sieve, knot, bars, wave, stack |
| place | contour, horizon, window, pin, rooms, grid |
| connection | constellation, bubbles, ripple, signal, interlock |
| making | bloom, prism, loom, spiral, panes |

## Development

```bash
bun install
bun run check     # typecheck
bun run build     # dist/index.js and type declarations
bun link          # lets site-cover and local apps use this checkout
```

- New motif: write a function returning `back`, `front` and an `anchor` for the subject in the
  group's file under [src/motifs/](src/motifs/) (shared helpers are in [src/draw.ts](src/draw.ts)),
  then register it with a group and description in [src/motifs.ts](src/motifs.ts).
- New accent or theme: [src/palette.ts](src/palette.ts). Keep accents at similar lightness and
  saturation so they swap cleanly.
- Check changes visually with `site-cover gallery --motifs`.

Text is set in Libron. The package doesn't include the font: load it on the page
(`@alexandernygard/libron`), or let site-cover use its TTF copies.

MIT licensed.
