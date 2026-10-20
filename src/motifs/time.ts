import { f, pts, type Pt } from "../geom";
import { circle, line, ring, seg, solid, type Art, type Ctx } from "../draw";

const rad = (deg: number) => (deg * Math.PI) / 180;
const polar = (x: number, y: number, r: number, deg: number): Pt => [x + Math.cos(rad(deg)) * r, y + Math.sin(rad(deg)) * r];

export function sundial({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const R = r * 0.9;
  const ox = cx;
  const oy = cy + r * 0.42;
  const shadow = rng.range(205, 245);
  const [lx, rx] = [ox - R, ox + R];
  let back = seg([cx - r * 1.6, oy], [cx + r * 1.6, oy], c.ink, sw, ' opacity="0.6"');
  back += line(`M${f(ox - R * 1.38)},${f(oy)} A${f(R * 1.38)},${f(R * 1.38)} 0 0 1 ${f(ox + R * 1.38)},${f(oy)}`, c.ink, sw, ' stroke-dasharray="2 7" opacity="0.7"');
  // The sun sits opposite its shadow.
  const [sx, sy] = polar(ox, oy, R * 1.38, 540 - shadow);
  back += circle(sx, sy, r * 0.11, c.a2, ` stroke="${c.ink}" stroke-width="${f(sw)}"`);
  let front = solid(`M${f(lx)},${f(oy)} A${f(R)},${f(R)} 0 0 1 ${f(rx)},${f(oy)} Z`, c.a1, c, sw);
  // The shadow wedge and the gnomon's line.
  const [w1x, w1y] = polar(ox, oy, R * 0.92, shadow - 7);
  const [w2x, w2y] = polar(ox, oy, R * 0.92, shadow + 7);
  front += `<path d="M${f(ox)},${f(oy)} L${f(w1x)},${f(w1y)} A${f(R * 0.92)},${f(R * 0.92)} 0 0 1 ${f(w2x)},${f(w2y)} Z" fill="${c.a1shade}" opacity="0.55"/>`;
  front += seg([ox, oy], polar(ox, oy, R * 0.92, shadow), c.ink, sw * 2.6);
  for (let a = 180; a <= 360; a += 15) {
    const long = a % 45 === 0;
    front += seg(polar(ox, oy, R * (long ? 0.74 : 0.82), a), polar(ox, oy, R * 0.9, a), c.ink, long ? sw * 1.5 : sw);
  }
  front += circle(ox, oy, sw * 4, c.ink);
  return { back, front, anchor: { x: ox, y: oy - R * 0.5, size: R * 0.5 } };
}

export function pendulum({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const px = cx - r * 0.2;
  const py = cy - r * 1.05;
  const L = r * 1.65;
  const bob = r * 0.3;
  const end = rng.range(26, 36);
  let back = seg([px - r * 0.55, py], [px + r * 0.55, py], c.ink, sw * 2.2);
  back += line(`M${pts([polar(px, py, L, 90 + 48)])} A${f(L)},${f(L)} 0 0 0 ${pts([polar(px, py, L, 90 - 48)])}`, c.ink, sw, ' stroke-dasharray="2 7" opacity="0.7"');
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const a = 90 + 40 - (i / steps) * (40 + end);
    const op = f(0.18 + (i / steps) * 0.5);
    const [bx, by] = polar(px, py, L, a);
    back += seg([px, py], [bx, by], c.ink, sw, ` opacity="${op}"`);
    back += circle(bx, by, bob, i === steps - 1 ? c.a2soft : "none", ` stroke="${c.ink}" stroke-width="${f(sw)}" opacity="${op}"`);
  }
  const [bx, by] = polar(px, py, L, 90 - end);
  let front = seg([px, py], [bx, by], c.ink, sw * 1.6);
  front += circle(bx, by, bob, c.a1, ` stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"`);
  front += circle(px, py, sw * 4, c.bg, ` stroke="${c.ink}" stroke-width="${f(sw * 1.4)}"`);
  return { back, front, anchor: { x: bx, y: by, size: bob * 1.7 } };
}

export function timeline({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const y = cy + r * 0.05;
  const x0 = cx - r * 1.6;
  const x1 = cx + r * 1.6;
  let back = seg([x0, y], [x1, y], c.ink, sw * 1.3);
  for (let x = x0 + r * 0.1; x < x1; x += r * 0.1) back += seg([x, y], [x, y + r * 0.05], c.ink, sw, ' opacity="0.6"');
  let front = "";
  const heroX = cx + r * rng.range(0.15, 0.35);
  const heroR = r * 0.34;
  const slots = [-1.35, -0.85, -0.35, 0.85, 1.35];
  slots.forEach((s, i) => {
    const x = cx + s * r + rng.range(-0.06, 0.06) * r;
    const up = i % 2 === 0;
    const stem = r * rng.range(0.42, 0.72);
    const cy2 = up ? y - stem : y + stem;
    const cw = r * 0.44;
    const ch = r * 0.22;
    const top = up ? cy2 - ch : cy2;
    back += seg([x, y], [x, cy2], c.ink, sw, ' stroke-dasharray="2 5"');
    const fill = i === 1 ? c.a2 : i === 3 ? c.a2soft : c.bg;
    front += `<rect x="${f(x - cw / 2)}" y="${f(top)}" width="${f(cw)}" height="${f(ch)}" rx="${f(ch * 0.2)}" fill="${fill}" stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"/>`;
    front += seg([x - cw * 0.34, top + ch * 0.36], [x + cw * 0.22, top + ch * 0.36], c.ink, sw * 2);
    front += seg([x - cw * 0.34, top + ch * 0.66], [x + cw * 0.05, top + ch * 0.66], c.muted, sw * 1.6);
    front += circle(x, y, sw * 4, c.bg, ` stroke="${c.ink}" stroke-width="${f(sw * 1.3)}"`);
  });
  front += circle(heroX, y, heroR, c.a1);
  front += ring(heroX, y, heroR * 1.22, c, sw, ' stroke-dasharray="2 6"');
  return { back, front, anchor: { x: heroX, y, size: heroR * 2.1 } };
}

export function hourglass({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const w = r * 0.95;
  const h = r * 0.88;
  const n = w * 0.05;
  const top = cy - h;
  const bot = cy + h;
  const glass =
    `M${f(cx - w / 2)},${f(top)} L${f(cx + w / 2)},${f(top)} ` +
    `C${f(cx + w / 2)},${f(top + h * 0.7)} ${f(cx + n)},${f(cy - h * 0.3)} ${f(cx + n)},${f(cy)} ` +
    `C${f(cx + n)},${f(cy + h * 0.3)} ${f(cx + w / 2)},${f(bot - h * 0.7)} ${f(cx + w / 2)},${f(bot)} ` +
    `L${f(cx - w / 2)},${f(bot)} ` +
    `C${f(cx - w / 2)},${f(bot - h * 0.7)} ${f(cx - n)},${f(cy + h * 0.3)} ${f(cx - n)},${f(cy)} ` +
    `C${f(cx - n)},${f(cy - h * 0.3)} ${f(cx - w / 2)},${f(top + h * 0.7)} ${f(cx - w / 2)},${f(top)} Z`;
  const fill = rng.range(0.35, 0.55);
  let back = circle(cx, cy, r * 1.05, c.a2soft);
  back += ring(cx, cy, r * 1.42, c, sw, ' stroke-dasharray="2 7" opacity="0.7"');
  for (let i = 0; i < 14; i++) {
    const a = rng.range(0, Math.PI * 2);
    const d = r * rng.range(1.15, 1.6);
    back += circle(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.85, sw * rng.range(1, 2.4), i % 4 ? c.ink : c.a1, ' opacity="0.7"');
  }
  const pile = bot - h * (1 - fill) * 0.9;
  const sand =
    `<path d="M${f(cx - w)},${f(bot)} L${f(cx - w)},${f(pile + h * 0.12)} Q${f(cx)},${f(pile - h * 0.22)} ${f(cx + w)},${f(pile + h * 0.12)} L${f(cx + w)},${f(bot)} Z" fill="${c.a1}"/>` +
    `<path d="M${f(cx - w)},${f(cy)} L${f(cx - w)},${f(top + h * (0.3 + fill * 0.5))} Q${f(cx)},${f(top + h * (0.55 + fill * 0.5))} ${f(cx + w)},${f(top + h * (0.3 + fill * 0.5))} L${f(cx + w)},${f(cy)} Z" fill="${c.a1}"/>` +
    seg([cx, cy], [cx, pile], c.a1shade, sw * 1.4, ` stroke-dasharray="1 ${f(sw * 3)}"`);
  let front = `<clipPath id="hourglass"><path d="${glass}"/></clipPath>`;
  front += `<path d="${glass}" fill="${c.bg}"/><g clip-path="url(#hourglass)">${sand}</g>`;
  front += `<path d="${glass}" fill="none" stroke="${c.ink}" stroke-width="${f(sw * 1.4)}"/>`;
  const capW = w * 1.3;
  const capH = r * 0.08;
  for (const y of [top - capH, bot]) front += `<rect x="${f(cx - capW / 2)}" y="${f(y)}" width="${f(capW)}" height="${f(capH)}" rx="${f(capH / 2)}" fill="${c.a2}" stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"/>`;
  for (const s of [-1, 1]) front += seg([cx + (s * capW) / 2.35, top], [cx + (s * capW) / 2.35, bot], c.ink, sw * 1.6);
  return { back, front, anchor: { x: cx + r * 0.95, y: cy - r * 0.75, size: r * 0.5 } };
}
