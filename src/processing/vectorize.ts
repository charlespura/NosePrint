// Vector tracing of a binary mask into smooth SVG path data (Potrace-style
// boundary tracing + corner-point extraction + quadratic smoothing).
import type { Mask } from './core';
import { Layout } from './layout';

const DX = [1, 0, -1, 0]; // E S W N
const DY = [0, 1, 0, -1];

/** Trace every ink boundary into closed polygons (pixel-corner coordinates). */
export function traceContours(m: Mask): number[][] {
  const { width: w, height: h, data } = m;
  const W = w + 1;
  const out = new Uint8Array(W * (h + 1)); // bitmask of outgoing directions per vertex
  const ink = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && data[y * w + x] === 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!data[y * w + x]) continue;
    if (!ink(x, y - 1)) out[y * W + x] |= 1;            // top edge, east
    if (!ink(x + 1, y)) out[y * W + x + 1] |= 2;        // right edge, south
    if (!ink(x, y + 1)) out[(y + 1) * W + x + 1] |= 4;  // bottom edge, west
    if (!ink(x - 1, y)) out[(y + 1) * W + x] |= 8;      // left edge, north
  }
  const polys: number[][] = [];
  for (let start = 0; start < out.length; start++) {
    if (!out[start]) continue;
    const pts: number[] = [];
    let v = start;
    let dir = -1;
    for (;;) {
      const bits = out[v];
      if (!bits) break;
      let nd = -1;
      if (dir < 0) nd = Math.log2(bits & -bits);
      else for (const turn of [1, 0, 3]) { const d = (dir + turn) & 3; if (bits & (1 << d)) { nd = d; break; } }
      if (nd < 0) break;
      out[v] &= ~(1 << nd);
      if (nd !== dir) pts.push(v % W, (v / W) | 0); // corner
      dir = nd;
      v += DX[nd] + DY[nd] * W;
      if (v === start) break;
    }
    if (pts.length >= 6) polys.push(pts);
  }
  return polys;
}

/** Path data with quadratic curves through edge midpoints (rounds pixel staircases). */
export function contoursToPath(polys: number[][], scale: number, ox: number, oy: number, smooth = true): string {
  const f = (n: number) => (Math.round(n * 100) / 100).toString();
  const parts: string[] = [];
  for (const p of polys) {
    const n = p.length / 2;
    const X = (i: number) => ox + p[(i % n) * 2] * scale;
    const Y = (i: number) => oy + p[(i % n) * 2 + 1] * scale;
    if (!smooth || n < 4) {
      let d = `M${f(X(0))} ${f(Y(0))}`;
      for (let i = 1; i < n; i++) d += `L${f(X(i))} ${f(Y(i))}`;
      parts.push(d + 'Z');
      continue;
    }
    const mx = (i: number) => (X(i) + X(i + 1)) / 2;
    const my = (i: number) => (Y(i) + Y(i + 1)) / 2;
    let d = `M${f(mx(0))} ${f(my(0))}`;
    for (let i = 1; i <= n; i++) d += `Q${f(X(i))} ${f(Y(i))} ${f(mx(i))} ${f(my(i))}`;
    parts.push(d + 'Z');
  }
  return parts.join('');
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

export const SVG_FONTS = {
  script: "'Dancing Script', cursive",
  serif: "'Playfair Display', Georgia, serif",
  sans: "Inter, Helvetica, Arial, sans-serif",
} as const;

export function buildSvg(m: Mask, layout: Layout, o: {
  ink: string; background: string | null; font: keyof typeof SVG_FONTS;
}): string {
  const { width: W, height: H, design } = layout;
  const scale = design.size / m.width;
  const body = contoursToPath(traceContours(m), scale, design.x, design.y);
  const lines = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    `<title>NosePrint</title>`,
  ];
  if (o.background) lines.push(`<rect width="${W}" height="${H}" fill="${o.background}"/>`);
  lines.push(`<path fill="${o.ink}" fill-rule="evenodd" d="${body}"/>`);
  if (layout.frame) {
    const k = layout.frame.area.size / 100;
    lines.push(`<path fill="none" stroke="${o.ink}" stroke-width="${layout.frame.stroke / k}" stroke-linejoin="round" ` +
      `transform="translate(${layout.frame.area.x} ${layout.frame.area.y}) scale(${k})" d="${layout.frame.path}"/>`);
  }
  if (layout.text) {
    const t = layout.text;
    lines.push(`<text x="${t.x}" y="${t.y}" font-size="${t.fontSize}" font-family="${SVG_FONTS[o.font]}" ` +
      `fill="${o.ink}" text-anchor="middle" dominant-baseline="middle">${esc(t.value)}</text>`);
  }
  lines.push('</svg>');
  return lines.join('\n');
}
