import {
  RGBAImage, Mask, GrayImage, grayscale, equalize, gaussianBlur, adaptiveThreshold,
  open, close, removeSmall, thin, dilate, erode, circleMask, stdDev,
} from './core';

export type Shape = 'square' | 'circle';
export type Style = 'sketch' | 'fineline' | 'stencil' | 'dotwork' | 'bold';
export type Ink = 'black' | 'sepia' | 'navy' | 'red';

export const INK_COLORS: Record<Ink, [number, number, number]> = {
  black: [17, 17, 17], sepia: [94, 60, 40], navy: [28, 42, 84], red: [150, 30, 30],
};

export interface Params {
  style: Style;
  detail: number;      // 0..100 — higher = more creases picked up
  thickness: number;   // 1..6
  smoothness: number;  // 0..5 — blur strength
  contrast: number;    // 0..100 — equalization amount
  shading: number;     // 0..100 — stipple shading amount
  edgeFade: number;    // 0..100 — dissolve toward the edge
  invert: boolean;     // light ink on dark background
  ink: Ink;
  /** Eraser strokes: flat list of [x, y, r] in 0..1 image coordinates. */
  erase: number[];
}

export const DEFAULT_PARAMS: Params = {
  style: 'sketch', detail: 55, thickness: 1.5, smoothness: 1, contrast: 50,
  shading: 60, edgeFade: 50, invert: false, ink: 'black', erase: [],
};

export const PRESETS: { name: string; params: Partial<Params> }[] = [
  { name: 'Balanced', params: { detail: 55, thickness: 1.5, smoothness: 1, contrast: 50, shading: 60, edgeFade: 50 } },
  { name: 'Soft', params: { detail: 35, thickness: 1.5, smoothness: 2.5, contrast: 40, shading: 45, edgeFade: 70 } },
  { name: 'Detailed', params: { detail: 80, thickness: 1, smoothness: 0.5, contrast: 60, shading: 60, edgeFade: 40 } },
  { name: 'High contrast', params: { detail: 60, thickness: 2.5, smoothness: 1, contrast: 100, shading: 85, edgeFade: 30 } },
];

const REF = 512; // parameters are tuned at this size and scaled for others

export function makeMask(img: RGBAImage, p: Params, shape: Shape): Mask {
  const ctx = prepare(img, p);
  let m: Mask;
  switch (p.style) {
    case 'fineline': m = fineline(ctx, p); break;
    case 'stencil': m = stencil(ctx, p); break;
    case 'dotwork': m = dotwork(ctx, p); break;
    case 'bold': m = bold(ctx, p); break;
    default: m = sketch(ctx, p);
  }
  m = edgeFade(m, p.edgeFade);
  m = applyErase(m, p.erase);
  if (shape === 'circle') m = circleMask(m);
  return m;
}

// ---------- shared building blocks ----------

interface Ctx { w: number; h: number; s: number; gray: GrayImage; tone: Float32Array }

function prepare(img: RGBAImage, p: Params): Ctx {
  const s = Math.max(img.width, img.height) / REF;
  const gray = equalize(grayscale(img), p.contrast / 100);
  const tone = normalize(gaussianBlur(gray, 2.5 * s).data);
  return { w: img.width, h: img.height, s, gray, tone };
}

/** Robust 0..1 normalisation using 2nd/98th percentiles. */
export function normalize(g: Float32Array): Float32Array {
  const hist = new Uint32Array(256);
  for (let i = 0; i < g.length; i++) hist[Math.max(0, Math.min(255, g[i] | 0))]++;
  const lo = g.length * 0.02, hi = g.length * 0.98;
  let cum = 0, a = 0, b = 255;
  for (let v = 0; v < 256; v++) { cum += hist[v]; if (cum < lo) a = v; if (cum < hi) b = v; }
  const span = Math.max(1, b - a);
  const out = new Float32Array(g.length);
  for (let i = 0; i < g.length; i++) out[i] = Math.min(1, Math.max(0, (g[i] - a) / span));
  return out;
}

/** Dark gaps between the nose's cobblestone cells. */
function creases(c: Ctx, p: Params): Mask {
  const fine = gaussianBlur(c.gray, (0.5 + p.smoothness * 0.4) * c.s);
  const block = Math.max(3, Math.round(11 * c.s) | 1);
  const C = 12 - (p.detail / 100) * 10;
  return removeSmall(adaptiveThreshold(fine, block, C), Math.round(6 * c.s * c.s));
}

