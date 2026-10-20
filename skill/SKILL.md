---
name: site-cover
description: |
  Make the cover / social preview image (og:image, Twitter card, portfolio thumbnail) for one of
  Alex's projects with the `site-cover` CLI (repo ~/MyStuff/Projects/site-cover-generator), so every
  project shares one artistic house style. Use when the user asks for a cover, og image, social
  image, link preview, share image, meta image, portfolio thumbnail or "make it look good when
  shared", or when setting up a new app's <head>. Also use it for illustrations on the site itself:
  hero backgrounds, empty states, 404 pages, section dividers, onboarding art and portfolio cards.
  Do not hand-draw a cover SVG or illustration, or use an image model instead.
---

# Project covers with site-cover

`site-cover` renders a 1200×630 PNG from a small JSON spec. The renderer owns the style (palette,
Libron type, line weight, hand-drawn wobble, haze, paper grain), so covers from different projects
match. Your job is to pick the metaphor and, optionally, draw one small subject.

## Steps

1. Understand the project: read its README, package.json and main screens. Find the one thing it does.
2. Write `cover.json` in the project root (commit it, so the cover can be regenerated):

   ```json
   {
     "title": "Budget",
     "tagline": "Monthly spending, sorted and forecast without the spreadsheet.",
     "byline": "alexandernygard.com",
     "motif": "wave",
     "accent": "sage",
     "subject": "<circle cx=\"50\" cy=\"50\" r=\"30\" fill=\"bg\"/><path d=\"M50 36v28\"/>"
   }
   ```

3. Render into the folder the framework serves as-is (SvelteKit `static/`, Vite/Next `public/`):

   ```bash
   site-cover render cover.json -o static/og.png
   ```

4. **Look at the PNG** with the Read tool. If something is off, change `seed` (any string) for new
   random details, or try another motif or accent, and render again. Two or three tries is normal.
5. Add the tags the command prints to the `<head>` (SvelteKit: `src/app.html` or the root
   `+layout.svelte` `<svelte:head>`). `og:image` must be an absolute URL on the deployed domain. Also
   set `og:title`, `og:description` and `og:url` if the page lacks them.

## Spec

| Field | Values | Notes |
|---|---|---|
| `title` | text | Project name. 1–3 words reads best. Omit for an art-only image. |
| `tagline` | text | One plain sentence on what it does, under ~70 characters. No marketing words. |
| `byline` | text | Small label top-left. Use `alexandernygard.com` unless the project has its own domain. |
| `motif` | see `site-cover list` | The visual metaphor. Choose it; don't leave it to chance. |
| `theme` | `paper` (default), `ink`, `mist` | `ink` is dark. Match the app's own look if it has a strong one. |
| `accent` | `clay` `ochre` `sage` `sky` `heather` `rose` `teal` | Main colour. `accent2` defaults to a matched companion. |
| `seed` | text | Defaults to the title. Change it to reroll details. |
| `size` | `og` (default), `square`, `wide`, or `"WIDTHxHEIGHT"` | `square` for Instagram-style posts. Custom sizes are for site art. |
| `layout` | `split` (default with a title), `art` | `art` is the illustration alone, with no text. |
| `position` | `center` (default), `left`, `right`, `top`, `bottom` | Where the art sits in an `art` layout. |
| `fade` | `true`/`false` | Fades the art out on the side away from it. On by default when `position` is off-centre. |
| `background` | `theme` (default), `none` | `none` is transparent, to sit on the page's own colour. Grain is skipped. |
| `texture` | `true` (default)/`false` | The colour haze and paper grain. |
| `idPrefix` | text | Prefix for ids inside the SVG. Automatic and unique per spec; only set it to pin it. |
| `subject` | SVG elements | Optional small drawing of the project's subject. See below. |

Motifs, by group (run `site-cover list` for what each one suggests). All of them are shown in
`~/MyStuff/Projects/site-cover-generator/examples/motifs.png`; look at it before choosing.

- **time:** orbit, sundial, pendulum, timeline, hourglass
- **data:** flow, tree, matrix, sieve, knot, bars, wave, stack
- **place:** contour, horizon, window, pin, rooms, grid
- **connection:** constellation, bubbles, ripple, signal, interlock
- **making:** bloom, prism, loom, spiral, panes

Pick the group first (what kind of thing is this project about?), then the motif in it that fits
best. Prefer a specific match over a generic one: a money app is `bars`, not `panes`.

## Site art

The same renderer makes illustrations for the site itself, so a project's pages match its cover.
Reuse the project's cover motif, accent and theme for its site art unless a section is about
something else. The output format follows the `-o` extension: `.png`, `.webp` or `.svg`.

