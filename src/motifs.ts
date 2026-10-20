// Motifs are the abstract compositions behind each cover. Each one is a visual metaphor
// an agent can pick to hint at what a project does, drawn from the shared palette.

import { mix } from "./palette";
import { f, pts, smooth, type Pt } from "./geom";
import { circle, line, type Art, type Ctx } from "./draw";
import { hourglass, pendulum, sundial, timeline } from "./motifs/time";
import { bars, knot, matrix, sieve, tree } from "./motifs/data";
import { horizon, pin, rooms, window } from "./motifs/place";
import { bubbles, interlock, ripple, signal } from "./motifs/connection";
import { loom, prism, spiral } from "./motifs/making";

type Motif = { group: Group; about: string; draw: (ctx: Ctx) => Art };

function orbit({ rng, cx, cy, r, c, sw, W, H }: Ctx): Art {
  const tilt = rng.range(-26, -14);
  const e = rng.range(0.3, 0.38);
  const heroR = r * 0.5;
  const rot = `transform="rotate(${f(tilt)} ${f(cx)} ${f(cy)})"`;
  let back = "";
  let front = "";
  // Scattered specks give the orbits some depth of field.
  for (let i = 0; i < 26; i++) {
    const a = rng.range(0, Math.PI * 2);
    const d = rng.range(r * 0.9, r * 2.1);
    const x = cx + Math.cos(a) * d * 1.3;
    const y = cy + Math.sin(a) * d * 0.7;
    if (x < 0 || x > W || y < 0 || y > H) continue;
    back += circle(x, y, rng.range(0.8, 2) * sw, c.ink, ` opacity="${f(rng.range(0.25, 0.6))}"`);
  }
  const rings = [0.82, 1.08, 1.36, 1.66].map((k) => k * r);
  for (const [i, rx] of rings.entries()) {
    const ry = rx * e;
    const op = i === rings.length - 1 ? ' stroke-dasharray="2 7"' : "";
    back += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="${c.ink}" stroke-width="${f(sw)}"${op} ${rot}/>`;
    // The near half of each ring passes in front of the planet.
    front += `<path d="M${f(cx + rx)},${f(cy)} A${f(rx)},${f(ry)} 0 0 1 ${f(cx - rx)},${f(cy)}" fill="none" stroke="${c.ink}" stroke-width="${f(sw)}"${op} ${rot}/>`;
  }
  front = circle(cx, cy, heroR, c.a1) + front;
  const bodies: [number, string, number][] = [
    [1, c.a2, 0.09],
    [2, c.ink, 0.045],
    [3, c.bg, 0.06],
  ];
  const t = (tilt * Math.PI) / 180;
  for (const [ring, fill, size] of bodies) {
    const rx = rings[ring]!;
    const ry = rx * e;
    // Keep bodies on the near side so they read clearly against the planet.
    const a = rng.range(0.15, 0.85) * Math.PI * (rng.chance(0.5) ? 1 : -1);
    const lx = Math.cos(a) * rx;
    const ly = Math.sin(a) * ry;
    const x = cx + lx * Math.cos(t) - ly * Math.sin(t);
    const y = cy + lx * Math.sin(t) + ly * Math.cos(t);
    const dot = circle(x, y, r * size, fill, ` stroke="${c.ink}" stroke-width="${f(sw)}"`);
    if (ly > 0) front += dot;
    else back += dot;
  }
  return { back, front, anchor: { x: cx, y: cy, size: heroR * 2.2 } };
}

function flow({ rng, cx, cy, r, c, sw, W }: Ctx): Art {
  const heroR = r * 0.46;
  const a = heroR * 1.22;
  const phase = rng.range(0, Math.PI * 2);
  const accentLines = new Set([rng.int(2, 5), rng.int(13, 17)]);
  let back = "";
  const n = 24;
  for (let i = 0; i < n; i++) {
    const psi = (i / (n - 1) - 0.5) * r * 3.6;
    if (Math.abs(psi) < a * 0.18) continue;
    const s = Math.sign(psi);
    const p: Pt[] = [];
    for (let x = -20; x <= W + 20; x += 12) {
      const dx = x - cx;
      // Streamline of potential flow around a cylinder: y(1 - a²/(x²+y²)) = ψ.
      let lo = Math.max(Math.abs(psi), Math.sqrt(Math.max(a * a - dx * dx, 0)));
      let hi = Math.abs(psi) + a * 1.5;
      for (let k = 0; k < 40; k++) {
        const y = (lo + hi) / 2;
        if (y - (a * a * y) / (dx * dx + y * y) < Math.abs(psi)) lo = y;
        else hi = y;
      }
      const far = 1 - Math.exp(-(dx * dx) / (r * r * 1.4));
      const wave = Math.sin(x * 0.0065 + phase + psi * 0.004) * r * 0.06 * far;
      p.push([x, cy + s * lo + wave]);
    }
    const near = Math.exp(-Math.abs(psi) / (r * 1.1));
    const accent = accentLines.has(i);
    back += line(smooth(p), accent ? c.a2 : c.ink, accent ? sw * 2 : sw, ` opacity="${f(accent ? 1 : 0.35 + 0.6 * near)}"`);
  }
  let front = circle(cx, cy, heroR, c.a1);
  // Small particles riding the stream.
  for (let i = 0; i < 5; i++) {
    const x = cx + rng.range(-1.6, 1.6) * r;
    const y = cy + rng.range(-1.4, 1.4) * r;
    if (Math.hypot(x - cx, y - cy) < a * 1.1) continue;
    front += circle(x, y, sw * rng.range(2.5, 4), i % 2 ? c.a2 : c.ink);
  }
  return { back, front, anchor: { x: cx, y: cy, size: heroR * 2.2 } };
}

function contour({ rng, noise, cx, cy, r, c, sw }: Ctx): Art {
  const ox = cx + rng.range(-0.08, 0.08) * r;
  const oy = cy + rng.range(-0.08, 0.08) * r;
  const n = 13;
  const rings: string[] = [];
  for (let i = 0; i < n; i++) {
    const R = r * (0.14 + (i / (n - 1)) * 1.55);
    const p: Pt[] = [];
    for (let k = 0; k < 96; k++) {
      const t = (k / 96) * Math.PI * 2;
      const q = Math.cos(t);
      const s = Math.sin(t);
      // Outer rings take more noise, like terrain flattening out from a summit.
      const amp = 0.08 + (i / n) * 0.2;
      const m = 1 + amp * noise(q * 1.2 + i * 0.09 + 3, s * 1.2 + i * 0.05) + 0.05 * noise(q * 3 + 7, s * 3 + i * 0.12);
      p.push([ox + q * R * m * 1.12, oy + s * R * m * 0.9]);
    }
    rings.push(smooth(p, true));
  }
  let back = "";
  rings.forEach((d, i) => {
    if (i < 4) return;
    const index = i % 4 === 0;
    back += line(d, c.ink, index ? sw * 1.6 : sw, ` opacity="${index ? 0.85 : 0.5}"`);
  });
  let front = `<path d="${rings[3]}" fill="${c.a1}"/>`;
  front += `<path d="${rings[1]}" fill="${c.a2}"/>`;
  front += line(rings[3]!, c.ink, sw);
  front += line(rings[1]!, c.ink, sw);
  // A dashed route climbing toward the summit.
  const route: Pt[] = [];
  const start = rng.range(0, Math.PI * 2);
  for (let k = 0; k <= 8; k++) {
    const t = start + k * 0.32;
    const d = r * (1.75 - k * 0.16);
    route.push([ox + Math.cos(t) * d * 1.1, oy + Math.sin(t) * d * 0.88]);
  }
  front += line(smooth(route), c.ink, sw * 1.4, ` stroke-dasharray="${f(sw * 3)} ${f(sw * 5)}"`);
  const [ex, ey] = route[route.length - 1]!;
  front += circle(ex, ey, sw * 4, c.bg, ` stroke="${c.ink}" stroke-width="${f(sw * 1.4)}"`);
  return { back, front, anchor: { x: ox, y: oy, size: r * 0.95 } };
}

function constellation({ rng, cx, cy, r, c, sw, W, H }: Ctx): Art {
  const p: Pt[] = [[cx, cy]];
  const minD = r * 0.27;
  for (let tries = 0; tries < 900 && p.length < 24; tries++) {
    const a = rng.range(0, Math.PI * 2);
    const d = Math.sqrt(rng.next()) * r * 1.7;
    const q: Pt = [cx + Math.cos(a) * d * 1.25, cy + Math.sin(a) * d * 0.82];
    const m = r * 0.2;
    if (q[0] < m || q[0] > W - m || q[1] < m || q[1] > H - m) continue;
    const hubClear = Math.hypot(q[0] - cx, q[1] - cy) > r * 0.55;
    if (hubClear && p.every((o) => Math.hypot(o[0] - q[0], o[1] - q[1]) > minD)) p.push(q);
  }
  const edges = new Set<string>();
  const nearest = (i: number, k: number) =>
    p
      .map((q, j) => [j, Math.hypot(q[0] - p[i]![0], q[1] - p[i]![1])] as const)
      .filter(([j]) => j !== i)
      .sort((x, y) => x[1] - y[1])
      .slice(0, k)
      .map(([j]) => j);
  const add = (i: number, j: number) => edges.add(i < j ? `${i}-${j}` : `${j}-${i}`);
  // A spanning tree keeps the network in one piece; nearest links add some loops.
  const inTree = new Set([0]);
  while (inTree.size < p.length) {
    let best: [number, number, number] = [0, 0, Infinity];
    for (const i of inTree)
      p.forEach((q, j) => {
        const d = Math.hypot(q[0] - p[i]![0], q[1] - p[i]![1]);
        if (!inTree.has(j) && d < best[2]) best = [i, j, d];
      });
    add(best[0], best[1]);
    inTree.add(best[1]);
  }
  p.forEach((_, i) => {
    for (const j of nearest(i, i === 0 ? 5 : 2)) add(i, j);
  });
  let back = "";
  for (const e of edges) {
    const [i, j] = e.split("-").map(Number) as [number, number];
    const hub = i === 0;
    back += line(`M${pts([p[i]!, p[j]!])}`, c.ink, sw, ` opacity="${hub ? 0.9 : 0.55}"`);
  }
  const heroR = r * 0.4;
  let front = circle(cx, cy, heroR, c.a1);
  front += circle(cx, cy, heroR * 1.28, "none", ` stroke="${c.ink}" stroke-width="${f(sw)}" stroke-dasharray="2 6"`);
  p.slice(1).forEach((q, i) => {
    const big = i % 5 === 0;
    const fill = i % 7 === 2 ? c.a2 : i % 6 === 4 ? c.ink : c.bg;
    front += circle(q[0], q[1], r * (big ? 0.06 : 0.035), fill, ` stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"`);
  });
  return { back, front, anchor: { x: cx, y: cy, size: heroR * 2.2 } };
}

