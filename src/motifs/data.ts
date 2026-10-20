import { f, smooth, type Pt } from "../geom";
import { circle, line, ring, seg, solid, type Art, type Ctx } from "../draw";

export function tree({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const rootY = cy + r * 0.9;
  const heroR = r * 0.3;
  let back = seg([cx - r * 1.4, rootY], [cx + r * 1.4, rootY], c.ink, sw, ' opacity="0.5"');
  const tips: Pt[] = [];
  const grow = (x: number, y: number, ang: number, len: number, depth: number) => {
    const x2 = x + Math.cos(ang) * len;
    const y2 = y + Math.sin(ang) * len;
    // A slight bow keeps branches from looking ruled.
    const bend = rng.range(-0.12, 0.12) * len;
    const mx = (x + x2) / 2 + Math.cos(ang + Math.PI / 2) * bend;
    const my = (y + y2) / 2 + Math.sin(ang + Math.PI / 2) * bend;
    back += line(`M${f(x)},${f(y)} Q${f(mx)},${f(my)} ${f(x2)},${f(y2)}`, c.ink, sw * (0.9 + depth * 0.35));
    if (depth === 0) {
      tips.push([x2, y2]);
      return;
    }
    const n = depth > 1 && rng.chance(0.25) ? 3 : 2;
    const spread = rng.range(0.45, 0.68);
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1) - 0.5;
      grow(x2, y2, ang + t * spread * 2 + rng.range(-0.1, 0.1), len * rng.range(0.74, 0.84), depth - 1);
    }
  };
  grow(cx, rootY - heroR, -Math.PI / 2, r * 0.36, 5);
  let front = circle(cx, rootY, heroR, c.a1);
  tips.forEach(([x, y], i) => {
    const fill = i % 7 === 3 ? c.a2 : i % 9 === 5 ? c.a1 : c.bg;
    front += circle(x, y, r * (i % 5 === 0 ? 0.06 : 0.04), fill, ` stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"`);
  });
  return { back, front, anchor: { x: cx, y: rootY, size: heroR * 1.9 } };
}

export function matrix({ rng, noise, cx, cy, r, c, sw }: Ctx): Art {
  const cols = 13;
  const rows = 9;
  const s = r * 0.24;
  const x0 = cx - ((cols - 1) * s) / 2;
  const y0 = cy - ((rows - 1) * s) / 2;
  const fx = x0 + s * rng.int(6, 9);
  const fy = y0 + s * rng.int(3, 5);
  let back = "";
  let front = circle(fx, fy, s * 1.6, c.a1soft);
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++) {
      const x = x0 + i * s;
      const y = y0 + j * s;
      const d = Math.hypot(x - fx, y - fy) / (s * 3.2);
      const field = Math.max(0, Math.min(1, Math.exp(-d * d) + 0.18 * noise(i * 0.4, j * 0.4)));
      const rr = s * (0.06 + 0.36 * field);
      const hot = field > 0.7;
      const fill = hot ? c.a1 : (i * 7 + j * 3) % 23 === 0 ? c.a2 : c.ink;
      if (hot) front += circle(x, y, rr, fill);
      else back += circle(x, y, rr, fill, ` opacity="${f(0.45 + field * 0.55)}"`);
    }
  return { back, front, anchor: { x: fx, y: fy, size: s * 2.4 } };
}