Pick the format by size:

- **Large images (heroes, full-width backgrounds): `.webp` with `--scale 2`.** The wobble and grain are
  SVG filters, and a big filtered SVG repaints slowly while scrolling. A 1920×800 hero at 2× is about 130 KB.
- **Small images (empty states, cards, 404s): `.svg`.** Use `"background":"none","texture":false`
  so it sits on the page's colour with no filters to repaint. Inline SVGs on one page never clash:
  ids are unique per spec.
- Text in an SVG needs the Libron font loaded on the page. Site art normally has no text.

Recipes (put files in the framework's static folder, e.g. SvelteKit `static/art/`):

```bash
# Hero background: art on the right, heading on the left. Fades out under the heading.
site-cover render --spec '{"motif":"flow","accent":"clay","size":"1920x800","position":"right"}' -o static/art/hero.webp --scale 2
site-cover render --spec '{"motif":"flow","accent":"clay","size":"1920x800","position":"right","theme":"ink"}' -o static/art/hero-dark.webp --scale 2
# Mobile hero: art at the top, content below.
site-cover render --spec '{"motif":"flow","accent":"clay","size":"800x1200","position":"top"}' -o static/art/hero-mobile.webp --scale 2
# Empty state or 404: small, transparent, no texture.
site-cover render --spec '{"motif":"sieve","accent":"clay","size":"480x360","background":"none","texture":false}' -o static/art/empty.svg
# Section divider: a wide strip. flow and horizon run edge to edge; other motifs give a small centred ornament.
site-cover render --spec '{"motif":"flow","accent":"clay","size":"1600x240","background":"none","texture":false}' -o static/art/divider.webp --scale 2
```

Use them like this:

```css
.hero { background: url(/art/hero.webp) right center / cover; }
@media (prefers-color-scheme: dark) { .hero { background-image: url(/art/hero-dark.webp); } }
@media (max-width: 700px) { .hero { background-image: url(/art/hero-mobile.webp); background-position: top; } }
```

```html
<img src="/art/empty.svg" alt="" width="480" height="360" />
```

Match the page: `paper` on warm off-white pages, `mist` on cool grey ones, `ink` on dark ones. Shapes
filled with the background colour (cards, nodes) use the theme's colour even with `"background":"none"`,
so pick the theme closest to the page. Give decorative art `alt=""`.

**Generating at build time.** Apps can import the composer instead of committing files. It has no
Node dependencies, so it also runs in the browser:

```ts
// package.json: "site-cover": "link:site-cover" (run `bun link` in the generator repo first)
import { compose } from "site-cover";
const { svg } = compose({ motif: "orbit", accent: "clay", size: "480x360", background: "none", texture: false });
```

Rasterising (`toPng`, `toWebp` from `site-cover/render`) needs Node or Bun, so do it in a build
script or server code, never in the browser.

Always look at what you rendered, at the size it will be shown, before using it.

## Drawing a subject

The subject is a tiny line drawing placed on the motif's hero shape, like the clock on Timeblock or
the padlock on Nyggis Accounts. It is what makes a cover about *this* project, so add one when an
everyday object stands for the project (a coin, a clock, a lock, a key, a house, a leaf, a note).
Skip it when nothing obvious fits: the motif alone is fine.

- SVG elements only (no `<svg>` wrapper) in a `0 0 100 100` box, centred on 50,50, kept within about 20–80.
- 2–6 simple shapes: `circle`, `rect` with `rx`, `path` with lines and arcs. An icon, not an illustration.
- Don't set `stroke-width`, `style` or `class`: the renderer gives every line the house weight.
- Colours are tokens only: `ink`, `bg`, `accent`, `accent2`, `accent-soft`, `accent2-soft`, `none`.
  Anything else is dropped. Lines default to `ink` with no fill.
- Give the main outline `fill="bg"` so it reads against the coloured disc behind it.
- No text, no letters, no logos of other companies.

```xml
<!-- clock -->
<circle cx="50" cy="50" r="26" fill="bg"/><path d="M50 32v18l12 8"/>
<!-- padlock -->
<rect x="30" y="46" width="40" height="30" rx="5" fill="bg"/><path d="M38 46v-8a12 12 0 0 1 24 0v8"/><circle cx="50" cy="61" r="4" fill="ink"/>
```

## Don'ts

- Don't edit the generated PNG or post-process it; change the spec.
- Don't add new colours, fonts or effects in a project's spec. If the house style needs something new
  (a motif, an accent), add it to the generator repo so every project gets it.
- Don't ship without looking at the PNG.
- Don't use a large filtered SVG as a background; render it to WebP.
