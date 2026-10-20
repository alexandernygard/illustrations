import { mix } from "../palette";
import { f, pts, type Pt } from "../geom";
import { circle, line, poly, seg, solid, type Art, type Ctx } from "../draw";

export function prism({ rng, cx, cy, r, c, sw, W }: Ctx): Art {
  const s = r * 1.35;
  const h = (s * Math.sqrt(3)) / 2;
  const px = cx - r * 0.35;
  const top: Pt = [px, cy - h * 0.62];
  const left: Pt = [px - s / 2, cy + h * 0.38];
  const right: Pt = [px + s / 2, cy + h * 0.38];
  const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const enter = lerp(left, top, 0.45);
  const exit = lerp(right, top, 0.55);
  let back = seg([cx - r * 1.9, enter[1] + r * 0.32], enter, c.ink, sw * 2.6);
  // The beam fans out into the accents.
  const spectrum = [c.a1, mix(c.a1, c.a2, 0.35), mix(c.a1, c.a2, 0.7), c.a2, c.a2shade];
  const farX = Math.min(W + 20, cx + r * 2);
  const spread = r * rng.range(1.1, 1.4);
  const fanTop = exit[1] - spread * 0.35;
  spectrum.forEach((col, i) => {
    const y0 = fanTop + (i / spectrum.length) * spread;
    const y1 = fanTop + ((i + 1) / spectrum.length) * spread;
    back += `<path d="${poly([lerp(exit, top, i * 0.03), [farX, y0 + (i - 2) * r * 0.08], [farX, y1 + (i - 2) * r * 0.08], lerp(exit, right, (spectrum.length - i) * 0.015)])}" fill="${col}"/>`;
  });
  let front = solid(poly([top, right, left]), c.bg, c, sw);
  front += seg(enter, exit, c.ink, sw * 1.6, ' opacity="0.7"');
  for (let k = 0; k < 6; k++) front += circle(cx + rng.range(-1.4, 1.5) * r, cy + rng.range(-1.2, 1.2) * r, sw * rng.range(1.2, 2.4), k % 2 ? c.a2 : c.ink, ' opacity="0.8"');
  return { back, front, anchor: { x: px, y: cy - h * 0.05, size: s * 0.38 } };
}

export function loom({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const n = 15;
  const span = r * 2.5;
  const dx = span / (n - 1);
  const x0 = cx - span / 2;
  const top = cy - r * 0.95;
  const bot = cy + r * 0.85;
  const rowH = r * 0.11;
  const woven = Math.floor(rng.range(7, 10));
  const band = (j: number) => (j < 2 ? c.a2 : j < 5 ? c.a1 : j < 6 ? c.a2soft : c.a1);
  let back = "";
  for (let i = 0; i < n; i++) back += seg([x0 + i * dx, top], [x0 + i * dx, bot], c.ink, sw, ' opacity="0.75"');
  let front = "";
  // Weft rows from the bottom up; warp shows on top where it passes over.
  for (let j = 0; j < woven; j++) {
    const y = bot - rowH * (j + 0.6);
    front += seg([x0 - dx * 0.3, y], [x0 + span + dx * 0.3, y], band(j), rowH * 0.96, ' stroke-linecap="butt"');
    for (let i = 0; i < n; i++) if ((i + j) % 2) front += seg([x0 + i * dx, y - rowH * 0.5], [x0 + i * dx, y + rowH * 0.5], c.ink, sw * 1.3);
  }
  const lineY = bot - rowH * (woven + 0.6);
  const shuttleX = x0 + span * rng.range(0.55, 0.75);
  front += line(`M${f(x0 - dx * 0.3)},${f(lineY + rowH)} Q${f(x0 + span * 0.2)},${f(lineY - rowH)} ${f(shuttleX)},${f(lineY)}`, c.a1, sw * 1.8);
  const L = r * 0.62;
  const sh = r * 0.11;
  front += solid(`M${f(shuttleX - L / 2)},${f(lineY)} Q${f(shuttleX)},${f(lineY - sh * 1.6)} ${f(shuttleX + L / 2)},${f(lineY)} Q${f(shuttleX)},${f(lineY + sh * 1.6)} ${f(shuttleX - L / 2)},${f(lineY)} Z`, c.a2, c, sw);
  front += `<rect x="${f(shuttleX - L * 0.18)}" y="${f(lineY - sh * 0.3)}" width="${f(L * 0.36)}" height="${f(sh * 0.6)}" rx="${f(sh * 0.3)}" fill="${c.bg}" stroke="${c.ink}" stroke-width="${f(sw)}"/>`;
  const beam = (y: number) => `<rect x="${f(x0 - dx)}" y="${f(y - r * 0.06)}" width="${f(span + dx * 2)}" height="${f(r * 0.12)}" rx="${f(r * 0.06)}" fill="${c.bg}" stroke="${c.ink}" stroke-width="${f(sw * 1.4)}"/>`;
  front += beam(top) + beam(bot + r * 0.02);
  return { back, front, anchor: { x: cx - r * 0.55, y: (top + lineY) / 2, size: r * 0.55 } };
}

export function spiral({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const phi = (1 + Math.sqrt(5)) / 2;
  const h0 = r * 1.6;
  const w0 = h0 * phi;
  const flip = rng.chance(0.5);
  let x = cx - w0 / 2;
  let y = cy - h0 / 2;
  let w = w0;
  let h = h0;
  let squares = "";
  let arcs = "";
  const fills = [c.a1soft, "none", c.a2soft, "none", c.a1soft, "none", "none", "none", "none"];
  for (let i = 0; i < 9; i++) {
    let sq: [number, number, number];
    let from: Pt;
    let to: Pt;
    const side = i % 4;
    if (side === 0) {
      sq = [x, y, h];
      from = [x, y + h];
      to = [x + h, y];
      x += h;
      w -= h;
    } else if (side === 1) {
      sq = [x, y, w];
      from = [x, y];
      to = [x + w, y + w];
      y += w;
      h -= w;
    } else if (side === 2) {
      sq = [x + w - h, y, h];
      from = [x + w, y];
      to = [x + w - h, y + h];
      w -= h;
    } else {
      sq = [x, y + h - w, w];
      from = [x + w, y + h];
      to = [x, y + h - w];
      h -= w;
    }
    const [qx, qy, qs] = sq;
    squares += `<rect x="${f(qx)}" y="${f(qy)}" width="${f(qs)}" height="${f(qs)}" fill="${fills[i]}" stroke="${c.ink}" stroke-width="${f(sw)}" opacity="${f(i < 6 ? 0.9 : 0.6)}"/>`;
    arcs += `${i === 0 ? `M${pts([from])}` : ""} A${f(qs)},${f(qs)} 0 0 1 ${pts([to])}`;
  }
  const eye: Pt = [x + w / 2, y + h / 2];
  const flipT = flip ? ` transform="translate(${f(cx * 2)} 0) scale(-1 1)"` : "";
  const back = `<g${flipT}>${squares}</g>`;
  const ex = flip ? cx * 2 - eye[0] : eye[0];
  let front = `<g${flipT}>${line(arcs, c.ink, sw * 2.2)}</g>`;
  front += circle(ex, eye[1], r * 0.2, c.a1, ` stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"`);
  return { back, front, anchor: { x: ex, y: eye[1], size: r * 0.36 } };
}
