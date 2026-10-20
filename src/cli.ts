#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve as resolvePath } from "node:path";
import { compose, resolve, sizes, type Spec } from "./compose";
import { groups, motifs, type MotifName } from "./motifs";
import { accents, themes } from "./palette";
import { toPng } from "./render";
import { samples } from "./samples";

const usage = `site-cover: cohesive cover images for projects

  site-cover render <spec.json> [-o cover.png] [--svg] [--scale 2] [--set key=value ...]
  site-cover render --spec '{"title":"..."}' -o cover.png
  site-cover list                 motifs, themes and accents, with what each motif suggests
  site-cover gallery [-o dir]     render sample covers to look at
  site-cover gallery --motifs     render every motif with the same title and colours, to compare

Spec fields: title, tagline, byline, motif, theme, accent, accent2, seed, size, layout, subject.
See README.md for the full guide.`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    out: { type: "string", short: "o" },
    spec: { type: "string" },
    set: { type: "string", multiple: true },
    svg: { type: "boolean" },
    scale: { type: "string" },
    motifs: { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
});

const [cmd, file] = positionals;

function render(spec: Spec, out: string, scale: number, svgToo: boolean) {
  const { svg, width, height } = compose(spec);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, toPng(svg, scale));
  if (svgToo) writeFileSync(out.replace(/\.png$/i, "") + ".svg", svg);
  return { width: width * scale, height: height * scale };
}

if (values.help || !cmd) {
  console.log(usage);
} else if (cmd === "list") {
  for (const g of groups) {
    console.log(`Motifs: ${g}`);
    for (const [name, m] of Object.entries(motifs)) if (m.group === g) console.log(`  ${name.padEnd(14)} ${m.about}`);
    console.log("");
  }
  console.log(`Themes:  ${Object.keys(themes).join(", ")}`);
  console.log(`Accents: ${Object.keys(accents).join(", ")}`);
  console.log(`Sizes:   ${Object.entries(sizes).map(([k, [w, h]]) => `${k} (${w}x${h})`).join(", ")}`);
} else if (cmd === "render") {
  let spec: Spec = {};
  if (values.spec) spec = JSON.parse(values.spec);
  else if (file) spec = JSON.parse(readFileSync(file, "utf8"));
  for (const kv of values.set ?? []) {
    const i = kv.indexOf("=");
    (spec as Record<string, string>)[kv.slice(0, i)] = kv.slice(i + 1);
  }
  const out = resolvePath(values.out ?? "cover.png");
  const scale = Number(values.scale ?? 1);
  const { width, height } = render(spec, out, scale, !!values.svg);
  const r = resolve(spec);
  console.log(`Wrote ${out} (${width}x${height}, motif ${r.motif}, ${r.theme}, ${r.accent}+${r.accent2}, seed "${r.seed}")`);
  const alt = [spec.title, spec.tagline].filter(Boolean).join(": ");
  console.log(`
Add to <head>, with an absolute URL for the image:
  <meta property="og:image" content="https://YOUR-DOMAIN/${out.split("/").pop()}" />
  <meta property="og:image:width" content="${width}" />
  <meta property="og:image:height" content="${height}" />${alt ? `\n  <meta property="og:image:alt" content="${alt.replace(/"/g, "&quot;")}" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />`);
} else if (cmd === "gallery") {
  const dir = resolvePath(values.out ?? "gallery");
  const cards: string[] = [];
  const specs: Record<string, Spec> = values.motifs
    ? Object.fromEntries(
        (Object.keys(motifs) as MotifName[]).map((m) => [m, { title: "Project Name", tagline: "One plain line about what it does.", motif: m, accent: "clay", seed: "compare" }]),
      )
    : samples;
  for (const [name, spec] of Object.entries(specs)) {
    render(spec, join(dir, `${name}.png`), 1, true);
    const r = resolve(spec);
    cards.push(`<figure><img src="${name}.png" alt=""><figcaption>${name} · ${r.motif} · ${r.theme} · ${r.accent}</figcaption></figure>`);
  }
  writeFileSync(
    join(dir, "index.html"),
    `<!doctype html><meta charset="utf-8"><title>Cover gallery</title><style>body{margin:0;padding:32px;background:#e4e1d8;font:14px system-ui;display:grid;grid-template-columns:repeat(auto-fill,minmax(520px,1fr));gap:28px}img{width:100%;display:block;border-radius:10px;box-shadow:0 1px 3px #0002}figcaption{margin-top:8px;color:#555}</style>${cards.join("")}`,
  );
  console.log(`Wrote ${cards.length} covers to ${dir}`);
} else {
  console.error(`Unknown command "${cmd}".\n\n${usage}`);
  process.exit(1);
}
