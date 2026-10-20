import { Resvg } from "@resvg/resvg-js";
import { fileURLToPath } from "node:url";
import { FONT_FAMILY } from "./compose";

const font = (name: string) => fileURLToPath(new URL(`../fonts/${name}`, import.meta.url));

export function toPng(svg: string, scale = 1): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: scale },
    font: {
      fontFiles: [font("Libron-Regular.ttf"), font("Libron-Italic.ttf")],
      loadSystemFonts: false,
      defaultFontFamily: FONT_FAMILY,
    },
  });
  return resvg.render().asPng();
}

export async function toWebp(svg: string, scale = 1, quality = 88): Promise<Buffer> {
  const { default: sharp } = await import("sharp");
  return sharp(toPng(svg, scale)).webp({ quality, alphaQuality: 100 }).toBuffer();
}
