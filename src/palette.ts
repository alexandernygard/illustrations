// The house palette. Every cover uses one theme and two accents from here, which is
// most of what makes covers from different projects look like one family.

export type Theme = {
  bg: string;
  ink: string;
  muted: string;
  /** Opacity of the atmospheric colour fields. */
  haze: number;
  /** Opacity of the paper grain. */
  grain: number;
};

export const themes = {
  paper: { bg: "#F0EEE6", ink: "#1F1E1C", muted: "#7D786D", haze: 0.16, grain: 0.1 },
  ink: { bg: "#1C1D1F", ink: "#ECE8E0", muted: "#8F8A80", haze: 0.2, grain: 0.12 },
  mist: { bg: "#EEF1F2", ink: "#18212B", muted: "#6E7A86", haze: 0.15, grain: 0.09 },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;

export const accents = {
  clay: "#D97757",
  ochre: "#DDA448",
  sage: "#8BA77F",
  sky: "#6E9DCB",
  heather: "#9D8FC6",
  rose: "#D48A9B",
  teal: "#4F9A92",
} as const;

export type AccentName = keyof typeof accents;

/** The companion accent each primary looks best with. */
export const companions: Record<AccentName, AccentName> = {
  clay: "sky",
  ochre: "heather",
  sage: "clay",
  sky: "ochre",
  heather: "ochre",
  rose: "sage",
  teal: "clay",
};

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Linear mix of two hex colours, t = 0 gives a, t = 1 gives b. */
export function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const c = (x: number, y: number) =>
    Math.round(x + (y - x) * t)
      .toString(16)
      .padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

export type Colors = {
  bg: string;
  ink: string;
  muted: string;
  a1: string;
  a2: string;
  /** Accents washed toward the background, for large quiet fills. */
  a1soft: string;
  a2soft: string;
  /** Accent shaded toward ink, for the dark faces of solids. */
  a1shade: string;
  a2shade: string;
};

export function colors(theme: Theme, a1: string, a2: string): Colors {
  return {
    bg: theme.bg,
    ink: theme.ink,
    muted: theme.muted,
    a1,
    a2,
    a1soft: mix(a1, theme.bg, 0.55),
    a2soft: mix(a2, theme.bg, 0.55),
    a1shade: mix(a1, "#1F1E1C", 0.28),
    a2shade: mix(a2, "#1F1E1C", 0.28),
  };
}
