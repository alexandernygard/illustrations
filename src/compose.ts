// Turns a cover spec into a finished SVG: background, haze, motif, subject, type, grain.
// Everything that keeps covers consistent (palette, stroke weight, texture, type, layout)
// is decided here rather than by whoever writes the spec.

import { accents, colors, companions, themes, type AccentName, type ThemeName } from "./palette";
import { motifs, type MotifName } from "./motifs";
import { hash, makeNoise, makeRng } from "./rng";
import { esc, f } from "./geom";

export const sizes = {
  og: [1200, 630],
  square: [1080, 1080],
  wide: [1600, 900],
} as const;

export type Spec = {
  /** Project name, set large in the corner. Omit for an art-only cover. */
  title?: string;
  /** One short line on what the project does. */
  tagline?: string;
  /** Small label top-left, e.g. a domain or "Side project". */
  byline?: string;
  motif?: MotifName;
  theme?: ThemeName;
  accent?: AccentName;
  accent2?: AccentName;
  /** Changes the random details; defaults to the title. */
  seed?: string;
  /** A preset, or any "WIDTHxHEIGHT" such as "1920x800". */
  size?: keyof typeof sizes | `${number}x${number}`;
  /** split: art right, text left. art: art only, no text. */
  layout?: "split" | "art";
  /** Where the art sits in an art layout. Defaults to centre. */
  position?: "left" | "center" | "right" | "top" | "bottom";
  /** Fade the art out on the side away from it, where page content sits. On by default when position is off-centre. */
  fade?: boolean;
  /** "none" leaves the background transparent, to sit on a page's own colour. */
  background?: "theme" | "none";
  /** Colour haze and paper grain. On by default. */
  texture?: boolean;
  /** Prefix for ids inside the SVG. Defaults to one derived from the spec, so inline SVGs don't clash. */
  idPrefix?: string;
  /** Line drawing of the project's subject, as SVG elements in a 0 0 100 100 box. */
  subject?: string;
};

/** Pixel size for a preset name or a "WIDTHxHEIGHT" string. */
export function parseSize(size: string): [number, number] {
  if (size in sizes) return [...sizes[size as keyof typeof sizes]];
  const m = /^(\d{2,5})x(\d{2,5})$/.exec(size);
  if (!m) throw new Error(`Unknown size "${size}". Use one of ${Object.keys(sizes).join(", ")} or WIDTHxHEIGHT, e.g. 1920x800`);
  return [Number(m[1]), Number(m[2])];
}

/** Prefix every id and its url(#...) references, so several SVGs can share a page. */
function prefixIds(svg: string, prefix: string): string {
  const ids = [...svg.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
  for (const id of new Set(ids)) svg = svg.replaceAll(`id="${id}"`, `id="${prefix}-${id}"`).replaceAll(`url(#${id})`, `url(#${prefix}-${id})`);
  return svg;
}

export const FONT_FAMILY = "Libron";

/**
 * Restyle a subject drawing in the house style: strip scripts and links, force
 * colours onto the palette and give every stroke the same weight.
 */
function subjectMarkup(src: string, map: Record<string, string>): string {
  return src
    .replace(/<\/?(script|foreignObject|image|style|use|a)\b[^>]*>/gi, "")
    .replace(/\s(on\w+|href|xlink:href|style|class|stroke-width|transform-origin)="[^"]*"/gi, "")
    .replace(/\s(fill|stroke)="([^"]*)"/gi, (_, attr: string, v: string) => {
      const c = map[v.trim()];
      return c ? ` ${attr}="${c}"` : "";
    });
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > maxChars) {
      out.push(cur);
      cur = w;
    } else cur = cur ? cur + " " + w : w;
  }
  if (cur) out.push(cur);
  if (out.length > maxLines) {
    const kept = out.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1]!.replace(/[\s,.;:]*$/, "") + "…";
    return kept;
  }
  return out;
}

