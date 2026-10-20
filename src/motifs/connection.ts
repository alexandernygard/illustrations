import { f, pts, type Pt } from "../geom";
import { circle, line, ring, seg, solid, type Art, type Ctx } from "../draw";

/** Rounded rectangle with a tail off the bottom edge, as one path so the outline is unbroken. */
function bubble(x: number, y: number, w: number, h: number, tail: "left" | "right"): string {
  const rr = Math.min(w, h) * 0.3;
  const [a, tip, b] = tail === "left" ? [0.36, 0.12, 0.2] : [0.8, 0.88, 0.64];
  return (
    `M${f(x + rr)},${f(y)} H${f(x + w - rr)} A${f(rr)},${f(rr)} 0 0 1 ${f(x + w)},${f(y + rr)} ` +
    `V${f(y + h - rr)} A${f(rr)},${f(rr)} 0 0 1 ${f(x + w - rr)},${f(y + h)} ` +
    `H${f(x + w * a)} L${f(x + w * tip)},${f(y + h * 1.32)} L${f(x + w * b)},${f(y + h)} ` +
    `H${f(x + rr)} A${f(rr)},${f(rr)} 0 0 1 ${f(x)},${f(y + h - rr)} V${f(y + rr)} A${f(rr)},${f(rr)} 0 0 1 ${f(x + rr)},${f(y)} Z`
  );
}

export function bubbles({ rng, cx, cy, r, c, sw }: Ctx): Art {
  let back = "";
  for (let i = 0; i < 9; i++) {
    const a = rng.range(0, Math.PI * 2);
    const d = r * rng.range(1.25, 1.65);
    back += ring(cx + Math.cos(a) * d * 1.1, cy + Math.sin(a) * d * 0.8, r * rng.range(0.03, 0.07), c, sw, ' opacity="0.6"');
  }
  const bw = r * 1.3;
  const bh = r * 0.82;
  const bx = cx - r * 0.95;
  const by = cy - r * 0.75;
  let front = solid(bubble(bx, by, bw, bh, "left"), c.a1, c, sw);
  const sx = cx - r * 0.05;
  const sy = cy + r * 0.12;
  const sw2 = r * 1.15;
  const sh = r * 0.58;
  front += solid(bubble(sx, sy, sw2, sh, "right"), c.bg, c, sw);
  front += seg([sx + sw2 * 0.12, sy + sh * 0.36], [sx + sw2 * 0.72, sy + sh * 0.36], c.ink, sw * 2.2);
  front += seg([sx + sw2 * 0.12, sy + sh * 0.64], [sx + sw2 * 0.5, sy + sh * 0.64], c.muted, sw * 2);
  const tx = cx + r * 0.62;
  const ty = cy - r * 0.95;
  const tw = r * 0.62;
  const th = r * 0.34;
  front += solid(bubble(tx, ty, tw, th, "left"), c.a2, c, sw);
  for (let k = 0; k < 3; k++) front += circle(tx + tw * (0.3 + k * 0.2), ty + th / 2, th * 0.1, c.ink);
  return { back, front, anchor: { x: bx + bw / 2, y: by + bh / 2, size: bh * 0.85 } };
}

export function ripple({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const e = 0.42;
  const ax = cx - r * 0.3;
  const ay = cy + r * 0.38;
  const bx = cx + r * rng.range(0.7, 0.9);
  const by = cy + r * 0.05;
  let back = "";
  for (let k = 1; k <= 8; k++) {
    const R = r * 0.2 * k;
    back += `<ellipse cx="${f(ax)}" cy="${f(ay)}" rx="${f(R)}" ry="${f(R * e)}" fill="none" stroke="${c.ink}" stroke-width="${f(sw)}" opacity="${f(1 - k * 0.09)}"/>`;
  }
  for (let k = 1; k <= 5; k++) {
    const R = r * 0.16 * k;
    back += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(R)}" ry="${f(R * e)}" fill="none" stroke="${c.a2shade}" stroke-width="${f(sw)}" stroke-dasharray="3 5" opacity="${f(0.95 - k * 0.12)}"/>`;
  }
  let front = `<ellipse cx="${f(ax)}" cy="${f(ay)}" rx="${f(r * 0.34)}" ry="${f(r * 0.34 * e)}" fill="${c.a1}"/>`;
  front += `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(r * 0.12)}" ry="${f(r * 0.12 * e)}" fill="${c.a2}"/>`;
  // The drop that started it, about to land.
  const R = r * 0.22;
  const dx = ax;
  const dy = ay - r * 0.95;
  front += solid(`M${f(dx)},${f(dy - R * 2.1)} C${f(dx + R * 0.4)},${f(dy - R * 1.2)} ${f(dx + R)},${f(dy - R * 0.4)} ${f(dx + R)},${f(dy + R * 0.1)} A${f(R)},${f(R)} 0 0 1 ${f(dx - R)},${f(dy + R * 0.1)} C${f(dx - R)},${f(dy - R * 0.4)} ${f(dx - R * 0.4)},${f(dy - R * 1.2)} ${f(dx)},${f(dy - R * 2.1)} Z`, c.a1, c, sw);
  for (const [ox, oy] of [[-0.55, -0.2], [0.5, -0.32], [0.62, -0.05]] as const) front += circle(ax + ox * r, ay + oy * r, sw * 2.6, c.ink);
  return { back, front, anchor: { x: dx, y: dy - R * 0.2, size: R * 1.5 } };
}

