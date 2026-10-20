import { Resvg } from "@resvg/resvg-js";
import { join } from "node:path";
import { FONT_FAMILY } from "./compose";

const fontDir = join(import.meta.dir, "..", "fonts");

export function toPng(svg: string, scale = 1): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: scale },
    font: {
      fontFiles: [join(fontDir, "Libron-Regular.ttf"), join(fontDir, "Libron-Italic.ttf")],
      loadSystemFonts: false,
      defaultFontFamily: FONT_FAMILY,
    },
  });
  return resvg.render().asPng();
}
