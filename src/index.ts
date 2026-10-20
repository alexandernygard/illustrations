// Public entry for apps: build SVGs at build time or in the browser. This file has no Node
// dependencies; rasterising lives in "site-cover/render".
export { compose, resolve, parseSize, sizes, type Spec } from "./compose";
export { motifs, groups, type MotifName } from "./motifs";
export { themes, accents, companions, type ThemeName, type AccentName } from "./palette";