function isoGrid({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const n = 7;
  const s = r * 0.3;
  const k = Math.cos(Math.PI / 6);
  const P = (u: number, v: number, h = 0): Pt => [cx + (u - v) * s * k, cy + (u + v) * s * 0.5 - h + r * 0.15];
  let back = "";
  const h = n / 2;
  for (let i = 0; i <= n; i++) {
    const u = i - h;
    back += line(`M${pts([P(u, -h), P(u, h)])}`, c.ink, sw, ' opacity="0.5"');
    back += line(`M${pts([P(-h, u), P(h, u)])}`, c.ink, sw, ' opacity="0.5"');
  }
  // A few tiles tinted on the floor.
  for (let i = 0; i < 5; i++) {
    const u = rng.int(0, n - 1) - h;
    const v = rng.int(0, n - 1) - h;
    back += `<polygon points="${pts([P(u, v), P(u + 1, v), P(u + 1, v + 1), P(u, v + 1)])}" fill="${i % 2 ? c.a2soft : c.a1soft}"/>`;
  }
  // Solids, drawn back to front.
  const blocks: { u: number; v: number; w: number; d: number; z: number; top: string; side: string }[] = [
    { u: -1, v: -1, w: 2, d: 2, z: r * 0.62, top: c.a1, side: c.a1shade },
    { u: rng.int(1, 2), v: rng.int(-3, -2), w: 1, d: 1, z: r * 0.32, top: c.a2, side: c.a2shade },
    { u: rng.int(-3, -2), v: rng.int(1, 2), w: 1, d: 2, z: r * 0.2, top: c.bg, side: c.a2soft },
  ];
  blocks.sort((a, b) => a.u + a.v - (b.u + b.v));
  let front = "";
  const st = ` stroke="${c.ink}" stroke-width="${f(sw * 1.2)}" stroke-linejoin="round"`;
  for (const b of blocks) {
    const { u, v, w, d, z } = b;
    front += `<polygon points="${pts([P(u + w, v), P(u + w, v + d), P(u + w, v + d, z), P(u + w, v, z)])}" fill="${b.side}"${st}/>`;
    front += `<polygon points="${pts([P(u, v + d), P(u + w, v + d), P(u + w, v + d, z), P(u, v + d, z)])}" fill="${mix(b.side, c.bg, 0.3)}"${st}/>`;
    front += `<polygon points="${pts([P(u, v, z), P(u + w, v, z), P(u + w, v + d, z), P(u, v + d, z)])}" fill="${b.top}"${st}/>`;
  }
  const [ax, ay] = P(0, 0, r * 0.62);
  return { back, front, anchor: { x: ax, y: ay - r * 0.42, size: r * 0.7 } };
}

function stack({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const k = Math.cos(Math.PI / 6);
  const w = r * 0.95;
  const gap = r * 0.34;
  const thick = r * 0.05;
  const layers = 4;
  const top0 = cy - ((layers - 1) * gap) / 2;
  const rh = (y: number): Pt[] => [
    [cx, y - w * 0.5],
    [cx + w * k, y],
    [cx, y + w * 0.5],
    [cx - w * k, y],
  ];
  let back = "";
  // Guides threading the layers together.
  for (const [x, dy] of [[cx - w * k, 0], [cx + w * k, 0], [cx, w * 0.5]] as const) {
    back += line(`M${f(x)},${f(top0 + dy)} L${f(x)},${f(top0 + (layers - 1) * gap + dy)}`, c.ink, sw, ` stroke-dasharray="2 6" opacity="0.7"`);
  }
  let front = "";
  const accentAt = rng.int(1, layers - 2);
  for (let i = layers - 1; i >= 0; i--) {
    const y = top0 + i * gap;
    const p = rh(y);
    const fill = i === 0 ? c.a1 : i === accentAt ? c.a2 : c.bg;
    const shade = i === 0 ? c.a1shade : i === accentAt ? c.a2shade : c.muted;
    const st = ` stroke="${c.ink}" stroke-width="${f(sw * 1.2)}" stroke-linejoin="round"`;
    front += `<polygon points="${pts([p[3]!, p[2]!, p[1]!, [p[1]![0], p[1]![1] + thick], [p[2]![0], p[2]![1] + thick], [p[3]![0], p[3]![1] + thick]])}" fill="${shade}"${st}/>`;
    front += `<polygon points="${pts(p)}" fill="${fill}"${st}/>`;
  }
  // Interface detail on the top layer.
  const y0 = top0;
  const iso = (u: number, v: number): Pt => [cx + (u - v) * w * k, y0 + (u + v) * w * 0.5 - w * 0.5];
  for (const [u0, u1, v] of [[0.18, 0.62, 0.3], [0.18, 0.46, 0.42]] as const) {
    front += line(`M${pts([iso(u0, v), iso(u1, v)])}`, c.ink, sw * 2.2, ' opacity="0.8"');
  }
  front += `<polygon points="${pts([iso(0.2, 0.58), iso(0.52, 0.58), iso(0.52, 0.82), iso(0.2, 0.82)])}" fill="${c.bg}" stroke="${c.ink}" stroke-width="${f(sw)}"/>`;
  return { back, front, anchor: { x: cx, y: top0 - r * 0.62, size: r * 0.6 } };
}

function bloom({ rng, noise, cx, cy, r, c, sw }: Ctx): Art {
  const heroR = r * 0.34;
  let back = "";
  const n = 72;
  const off = rng.range(0, 100);
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const len = r * (0.95 + 0.55 * noise(Math.cos(t) * 1.4 + off, Math.sin(t) * 1.4) + (i % 3 === 0 ? 0.18 : 0));
    const r0 = heroR * 1.32;
    const x1 = cx + Math.cos(t) * r0;
    const y1 = cy + Math.sin(t) * r0;
    const x2 = cx + Math.cos(t) * len;
    const y2 = cy + Math.sin(t) * len;
    back += line(`M${f(x1)},${f(y1)} L${f(x2)},${f(y2)}`, c.ink, sw, ` opacity="${i % 3 === 0 ? 0.85 : 0.45}"`);
    if (i % 9 === 4) back += circle(x2, y2, sw * 3.4, i % 18 === 4 ? c.a2 : c.ink);
  }
  back += circle(cx, cy, r * 1.62, "none", ` stroke="${c.ink}" stroke-width="${f(sw)}" stroke-dasharray="2 8" opacity="0.6"`);
  let front = circle(cx, cy, heroR * 1.14, c.a2soft);
  front += circle(cx, cy, heroR, c.a1);
  return { back, front, anchor: { x: cx, y: cy, size: heroR * 2.2 } };
}

function wave({ rng, noise, cx, cy, r, c, sw }: Ctx): Art {
  const heroR = r * 0.62;
  const n = 36;
  const span = r * 2.7;
  const off = rng.range(0, 100);
  const hiFrom = rng.int(8, 14);
  let bars = "";
  let lit = "";
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = cx - span / 2 + t * span;
    const env = Math.exp(-((t - 0.5) ** 2) / 0.07);
    const h = r * (0.06 + env * (0.55 + 0.45 * noise(t * 5 + off, 0.5)));
    const d = `M${f(x)},${f(cy - h)} L${f(x)},${f(cy + h)}`;
    const accent = i >= hiFrom && i < hiFrom + 4;
    bars += line(d, accent ? c.a2 : c.ink, sw * 3.2);
    if (!accent) lit += line(d, c.bg, sw * 3.2);
  }
  const back = line(`M${f(cx - span / 2 - r * 0.2)},${f(cy)} L${f(cx + span / 2 + r * 0.2)},${f(cy)}`, c.ink, sw, ' opacity="0.4"');
  // Bars knock out of the disc, so it reads as one graphic shape.
  const front =
    `<clipPath id="wave-disc"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(heroR)}"/></clipPath>` +
    circle(cx, cy, heroR, c.a1) +
    bars +
    `<g clip-path="url(#wave-disc)">${lit}</g>`;
  return { back, front, anchor: { x: cx, y: cy - heroR - r * 0.42, size: r * 0.7 } };
}

