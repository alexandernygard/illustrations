Bun + TypeScript CLI that renders cover images. See README.md for the design and skill/SKILL.md for the spec.

- Run with `bun src/cli.ts ...` (or `site-cover` once linked). Typecheck with `bun run check`.
- After changing a motif, palette or layout, run `bun run gallery` and look at the PNGs in `gallery/`. Visual review is the test.
- Keep motifs deterministic: all randomness goes through the `rng`/`noise` passed in `Ctx`.
- Colours only come from `src/palette.ts`; don't hardcode new hex values in motifs.
- Regenerate `examples/sheet.png` and `examples/motifs.png` with `bun scripts/sheet.ts` when the look changes.
- Motif ids used in `<clipPath>` must be unique across motifs; prefix them with the motif name.
