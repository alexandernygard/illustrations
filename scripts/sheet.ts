// Renders the README contact sheets: examples/sheet.png (samples) and examples/motifs.png (every motif).
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { compose, type Spec } from "../src/compose";
import { motifs, type MotifName } from "../src/motifs";
import { toPng } from "../src/render";
import { samples } from "../src/samples";

function sheet(specs: Spec[], file: string, cols: number, scale: number) {
  const w = 1200 * scale, h = 630 * scale, gap = 24;
  const rows = Math.ceil(specs.length / cols);
  const W = cols * w + (cols + 1) * gap;
  const H = rows * h + (rows + 1) * gap;
  const tiles = specs.map((spec, i) => {
    const png = toPng(compose(spec).svg, scale).toString("base64");
    const x = gap + (i % cols) * (w + gap);
    const y = gap + Math.floor(i / cols) * (h + gap);
    return `<clipPath id="c${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/></clipPath><image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/png;base64,${png}" clip-path="url(#c${i})"/>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#E4E1D8"/>${tiles.join("")}</svg>`;
  writeFileSync(join(import.meta.dir, "..", "examples", file), toPng(svg));
  console.log(`Wrote examples/${file}`);
}

const picks = ["budget", "timeblock", "rooms", "auth", "components", "finn", "beatport", "jit", "watcher"];
sheet(picks.map((n) => samples[n]!), "sheet.png", 3, 0.5);
sheet(
  (Object.keys(motifs) as MotifName[]).map((m) => ({ title: m, motif: m, accent: "clay", seed: "compare" })),
  "motifs.png",
  4,
  0.4,
);