/** Pixels belonging to deep shadow (nostrils). */
function shadows(c: Ctx, level: number): Mask {
  const d = new Uint8Array(c.w * c.h);
  for (let i = 0; i < d.length; i++) d[i] = c.tone[i] < level ? 1 : 0;
  return removeSmall(open({ width: c.w, height: c.h, data: d }, Math.max(1, Math.round(2 * c.s))), Math.round(200 * c.s * c.s));
}

/** Error-diffused stipple of `darkness` (0..1) on a grid with pitch `step`. */
function stipple(c: Ctx, darkness: (i: number) => number, step: number, dotR: number): Mask {
  const { w, h } = c;
  const out = new Uint8Array(w * h);
  const gw = Math.ceil(w / step), gh = Math.ceil(h / step);
  const err = new Float32Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    err[gy * gw + gx] = darkness(Math.min(h - 1, gy * step) * w + Math.min(w - 1, gx * step));
  }
  for (let gy = 0; gy < gh; gy++) {
    const ltr = gy % 2 === 0; // serpentine scan avoids worm artefacts
    for (let k = 0; k < gw; k++) {
      const gx = ltr ? k : gw - 1 - k, i = gy * gw + gx, dir = ltr ? 1 : -1;
      const v = err[i], on = v > 0.5 ? 1 : 0, e = v - on;
      const nx = gx + dir;
      if (nx >= 0 && nx < gw) err[i + dir] += e * 7 / 16;
      if (gy + 1 < gh) {
        if (gx - dir >= 0 && gx - dir < gw) err[i + gw - dir] += e * 3 / 16;
        err[i + gw] += e * 5 / 16;
        if (nx >= 0 && nx < gw) err[i + gw + dir] += e * 1 / 16;
      }
      if (on) {
        const cx = gx * step + (step >> 1), cy = gy * step + (step >> 1);
        for (let y = cy - dotR; y <= cy + dotR; y++) for (let x = cx - dotR; x <= cx + dotR; x++) {
          if (x >= 0 && y >= 0 && x < w && y < h && (x - cx) ** 2 + (y - cy) ** 2 <= dotR * dotR + dotR) out[y * w + x] = 1;
        }
      }
    }
  }
  return { width: w, height: h, data: out };
}

function or(a: Mask, b: Mask): Mask {
  const d = new Uint8Array(a.data.length);
  for (let i = 0; i < d.length; i++) d[i] = a.data[i] | b.data[i];
  return { width: a.width, height: a.height, data: d };
}

// ---------- styles ----------

/** Engraving: cell outlines + stippled shading. */
function sketch(c: Ctx, p: Params): Mask {
  const lines = dilate(creases(c, p), Math.round((p.thickness - 1) * c.s * 0.5));
  const amount = p.shading / 100;
  if (amount <= 0) return lines;
  const step = Math.max(1, Math.round(c.s * 1.25));
  const dots = stipple(c, (i) => Math.pow(1 - c.tone[i], 3) * amount * 1.1, step, Math.max(0, Math.floor((step - 1) / 2)));
  return or(lines, dots);
}

/** Thin clean single lines. */
function fineline(c: Ctx, p: Params): Mask {
  let m = creases(c, p);
  m = close(m, Math.max(1, Math.round(c.s)));
  m = thin(m);
  m = removeSmall(m, Math.round(10 * c.s));
  return dilate(m, Math.round((p.thickness - 0.5) * c.s * 0.5));
}

/** Transfer-ready: crisp outlines of the cells and of the nostrils, no shading. */
function stencil(c: Ctx, p: Params): Mask {
  let m = creases(c, p);
  m = removeSmall(close(m, Math.max(1, Math.round(c.s))), Math.round(30 * c.s * c.s));
  m = thin(m);
  m = removeSmall(m, Math.round(16 * c.s));
  const sh = shadows(c, 0.12 + (p.shading / 100) * 0.2);
  const outline = { width: c.w, height: c.h, data: new Uint8Array(sh.data) };
  const inner = erode(sh, Math.max(1, Math.round(c.s)));
  for (let i = 0; i < outline.data.length; i++) outline.data[i] = sh.data[i] && !inner.data[i] ? 1 : 0;
  return dilate(or(m, outline), Math.round((p.thickness - 0.5) * c.s * 0.6));
}

