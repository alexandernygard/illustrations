// Shared types and drawing helpers for motifs.

import type { Colors } from "./palette";
import type { Rng } from "./rng";
import { f, pts, type Pt } from "./geom";

export type Ctx = {
  rng: Rng;
  noise: (x: number, y: number) => number;
  /** Centre and radius of the composition. */
  cx: number;
  cy: number;
  r: number;
  W: number;
  H: number;
  c: Colors;
  /** Base stroke width. */
  sw: number;
};

export type Art = {
  /** Drawn first: lines and fields behind the hero shape. */
  back: string;
  /** Drawn on top of back: the hero shape and foreground detail. */
  front: string;
  /** Where a subject drawing sits, and the side of its square box. */
  anchor: { x: number; y: number; size: number };
};

export const line = (d: string, stroke: string, sw: number, extra = "") =>
  `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${f(sw)}"${extra.includes("stroke-linecap") ? "" : ' stroke-linecap="round"'} stroke-linejoin="round"${extra}/>`;

export const circle = (x: number, y: number, r: number, fill: string, extra = "") =>
  `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"${extra}/>`;

/** A straight segment between two points. */
export const seg = (a: Pt, b: Pt, stroke: string, sw: number, extra = "") => line(`M${pts([a, b])}`, stroke, sw, extra);

/** Filled shape outlined in ink, the house treatment for solids. */
export const solid = (d: string, fill: string, c: Colors, sw: number, extra = "") =>
  `<path d="${d}" fill="${fill}" stroke="${c.ink}" stroke-width="${f(sw * 1.2)}" stroke-linejoin="round"${extra}/>`;

export const poly = (p: Pt[]) => `M${pts(p)}Z`;

export const ring = (x: number, y: number, r: number, c: Colors, sw: number, extra = "") =>
  circle(x, y, r, "none", ` stroke="${c.ink}" stroke-width="${f(sw)}"${extra}`);
