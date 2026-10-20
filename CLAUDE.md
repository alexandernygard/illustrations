The drawing code for Alex's illustrations: `compose(spec)` → SVG string, with motifs, palette and layout.
Published as `@alexandernygard/illustrations`. The CLI that rasterises it lives in ~/MyStuff/Projects/site-cover.

- No runtime dependencies and nothing Node-specific in `src/`: it must run in the browser.
- Typecheck with `bun run check`; `bun run build` writes `dist/`. Bun loads `src/` directly through the `bun` export condition.
- After changing a motif, palette or layout, run `bun run gallery` in ~/MyStuff/Projects/site-cover and look at the PNGs. Visual review is the test.
- Keep motifs deterministic: all randomness goes through the `rng`/`noise` passed in `Ctx`.
- Colours only come from `src/palette.ts`; don't hardcode new hex values in motifs.
- Motif ids used in `<clipPath>` must be unique across motifs; prefix them with the motif name.
- Covers already in use must not change by accident: compare gallery PNGs before and after a change.
- `examples/*.png` are made by `bun run sheet` in site-cover and copied here.