export function signal({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const sx = cx - r * 0.55;
  const sy = cy + r * 0.45;
  const heroR = r * 0.3;
  const from = -88;
  const to = 8;
  const arc = (R: number) => {
    const a = (from * Math.PI) / 180;
    const b = (to * Math.PI) / 180;
    return `M${f(sx + Math.cos(a) * R)},${f(sy + Math.sin(a) * R)} A${f(R)},${f(R)} 0 0 1 ${f(sx + Math.cos(b) * R)},${f(sy + Math.sin(b) * R)}`;
  };
  let back = "";
  for (let k = 0; k < 6; k++) {
    const R = r * (0.5 + k * 0.26);
    back += line(arc(R), k === 1 ? c.a2 : c.ink, k === 1 ? sw * 2.4 : sw, ` opacity="${f(1 - k * 0.12)}"${k % 2 ? ' stroke-dasharray="2 6"' : ""}`);
  }
  // A mast under the source.
  back += line(`M${f(sx - r * 0.3)},${f(sy + r * 0.75)} L${f(sx)},${f(sy)} L${f(sx + r * 0.3)},${f(sy + r * 0.75)}`, c.ink, sw * 1.4);
  back += seg([sx - r * 0.15, sy + r * 0.38], [sx + r * 0.15, sy + r * 0.38], c.ink, sw * 1.2);
  let front = circle(sx, sy, heroR, c.a1);
  const recv: Pt[] = [];
  for (const [k, a] of [[4.2, rng.range(-70, -55)], [5.2, rng.range(-30, -15)], [3.1, rng.range(-20, -5)]] as const) {
    const R = r * (0.5 + k * 0.26);
    const t = (a * Math.PI) / 180;
    recv.push([sx + Math.cos(t) * R, sy + Math.sin(t) * R]);
  }
  recv.forEach(([x, y], i) => {
    front += circle(x, y, r * (i === 0 ? 0.09 : 0.06), i === 0 ? c.a2 : c.bg, ` stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"`);
  });
  return { back, front, anchor: { x: sx, y: sy, size: heroR * 2 } };
}

/** A puzzle piece: square with a knob on the right edge, or a socket on the left. */
function piece(x: number, y: number, s: number, knob: boolean, socket: boolean): string {
  const n = s * 0.11;
  const R = s * 0.16;
  const ym = y + s / 2;
  let d = `M${f(x)},${f(y)} H${f(x + s)}`;
  d += knob ? ` V${f(ym - n)} A${f(R)},${f(R)} 0 1 1 ${f(x + s)},${f(ym + n)} V${f(y + s)}` : ` V${f(y + s)}`;
  d += ` H${f(x)}`;
  d += socket ? ` V${f(ym + n)} A${f(R)},${f(R)} 0 1 0 ${f(x)},${f(ym - n)} Z` : " Z";
  return d;
}

export function interlock({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const s = r * 0.92;
  const gap = r * rng.range(0.06, 0.12);
  const ax = cx - s - gap / 2;
  const ay = cy - s * 0.62;
  let back = `<path d="${piece(ax, ay + s, s, true, false)}" fill="none" stroke="${c.ink}" stroke-width="${f(sw)}" stroke-dasharray="3 6" opacity="0.7"/>`;
  back += ring(cx, cy, r * 1.5, c, sw, ' stroke-dasharray="2 8" opacity="0.5"');
  let front = solid(piece(ax, ay, s, true, false), c.a1, c, sw);
  front += solid(piece(ax + s + gap, ay - gap * 0.8, s, true, true), c.a2, c, sw);
  // Motion ticks showing B sliding home.
  for (let k = 0; k < 3; k++) front += seg([ax + s * 2.35 + gap, ay + s * (0.25 + k * 0.2)], [ax + s * 2.55 + gap, ay + s * (0.25 + k * 0.2)], c.ink, sw * 1.4);
  return { back, front, anchor: { x: ax + s / 2, y: ay + s / 2, size: s * 0.6 } };
}
