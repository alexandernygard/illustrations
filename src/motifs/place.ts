import { mix } from "../palette";
import { f, pts, smooth, type Pt } from "../geom";
import { circle, line, poly, ring, seg, solid, type Art, type Ctx } from "../draw";

export function horizon({ rng, cx, cy, r, c, sw, W }: Ctx): Art {
  const hy = cy + r * 0.3;
  const sunR = r * 0.6;
  const sy = hy - sunR * 0.45;
  const phase = rng.range(0, 6);
  let back = "";
  // Ground lines recede: closer together and flatter toward the horizon.
  for (let k = 1; k <= 7; k++) {
    const y = hy + r * 0.045 * k ** 1.55;
    const amp = r * 0.012 * k;
    const p: Pt[] = [];
    for (let x = cx - r * 1.9; x <= W + 10; x += 14) p.push([x, y + Math.sin(x * 0.012 + phase + k) * amp]);
    back += line(smooth(p), c.ink, sw, ` opacity="${f(0.75 - k * 0.06)}"`);
  }
  back += circle(cx + r * 1.15, cy - r * 0.95, r * 0.08, c.a2, ` stroke="${c.ink}" stroke-width="${f(sw)}"`);
  let front = `<clipPath id="horizon-sky"><rect x="0" y="0" width="${W}" height="${f(hy)}"/></clipPath>`;
  front += `<g clip-path="url(#horizon-sky)">${circle(cx, sy, sunR, c.a1)}${ring(cx, sy, sunR * 1.25, c, sw, ' stroke-dasharray="2 7"')}${ring(cx, sy, sunR * 1.55, c, sw, ' stroke-dasharray="2 9" opacity="0.6"')}</g>`;
  front += seg([cx - r * 1.9, hy], [W + 10, hy], c.ink, sw * 1.4);
  // The sun's reflection, broken up on the water.
  for (let k = 0; k < 5; k++) {
    const y = hy + r * (0.09 + k * 0.1);
    const half = sunR * (0.8 - k * 0.14) * rng.range(0.85, 1.1);
    const off = rng.range(-0.08, 0.08) * r;
    front += seg([cx - half + off, y], [cx + half + off, y], c.a1, sw * 3.2);
  }
  return { back, front, anchor: { x: cx, y: sy - sunR * 0.1, size: sunR * 1.1 } };
}