export function sieve({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const topY = cy - r * 0.62;
  const neckY = cy + r * 0.32;
  const spoutY = cy + r * 0.6;
  const w = r * 0.78;
  const nw = r * 0.08;
  let back = "";
  // Many things come in from above, some on dashed paths toward the mouth.
  for (let i = 0; i < 34; i++) {
    const x = cx + rng.range(-1.55, 1.55) * r;
    const y = cy - r * rng.range(0.85, 1.4);
    const fill = i % 6 === 0 ? c.a2 : i % 11 === 0 ? c.a1 : c.ink;
    back += circle(x, y, sw * rng.range(1.6, 3.6), fill, ` opacity="${f(rng.range(0.5, 1))}"`);
    if (i % 5 === 0) back += line(`M${f(x)},${f(y)} Q${f(x)},${f(topY - r * 0.1)} ${f(cx + (x - cx) * 0.35)},${f(topY)}`, c.ink, sw, ' stroke-dasharray="2 6" opacity="0.6"');
  }
  const body =
    `M${f(cx - w)},${f(topY)} C${f(cx - w)},${f(topY + r * 0.45)} ${f(cx - nw)},${f(neckY - r * 0.35)} ${f(cx - nw)},${f(neckY)} ` +
    `L${f(cx - nw)},${f(spoutY)} L${f(cx + nw)},${f(spoutY)} L${f(cx + nw)},${f(neckY)} ` +
    `C${f(cx + nw)},${f(neckY - r * 0.35)} ${f(cx + w)},${f(topY + r * 0.45)} ${f(cx + w)},${f(topY)} Z`;
  let front = solid(body, c.bg, c, sw);
  front += `<ellipse cx="${f(cx)}" cy="${f(topY)}" rx="${f(w)}" ry="${f(r * 0.13)}" fill="${c.a2soft}" stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"/>`;
  for (let k = 1; k <= 3; k++) {
    const y = topY + k * r * 0.2;
    const hw = w * (1 - k * 0.27);
    front += line(`M${f(cx - hw)},${f(y)} Q${f(cx)},${f(y + r * 0.06)} ${f(cx + hw)},${f(y)}`, c.ink, sw, ' opacity="0.45"');
  }
  const heroR = r * 0.28;
  const hy = spoutY + r * 0.42;
  front += circle(cx, hy, heroR, c.a1);
  front += circle(cx + r * 0.42, hy + r * 0.12, r * 0.07, c.a2, ` stroke="${c.ink}" stroke-width="${f(sw)}"`);
  return { back, front, anchor: { x: cx, y: hy, size: heroR * 1.9 } };
}

export function knot({ cx, cy, r, c, sw }: Ctx): Art {
  const R = r * 0.68;
  const d = r * 0.44;
  const band = r * 0.15;
  const ax = cx - d + r * 0.12;
  const bx = cx + d + r * 0.12;
  const loop = (x: number, color: string) =>
    circle(x, cy, R, "none", ` stroke="${c.ink}" stroke-width="${f(band + sw * 2.4)}"`) +
    circle(x, cy, R, "none", ` stroke="${color}" stroke-width="${f(band)}"`);
  let back = "";
  for (const [x, k] of [[ax, 1.32], [bx, 1.32], [ax, 1.55], [bx, 1.55]] as const)
    back += ring(x, cy, R * k, c, sw, ` opacity="${k > 1.4 ? 0.3 : 0.55}"`);
  // A over B at the top crossing, B over A at the bottom: the loops interlock.
  const crossY = cy - Math.sqrt(R * R - d * d);
  let front = `<clipPath id="knot-cross"><circle cx="${f(cx + r * 0.12)}" cy="${f(crossY)}" r="${f(band * 1.6)}"/></clipPath>`;
  front += loop(ax, c.a1) + loop(bx, c.a2) + `<g clip-path="url(#knot-cross)">${loop(ax, c.a1)}</g>`;
  return { back, front, anchor: { x: ax - R * 0.12, y: cy, size: R * 0.75 } };
}

export function bars({ rng, noise, cx, cy, r, c, sw }: Ctx): Art {
  const n = 9;
  const bw = r * 0.17;
  const gap = r * 0.13;
  const span = n * bw + (n - 1) * gap;
  const x0 = cx - span / 2;
  const base = cy + r * 0.78;
  const off = rng.range(0, 50);
  const hi = rng.int(5, 7);
  let back = circle(cx + r * 0.55, cy - r * 0.45, r * 0.72, c.a1soft);
  for (let k = 1; k <= 3; k++) back += seg([x0 - r * 0.2, base - k * r * 0.48], [x0 + span + r * 0.2, base - k * r * 0.48], c.ink, sw, ' stroke-dasharray="2 7" opacity="0.5"');
  back += seg([x0 - r * 0.3, base], [x0 + span + r * 0.3, base], c.ink, sw * 1.3);
  let front = "";
  const tops: Pt[] = [];
  let hiTop: Pt = [cx, cy];
  for (let i = 0; i < n; i++) {
    const h = r * (0.3 + (1.15 * i) / (n - 1) + 0.28 * noise(i * 0.7 + off, 0.3));
    const x = x0 + i * (bw + gap);
    const fill = i === hi ? c.a1 : i === 2 ? c.a2 : c.bg;
    front += `<rect x="${f(x)}" y="${f(base - h)}" width="${f(bw)}" height="${f(h)}" rx="${f(bw * 0.18)}" fill="${fill}" stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"/>`;
    tops.push([x + bw / 2, base - h - r * 0.14]);
    if (i === hi) hiTop = [x + bw / 2, base - h];
  }
  front += line(smooth(tops), c.a2shade, sw * 2);
  tops.forEach(([x, y], i) => (front += circle(x, y, sw * (i === hi ? 4.5 : 2.6), i === hi ? c.a2 : c.ink, i === hi ? ` stroke="${c.ink}" stroke-width="${f(sw)}"` : "")));
  return { back, front, anchor: { x: hiTop[0], y: hiTop[1] - r * 0.55, size: r * 0.5 } };
}