/** Pure stipple: texture + tone as dots of varying density. */
function dotwork(c: Ctx, p: Params): Mask {
  // texture = how much darker a pixel is than its neighbourhood (the cell gaps)
  const fine = gaussianBlur(c.gray, (0.6 + p.smoothness * 0.4) * c.s);
  const local = gaussianBlur(c.gray, 6 * c.s);
  const tex = new Float32Array(fine.data.length);
  for (let i = 0; i < tex.length; i++) tex[i] = Math.min(1, Math.max(0, (local.data[i] - fine.data[i]) / 30));
  const texW = 0.4 + (p.detail / 100) * 0.9;
  const shadeW = (p.shading / 100) * 0.7;
  const step = Math.max(2, Math.round(c.s * (1 + p.thickness * 0.4)));
  const dotR = Math.max(1, Math.round(step * 0.38));
  return stipple(c, (i) => Math.min(1, tex[i] * texW + Math.pow(1 - c.tone[i], 3) * shadeW), step, dotR);
}

/** Blackwork: filled creases and solid shadows. */
function bold(c: Ctx, p: Params): Mask {
  let m = creases(c, p);
  m = close(m, Math.max(1, Math.round(c.s)));
  m = dilate(m, Math.max(1, Math.round(p.thickness * c.s * 0.6)));
  m = or(m, shadows(c, 0.04 + (p.shading / 100) * 0.12));
  return removeSmall(m, Math.round(40 * c.s * c.s));
}

// ---------- post-processing ----------

function edgeFade(m: Mask, amount: number): Mask {
  const fade = amount / 100;
  if (fade <= 0) return m;
  const { width: w, height: h } = m;
  const out = new Uint8Array(m.data);
  const cx = (w - 1) / 2, cy = (h - 1) / 2, R = Math.min(w, h) / 2;
  const a = 1 - fade * 0.6; // fade starts at this radius
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!out[i]) continue;
    const r = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / R;
    if (r <= a) continue;
    const k = Math.min(1, (r - a) / (1 - a));
    const hash = (((x * 73856093) ^ (y * 19349663)) >>> 0) % 1000 / 1000;
    if (hash < k * k * (3 - 2 * k)) out[i] = 0;
  }
  return { width: w, height: h, data: out };
}

/** Clear eraser circles given in normalised coordinates. */
export function applyErase(m: Mask, erase: number[]): Mask {
  if (!erase.length) return m;
  const { width: w, height: h } = m;
  const out = new Uint8Array(m.data);
  for (let k = 0; k + 2 < erase.length; k += 3) {
    const cx = erase[k] * w, cy = erase[k + 1] * h, r = erase[k + 2] * w;
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(h - 1, Math.ceil(cy + r)); y++) {
      for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(w - 1, Math.ceil(cx + r)); x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) out[y * w + x] = 0;
      }
    }
  }
  return { width: w, height: h, data: out };
}

export interface RenderOptions {
  invert: boolean;
  transparent: boolean;
  shape: Shape;
  ink?: Ink;
}

export function renderMask(m: Mask, o: RenderOptions): RGBAImage {
  const { width: w, height: h } = m;
  const out = new Uint8Array(w * h * 4);
  const inkRgb: [number, number, number] = o.invert ? [250, 248, 244] : INK_COLORS[o.ink ?? 'black'];
  const bgRgb: [number, number, number] = o.invert ? INK_COLORS[o.ink ?? 'black'] : [255, 255, 255];
  const cx = (w - 1) / 2, cy = (h - 1) / 2, rr = (Math.min(w, h) / 2) ** 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x, j = i * 4;
    const outside = o.shape === 'circle' && (x - cx) ** 2 + (y - cy) ** 2 > rr;
    const c = m.data[i] ? inkRgb : bgRgb;
    out[j] = c[0]; out[j + 1] = c[1]; out[j + 2] = c[2];
    out[j + 3] = m.data[i] ? 255 : (o.transparent || outside ? 0 : 255);
  }
  return { width: w, height: h, data: out };
}

/** True when the photo is likely too flat for good line extraction. */
export function isLowContrast(img: RGBAImage): boolean {
  return stdDev(grayscale(img)) < 14;
}
