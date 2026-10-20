// Example specs, rendered by `site-cover gallery`. They double as reference specs for agents.

import type { Spec } from "./compose";

const byline = "alexandernygard.com";

export const samples: Record<string, Spec> = {
  budget: {
    title: "Budget",
    tagline: "Monthly spending, sorted and forecast without the spreadsheet.",
    byline,
    motif: "wave",
    accent: "sage",
    subject: `<circle cx="50" cy="50" r="30" fill="bg"/><circle cx="50" cy="50" r="22"/><path d="M50 36v28M42 44c0-4 4-6 8-6s8 2 8 6-4 5-8 6-8 2-8 6 4 6 8 6 8-2 8-6"/>`,
  },
  timeblock: {
    title: "Timeblock",
    tagline: "Plan the day in blocks, then let it run itself.",
    byline,
    motif: "orbit",
    accent: "clay",
    subject: `<circle cx="50" cy="50" r="26" fill="bg"/><path d="M50 32v18l12 8"/>`,
  },
  rooms: {
    title: "Room Layout Architect",
    tagline: "Sketch a floor plan and try furniture before you lift a thing.",
    byline,
    motif: "grid",
    accent: "ochre",
  },
  auth: {
    title: "Nyggis Accounts",
    tagline: "One sign-in for every small app.",
    byline,
    motif: "constellation",
    accent: "heather",
    subject: `<rect x="30" y="46" width="40" height="30" rx="5" fill="bg"/><path d="M38 46v-8a12 12 0 0 1 24 0v8"/><circle cx="50" cy="61" r="4" fill="ink"/>`,
  },
  components: {
    title: "Components",
    tagline: "One theme, shared across React and Svelte.",
    byline,
    motif: "stack",
    accent: "sky",
  },
  finn: {
    title: "Finn Finder",
    tagline: "Watches listings and tells you when the right one shows up.",
    byline,
    motif: "contour",
    accent: "teal",
    theme: "ink",
  },
  beatport: {
    title: "Crate Sync",
    tagline: "Your Beatport library, kept in step with your decks.",
    byline,
    motif: "flow",
    accent: "rose",
    theme: "ink",
  },
  jit: {
    title: "JIT UI",
    tagline: "Interfaces generated on demand by the model.",
    byline,
    motif: "bloom",
    accent: "ochre",
    theme: "mist",
  },
  watcher: {
    title: "GH Watcher",
    tagline: "Every PR, review and CI run in one quiet dashboard.",
    byline,
    motif: "panes",
    accent: "clay",
    theme: "mist",
  },
  "art-only": { seed: "portfolio", motif: "flow", accent: "clay" },
  square: { title: "Timeblock", tagline: "Plan the day in blocks.", motif: "orbit", accent: "clay", size: "square", byline },
};