export function resolve(spec: Spec) {
  const seed = spec.seed ?? spec.title ?? "cover";
  const pickRng = makeRng("pick:" + seed);
  const names = Object.keys(motifs) as MotifName[];
  const accentNames = Object.keys(accents) as AccentName[];
  const motif = spec.motif ?? pickRng.pick(names);
  const accent = spec.accent ?? pickRng.pick(accentNames);
  const accent2 = spec.accent2 ?? companions[accent];
  const theme = spec.theme ?? "paper";
  const size = spec.size ?? "og";
  const layout = spec.layout ?? (spec.title ? "split" : "art");
  const position = spec.position ?? "center";
  const background = spec.background ?? "theme";
  const texture = spec.texture ?? true;
  const fade = spec.fade ?? (layout === "art" && position !== "center");
  const idPrefix = spec.idPrefix ?? "sc" + hash(JSON.stringify(spec)).toString(36);
  return { ...spec, seed, motif, accent, accent2, theme, size, layout, position, background, texture, fade, idPrefix };
}

export function compose(input: Spec): { svg: string; width: number; height: number } {
  const spec = resolve(input);
  if (!(spec.motif in motifs)) throw new Error(`Unknown motif "${spec.motif}". Pick one of: ${Object.keys(motifs).join(", ")}`);
  if (!(spec.theme in themes)) throw new Error(`Unknown theme "${spec.theme}". Pick one of: ${Object.keys(themes).join(", ")}`);
  for (const a of [spec.accent, spec.accent2])
    if (!(a in accents)) throw new Error(`Unknown accent "${a}". Pick one of: ${Object.keys(accents).join(", ")}`);
  const [W, H] = parseSize(spec.size);
  const preset = spec.size in sizes;
  const theme = themes[spec.theme];
  const c = colors(theme, accents[spec.accent], accents[spec.accent2]);
  const rng = makeRng(spec.seed);
  const noise = makeNoise(rng);
  const withText = spec.layout === "split" && !!spec.title;
  const landscape = W / H > 1.3;

  let cx = W / 2;
  let cy = H / 2;
  // The width caps keep art inside narrow canvases; none of the presets reach them.
  let r = Math.min(H * 0.33, W * 0.33);
  if (withText && landscape) {
    cx = W * 0.71;
    r = Math.min(H * 0.33, W * 0.19);
  } else if (withText) {
    cy = H * 0.4;
    r = W * 0.24;
  } else {
    const at = { left: [0.3, 0.5], center: [0.5, 0.5], right: [0.7, 0.5], top: [0.5, 0.32], bottom: [0.5, 0.68] }[spec.position];
    if (!at) throw new Error(`Unknown position "${spec.position}". Pick one of: left, center, right, top, bottom`);
    cx = W * at[0]!;
    cy = H * at[1]!;
  }
  // Presets keep their original scale; custom sizes scale lines with the art.
  const unit = preset ? Math.min(W, H * 1.9) / 1200 : r / 208;
  const sw = 1.7 * unit;

  const art = motifs[spec.motif].draw({ rng, noise, cx, cy, r, W, H, c, sw });

  let subject = "";
  if (spec.subject) {
    const { x, y, size } = art.anchor;
    const k = size / 100;
    const map: Record<string, string> = {
      ink: c.ink,
      bg: c.bg,
      accent: c.a1,
      accent2: c.a2,
      "accent-soft": c.a1soft,
      "accent2-soft": c.a2soft,
      none: "none",
    };
    subject =
      `<g transform="translate(${f(x - size / 2)} ${f(y - size / 2)}) scale(${k.toFixed(4)})" ` +
      `fill="none" stroke="${c.ink}" stroke-width="${(sw * 1.5 / k).toFixed(3)}" stroke-linecap="round" stroke-linejoin="round">` +
      subjectMarkup(spec.subject, map) +
      `</g>`;
  }

  // Atmospheric colour fields, the soft glow behind the composition.
  const hazeA = `<ellipse cx="${f(cx + r * 0.35)}" cy="${f(cy - r * 0.25)}" rx="${f(r * 1.7)}" ry="${f(r * 1.25)}" fill="${c.a1}" opacity="${theme.haze}"/>`;
  const hx = withText && landscape ? W * 0.1 : cx - r * 1.6;
  const hazeB = `<ellipse cx="${f(hx)}" cy="${f(H * 0.95)}" rx="${f(r * 1.5)}" ry="${f(r * 0.9)}" fill="${c.a2}" opacity="${f(theme.haze * 0.8)}"/>`;

  // Fade the art out where the text sits so lines never cross the type.
  // In an art layout, fade toward the side away from the art, where page content goes.
  const away: Record<string, [number, number, number, number]> = {
    left: [W * 0.64, 0, W * 0.42, 0],
    right: [W * 0.36, 0, W * 0.58, 0],
    top: [0, H * 0.66, 0, H * 0.46],
    bottom: [0, H * 0.34, 0, H * 0.54],
    center: [0, 0, 0, 0],
  };
  let fade = "";
  if (withText || (spec.layout === "art" && spec.fade && spec.position !== "center")) {
    const [x1, y1, x2, y2] = !withText ? away[spec.position]! : landscape ? [W * 0.3, 0, W * 0.56, 0] : [0, H * 0.76, 0, H * 0.6];
    fade =
      `<linearGradient id="fade-g" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">` +
      `<stop offset="0" stop-color="#000"/><stop offset="0.5" stop-color="#555"/><stop offset="1" stop-color="#fff"/></linearGradient>` +
      `<mask id="fade" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="url(#fade-g)"/></mask>`;
  }

  let text = "";
  if (withText) {
    const pad = landscape ? H * 0.13 : W * 0.08;
    const textW = landscape ? W * 0.38 : W - pad * 2;
    let fs = (landscape ? H * 0.105 : W * 0.075);
    let titleLines = wrap(spec.title!, Math.floor(textW / (fs * 0.5)), 3);
    if (titleLines.length > 2) {
      fs *= 0.8;
      titleLines = wrap(spec.title!, Math.floor(textW / (fs * 0.5)), 2);
    }
    const ts = fs * 0.4;
    const tagLines = spec.tagline ? wrap(spec.tagline, Math.floor(textW / (ts * 0.5)), 3) : [];
    let y = H - pad;
    const tagSvg = tagLines
      .slice()
      .reverse()
      .map((l) => {
        const t = `<text x="${f(pad)}" y="${f(y)}" font-size="${f(ts)}" fill="${c.muted}">${esc(l)}</text>`;
        y -= ts * 1.4;
        return t;
      })
      .join("");
    if (tagLines.length) y -= ts * 0.5;
    const titleSvg = titleLines
      .slice()
      .reverse()
      .map((l) => {
        const t = `<text x="${f(pad)}" y="${f(y)}" font-size="${f(fs)}" fill="${c.ink}" letter-spacing="${f(-fs * 0.015)}">${esc(l)}</text>`;
        y -= fs * 1.08;
        return t;
      })
      .join("");
    const bySvg = spec.byline
      ? `<text x="${f(pad)}" y="${f(pad * 0.8 + ts * 0.8)}" font-size="${f(ts * 0.72)}" fill="${c.muted}" letter-spacing="${f(ts * 0.14)}">${esc(spec.byline.toUpperCase())}</text>` +
        `<rect x="${f(pad)}" y="${f(pad * 0.8 - ts * 0.9)}" width="${f(ts * 0.9)}" height="${f(ts * 0.9)}" rx="${f(ts * 0.45)}" fill="${c.a1}"/>`
      : "";
    text = `<g font-family="${FONT_FAMILY}">${bySvg}${titleSvg}${tagSvg}</g>`;
  }

  const roughSeed = rng.int(1, 999);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<filter id="haze" filterUnits="userSpaceOnUse" x="${-W}" y="${-H}" width="${W * 3}" height="${H * 3}"><feGaussianBlur stdDeviation="${f(H * 0.13)}"/></filter>
<filter id="rough" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="1" seed="${roughSeed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${f(sw * 2)}" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="grain" filterUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><feTurbulence type="fractalNoise" baseFrequency="${f(0.9 / unit)}" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
${fade}
</defs>
${spec.background === "none" ? "" : `<rect width="${W}" height="${H}" fill="${c.bg}"/>`}
${spec.texture ? `<g filter="url(#haze)">${hazeA}${hazeB}</g>` : ""}
<g${fade ? ' mask="url(#fade)"' : ""}><g filter="url(#rough)">${art.back}${art.front}${subject}</g></g>
${text}
${spec.texture && spec.background !== "none" ? `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="${theme.grain}" style="mix-blend-mode:overlay"/>` : ""}
</svg>`;
  return { svg: prefixIds(svg, spec.idPrefix), width: W, height: H };
}
