export type Pt = [number, number];

/** Round for compact SVG output. */
export const f = (n: number) => (Math.round(n * 10) / 10).toString();

export const pts = (p: Pt[]) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");

/** Smooth Catmull-Rom curve through points, as cubic Béziers. */
export function smooth(p: Pt[], closed = false, tension = 1): string {
  if (p.length < 2) return "";
  const n = p.length;
  const at = (i: number): Pt => (closed ? p[(i + n) % n]! : p[Math.max(0, Math.min(n - 1, i))]!);
  let d = `M${f(p[0]![0])},${f(p[0]![1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const k = tension / 6;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