function panes({ rng, cx, cy, r, c, sw }: Ctx): Art {
  const W = r * 1.5;
  const H = r * 1.05;
  const rad = r * 0.06;
  const st = ` stroke="${c.ink}" stroke-width="${f(sw * 1.2)}"`;
  const win = (x: number, y: number, fill: string) =>
    `<rect x="${f(x)}" y="${f(y)}" width="${f(W)}" height="${f(H)}" rx="${f(rad)}" fill="${fill}"${st}/>` +
    line(`M${f(x)},${f(y + H * 0.14)} L${f(x + W)},${f(y + H * 0.14)}`, c.ink, sw) +
    [0, 1, 2].map((i) => circle(x + H * 0.08 + i * H * 0.07, y + H * 0.07, H * 0.022, c.ink)).join("");
  const dx = r * 0.36;
  const dy = r * 0.3;
  const x0 = cx - W / 2;
  const y0 = cy - H / 2;
  const back = circle(cx + r * 0.75, cy - r * 0.55, r * 0.5, c.a1) + win(x0 - dx, y0 - dy, c.a2soft);
  let front = win(x0, y0, c.a2) + win(x0 + dx, y0 + dy, c.bg);
  // Skeleton content in the front window.
  const fx = x0 + dx + W * 0.08;
  const fy = y0 + dy + H * 0.28;
  front += line(`M${f(fx)},${f(fy)} L${f(fx + W * 0.36)},${f(fy)}`, c.ink, sw * 3);
  front += line(`M${f(fx)},${f(fy + H * 0.12)} L${f(fx + W * 0.26)},${f(fy + H * 0.12)}`, c.muted, sw * 2.2);
  const bw = W * 0.06;
  for (let i = 0; i < 5; i++) {
    const bh = H * rng.range(0.12, 0.36);
    const bx = fx + W * 0.46 + i * bw * 1.6;
    const by = y0 + dy + H * 0.86;
    front += `<rect x="${f(bx)}" y="${f(by - bh)}" width="${f(bw)}" height="${f(bh)}" rx="${f(bw * 0.3)}" fill="${i === 3 ? c.a1 : c.ink}"/>`;
  }
  front += `<rect x="${f(fx)}" y="${f(fy + H * 0.24)}" width="${f(W * 0.3)}" height="${f(H * 0.28)}" rx="${f(rad * 0.6)}" fill="${c.a1soft}"${st}/>`;
  return { back, front, anchor: { x: cx + r * 0.75, y: cy - r * 0.55, size: r * 0.62 } };
}