export function window({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const w = r * 0.95;
  const floor = cy + r * 0.85;
  const top = cy - r * 0.95;
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const arch = (a: number, b: number, t: number) => `M${f(a)},${f(floor)} L${f(a)},${f(t + (b - a) / 2)} A${f((b - a) / 2)},${f((b - a) / 2)} 0 0 1 ${f(b)},${f(t + (b - a) / 2)} L${f(b)},${f(floor)} Z`;
  let back = seg([cx - r * 1.7, floor], [cx + r * 1.7, floor], c.ink, sw * 1.3);
  back += line(arch(x0 - r * 0.55, x1 - r * 0.55, top - r * 0.15), c.ink, sw, ' opacity="0.35"');
  // Light falling through the doorway onto the floor.
  const fall = rng.range(0.9, 1.2) * r;
  back += `<path d="${poly([[x0, floor], [x1, floor], [x1 + fall * 1.4, floor + r * 0.22], [x0 + fall * 1.1, floor + r * 0.22]])}" fill="${c.a1}" opacity="0.45"/>`;
  const view = arch(x0, x1, top);
  const hill = (y: number, amp: number, color: string, ph: number) => {
    const p: Pt[] = [];
    for (let x = x0 - 10; x <= x1 + 10; x += 10) p.push([x, y + Math.sin(x * 0.02 + ph) * amp]);
    return `<path d="${smooth(p)} L${f(x1 + 10)},${f(floor)} L${f(x0 - 10)},${f(floor)} Z" fill="${color}"/>`;
  };
  let front = `<clipPath id="window-view"><path d="${view}"/></clipPath>`;
  front +=
    `<g clip-path="url(#window-view)"><rect x="${f(x0)}" y="${f(top)}" width="${f(w)}" height="${f(floor - top)}" fill="${c.a2soft}"/>` +
    circle(cx + w * 0.12, cy - r * 0.05, w * 0.22, c.a1) +
    hill(cy + r * 0.15, r * 0.06, c.a2, rng.range(0, 6)) +
    hill(cy + r * 0.42, r * 0.05, c.a2shade, rng.range(0, 6)) +
    `</g>`;
  front += `<path d="${view}" fill="none" stroke="${c.ink}" stroke-width="${f(sw * 3)}" stroke-linejoin="round"/>`;
  front += line(arch(x0 - r * 0.1, x1 + r * 0.1, top - r * 0.1), c.ink, sw);
  return { back, front, anchor: { x: x1 + r * 0.55, y: floor - r * 0.28, size: r * 0.55 } };
}

export function pin({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const panels = 4;
  const mw = r * 2.5;
  const mh = r * 1.2;
  const mx = cx - mw / 2;
  const my = cy - mh / 2 + r * 0.35;
  const skew = r * 0.1;
  const pw = mw / panels;
  let back = "";
  const fold = mix(c.bg, c.ink, 0.07);
  for (let i = 0; i < panels; i++) {
    const a = i % 2 === 0 ? 0 : skew;
    const b = i % 2 === 0 ? skew : 0;
    const x = mx + i * pw;
    back += solid(poly([[x, my + a], [x + pw, my + b], [x + pw, my + mh + b], [x, my + mh + a]]), i % 2 ? fold : c.bg, c, sw);
  }
  // Terrain on the map, kept faint.
  for (let k = 0; k < 3; k++) {
    const p: Pt[] = [];
    for (let x = mx + r * 0.1; x <= mx + mw - r * 0.1; x += r * 0.2) p.push([x, my + mh * (0.25 + k * 0.25) + Math.sin(x * 0.015 + k * 2) * r * 0.08]);
    back += line(smooth(p), c.ink, sw, ' opacity="0.3"');
  }
  const tx = cx + r * rng.range(0.15, 0.45);
  const ty = my + mh * rng.range(0.55, 0.7);
  const start: Pt = [mx + r * 0.25, my + mh * 0.85];
  back += line(`M${pts([start])} C${f(start[0] + r * 0.6)},${f(start[1] - r * 0.7)} ${f(tx - r * 0.7)},${f(ty + r * 0.4)} ${f(tx)},${f(ty)}`, c.ink, sw * 1.5, ` stroke-dasharray="${f(sw * 3)} ${f(sw * 4)}"`);
  back += circle(start[0], start[1], sw * 4, c.a2, ` stroke="${c.ink}" stroke-width="${f(sw)}"`);
  const R = r * 0.34;
  const hx = tx;
  const hy = ty - R * 2.4;
  const d = ty - hy;
  const beta = Math.acos(R / d);
  const L: Pt = [hx - R * Math.sin(beta), hy + R * Math.cos(beta)];
  const Rt: Pt = [hx + R * Math.sin(beta), hy + R * Math.cos(beta)];
  let front = `<ellipse cx="${f(tx)}" cy="${f(ty)}" rx="${f(R * 0.5)}" ry="${f(R * 0.16)}" fill="${c.ink}" opacity="0.25"/>`;
  front += solid(`M${f(tx)},${f(ty)} L${pts([L])} A${f(R)},${f(R)} 0 1 1 ${pts([Rt])} Z`, c.a1, c, sw);
  front += circle(hx, hy, R * 0.4, c.bg, ` stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"`);
  return { back, front, anchor: { x: hx, y: hy, size: R * 1.25 } };
}

export function rooms({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const w = r * 2.4;
  const h = r * 1.55;
  const x0 = cx - w / 2 + r * 0.15;
  const y0 = cy - h / 2 + r * 0.08;
  const x1 = x0 + w;
  const y1 = y0 + h;
  const xs = x0 + w * rng.range(0.4, 0.48);
  const ys = y0 + h * rng.range(0.48, 0.58);
  const xr = xs + (x1 - xs) * rng.range(0.5, 0.6);
  const yr = y0 + h * 0.46;
  const door = r * 0.2;
  let back = `<rect x="${f(x0)}" y="${f(y0)}" width="${f(xs - x0)}" height="${f(ys - y0)}" fill="${c.a1}"/>`;
  back += `<rect x="${f(xs)}" y="${f(yr)}" width="${f(x1 - xs)}" height="${f(y1 - yr)}" fill="${c.a2soft}"/>`;
  back += `<rect x="${f(xr)}" y="${f(y0)}" width="${f(x1 - xr)}" height="${f(yr - y0)}" fill="${mix(c.bg, c.ink, 0.06)}"/>`;
  // Dimension line along the top.
  const dy = y0 - r * 0.2;
  back += seg([x0, dy], [x1, dy], c.ink, sw, ' opacity="0.6"');
  for (const x of [x0, xs, x1]) back += seg([x, dy - r * 0.05], [x, dy + r * 0.05], c.ink, sw, ' opacity="0.6"');
  const wall = sw * 3.6;
  let front = "";
  const W = (a: Pt, b: Pt) => (front += seg(a, b, c.ink, wall));
  // Walls, with gaps where the doors are.
  W([x0, y0], [x1, y0]);
  W([x1, y0], [x1, y1]);
  W([x1, y1], [x0 + door * 1.6, y1]);
  W([x0 + r * 0.1, y1], [x0, y1]);
  W([x0, y1], [x0, y0]);
  W([xs, y0], [xs, ys - door * 1.2]);
  W([xs, ys - door * 0.2], [xs, y1]);
  W([x0, ys], [x0 + (xs - x0) * 0.35, ys]);
  W([x0 + (xs - x0) * 0.35 + door, ys], [xs, ys]);
  W([xs, yr], [xr, yr]);
  W([xr + door, yr], [x1, yr]);
  W([xr, y0], [xr, yr]);
  // Door swings.
  const swing = (hx: number, hy: number, ex: number, ey: number, ax: number, ay: number) =>
    (front += seg([hx, hy], [ex, ey], c.ink, sw * 1.2) + line(`M${f(ex)},${f(ey)} A${f(door)},${f(door)} 0 0 1 ${f(ax)},${f(ay)}`, c.ink, sw, ' stroke-dasharray="2 4"'));
  swing(xs, ys - door * 1.2, xs - door, ys - door * 1.2, xs, ys - door * 0.2);
  swing(xr + door, yr, xr + door, yr + door, xr, yr);
  // Furniture: a table with chairs and a sofa.
  const tx = xs + (x1 - xs) * 0.5;
  const ty = yr + (y1 - yr) * 0.55;
  front += circle(tx, ty, r * 0.17, c.bg, ` stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"`);
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + Math.PI / 4;
    front += circle(tx + Math.cos(a) * r * 0.27, ty + Math.sin(a) * r * 0.27, r * 0.055, c.bg, ` stroke="${c.ink}" stroke-width="${f(sw)}"`);
  }
  front += `<rect x="${f(x0 + r * 0.15)}" y="${f(y1 - r * 0.32)}" width="${f((xs - x0) * 0.6)}" height="${f(r * 0.18)}" rx="${f(r * 0.05)}" fill="${c.a2}" stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"/>`;
  return { back, front, anchor: { x: (x0 + xs) / 2, y: (y0 + ys) / 2, size: Math.min(xs - x0, ys - y0) * 0.75 } };
}