export const groups = ["time", "data", "place", "connection", "making"] as const;
type Group = (typeof groups)[number];

export const motifs = {
  orbit: { group: "time", about: "rings around a planet: scheduling, cycles, systems, anything with a core and satellites", draw: orbit },
  sundial: { group: "time", about: "a dial and its shadow: habits, reminders, countdowns, daily routines", draw: sundial },
  pendulum: { group: "time", about: "a swinging bob with ghosted positions: rhythm, timing, metronomes, loops", draw: pendulum },
  timeline: { group: "time", about: "milestones along a rule: changelogs, history, journals, versioning, roadmaps", draw: timeline },
  hourglass: { group: "time", about: "sand running through a glass: deadlines, queues, rate limits, waiting", draw: hourglass },

  flow: { group: "data", about: "streamlines bending around a body: pipelines, streams, sync, movement, throughput", draw: flow },
  tree: { group: "data", about: "branches from a root: file systems, git, hierarchies, decision trees, family trees", draw: tree },
  matrix: { group: "data", about: "a dot grid swelling into a cluster: spreadsheets, heatmaps, habit trackers, pixels", draw: matrix },
  sieve: { group: "data", about: "a funnel letting few things through: search, filters, scrapers, alerts, triage", draw: sieve },
  knot: { group: "data", about: "two interlocked loops: merging, two-way sync, integrations, pairing", draw: knot },
  bars: { group: "data", about: "rising columns with a trend line: analytics, finance, budgets, fitness stats", draw: bars },
  wave: { group: "data", about: "a waveform through a disc: audio, voice, music, signals", draw: wave },
  stack: { group: "data", about: "stacked planes: components, design systems, infrastructure, layers, libraries", draw: stack },

  contour: { group: "place", about: "topographic lines around a summit: maps, exploration, goals, progress", draw: contour },
  horizon: { group: "place", about: "a sun on a low horizon over water: travel, weather, outdoors, calm apps", draw: horizon },
  window: { group: "place", about: "an arched doorway onto a view: portals, onboarding, home pages, interiors", draw: window },
  pin: { group: "place", about: "a map pin on a folded map: location, delivery, places, local search", draw: pin },
  rooms: { group: "place", about: "a top-down floor plan: real estate, room layout, homes, venues", draw: rooms },
  grid: { group: "place", about: "isometric floor with solids: planning, spaces, building, calendars", draw: isoGrid },

  constellation: { group: "connection", about: "a hub and connected nodes: networks, auth, graphs, integrations, agents", draw: constellation },
  bubbles: { group: "connection", about: "overlapping speech bubbles: chat, comments, assistants, messaging", draw: bubbles },
  ripple: { group: "connection", about: "rings spreading from a drop: notifications, broadcast, sharing, feedback", draw: ripple },
  signal: { group: "connection", about: "arcs radiating from a mast: real-time, push, IoT, connectivity", draw: signal },
  interlock: { group: "connection", about: "puzzle pieces sliding together: collaboration, matching, handoff, fit", draw: interlock },

  bloom: { group: "making", about: "rays from a centre: AI, ideas, generation, creativity, launches", draw: bloom },
  prism: { group: "making", about: "a beam split into colours: converters, compilers, transformers, AI rewriting", draw: prism },
  loom: { group: "making", about: "threads woven on a loom: generators, templates, builders, crafting", draw: loom },
  spiral: { group: "making", about: "a golden spiral in nested squares: design tools, growth, recursion, learning", draw: spiral },
  panes: { group: "making", about: "overlapping app windows: dashboards, tools, productivity, web apps, admin UIs", draw: panes },
} satisfies Record<string, Motif>;

export type MotifName = keyof typeof motifs;
