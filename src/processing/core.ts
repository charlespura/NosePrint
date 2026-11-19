// Pure TypeScript image primitives. No platform APIs — runs on web, iOS, Android and in Jest.

export interface RGBAImage {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray; // RGBA, 4 bytes per pixel
}

export interface GrayImage {
  width: number;
  height: number;
  data: Float32Array; // 0..255
}

export interface Mask {
  width: number;
  height: number;
  data: Uint8Array; // 1 = ink, 0 = empty
}

/** Crop a square/rect region (clamped to bounds). */
export function crop(img: RGBAImage, x: number, y: number, w: number, h: number): RGBAImage {
  x = Math.max(0, Math.floor(x));
  y = Math.max(0, Math.floor(y));
  w = Math.max(1, Math.min(Math.floor(w), img.width - x));
  h = Math.max(1, Math.min(Math.floor(h), img.height - y));
  const out = new Uint8Array(w * h * 4);
  for (let row = 0; row < h; row++) {
    const src = ((y + row) * img.width + x) * 4;
    out.set(img.data.subarray(src, src + w * 4), row * w * 4);
  }
  return { width: w, height: h, data: out };
}

/** Area-average downscale (or nearest upscale) so the longest side is <= maxSide. */
export function resizeToMax(img: RGBAImage, maxSide: number): RGBAImage {
  const scale = maxSide / Math.max(img.width, img.height);
  if (scale >= 1) return img;
  return resize(img, Math.max(1, Math.round(img.width * scale)), Math.max(1, Math.round(img.height * scale)));
}

export function resize(img: RGBAImage, dw: number, dh: number): RGBAImage {
  const { width: sw, height: sh, data } = img;
  const out = new Uint8Array(dw * dh * 4);
  const fx = sw / dw;
  const fy = sh / dh;
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * fy);
    const y1 = Math.max(y0 + 1, Math.min(sh, Math.floor((y + 1) * fy)));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * fx);
      const x1 = Math.max(x0 + 1, Math.min(sw, Math.floor((x + 1) * fx)));
      let r = 0, g = 0, b = 0, a = 0;
      for (let yy = y0; yy < y1; yy++) {
        let i = (yy * sw + x0) * 4;
        for (let xx = x0; xx < x1; xx++, i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; a += data[i + 3];
        }
      }
      const n = (y1 - y0) * (x1 - x0);
      const o = (y * dw + x) * 4;
      out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = a / n;
    }
  }
  return { width: dw, height: dh, data: out };
}

export function grayscale(img: RGBAImage): GrayImage {
  const n = img.width * img.height;
  const out = new Float32Array(n);
  const d = img.data;
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    out[i] = 0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2];
  }
  return { width: img.width, height: img.height, data: out };
}

/** Histogram equalization blended with the original by `amount` (0..1). */
export function equalize(g: GrayImage, amount: number): GrayImage {
  const n = g.data.length;
  const out = new Float32Array(n);
  if (amount <= 0) { out.set(g.data); return { ...g, data: out }; }
  const hist = new Uint32Array(256);
  for (let i = 0; i < n; i++) hist[Math.max(0, Math.min(255, g.data[i] | 0))]++;
  const lut = new Float32Array(256);
  let cum = 0;
  let cdfMin = -1;
  for (let v = 0; v < 256; v++) {
    cum += hist[v];
    if (cdfMin < 0 && cum > 0) cdfMin = cum;
    lut[v] = n === cdfMin ? v : ((cum - cdfMin) / (n - cdfMin)) * 255;
  }
  for (let i = 0; i < n; i++) {
    const v = g.data[i];
    out[i] = v + (lut[Math.max(0, Math.min(255, v | 0))] - v) * amount;
  }
  return { width: g.width, height: g.height, data: out };
}

/** Separable Gaussian blur with clamped edges. */
export function gaussianBlur(g: GrayImage, sigma: number): GrayImage {
  const { width: w, height: h } = g;
  if (sigma < 0.3) return { width: w, height: h, data: new Float32Array(g.data) };
  const r = Math.ceil(sigma * 3);
  const k = new Float32Array(r * 2 + 1);
  let sum = 0;
  for (let i = -r; i <= r; i++) { k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma)); sum += k[i + r]; }
  for (let i = 0; i < k.length; i++) k[i] /= sum;
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) {
        const xx = x + i < 0 ? 0 : x + i >= w ? w - 1 : x + i;
        acc += g.data[row + xx] * k[i + r];
      }
      tmp[row + x] = acc;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let i = -r; i <= r; i++) {
        const yy = y + i < 0 ? 0 : y + i >= h ? h - 1 : y + i;
        acc += tmp[yy * w + x] * k[i + r];
      }
      out[y * w + x] = acc;
    }
  }
  return { width: w, height: h, data: out };
}

/** Mean adaptive threshold: ink where pixel is darker than local mean minus C. */
export function adaptiveThreshold(g: GrayImage, blockSize: number, C: number): Mask {
  const { width: w, height: h, data } = g;
  const W = w + 1;
  const integral = new Float64Array(W * (h + 1));
  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    for (let x = 0; x < w; x++) {
      rowSum += data[y * w + x];
      integral[(y + 1) * W + x + 1] = integral[y * W + x + 1] + rowSum;
    }
  }
  const r = Math.max(1, Math.floor(blockSize / 2));
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
      const s = integral[y1 * W + x1] - integral[y0 * W + x1] - integral[y1 * W + x0] + integral[y0 * W + x0];
      const mean = s / ((y1 - y0) * (x1 - x0));
      out[y * w + x] = data[y * w + x] < mean - C ? 1 : 0;
    }
  }
  return { width: w, height: h, data: out };
}

// Square-window morphology via running counts (separable).
function morph(m: Mask, r: number, mode: 'dilate' | 'erode'): Mask {
  const { width: w, height: h } = m;
  if (r <= 0) return { width: w, height: h, data: new Uint8Array(m.data) };
  const pass = (src: Uint8Array, len: number, lines: number, stride: number, step: number) => {
    const dst = new Uint8Array(src.length);
    for (let l = 0; l < lines; l++) {
      const base = l * stride;
      let count = 0;
      // window [i-r, i+r]
      for (let i = 0; i < Math.min(r, len); i++) count += src[base + i * step];
      for (let i = 0; i < len; i++) {
        const add = i + r;
        if (add < len) count += src[base + add * step];
        const rem = i - r - 1;
        if (rem >= 0) count -= src[base + rem * step];
        const winLen = Math.min(len - 1, i + r) - Math.max(0, i - r) + 1;
        dst[base + i * step] = mode === 'dilate' ? (count > 0 ? 1 : 0) : (count === winLen ? 1 : 0);
      }
    }
    return dst;
  };
  const horiz = pass(m.data, w, h, w, 1);
  const vert = pass(horiz, h, w, 1, w);
  return { width: w, height: h, data: vert };
}

export const dilate = (m: Mask, r: number) => morph(m, r, 'dilate');
export const erode = (m: Mask, r: number) => morph(m, r, 'erode');
export const open = (m: Mask, r: number) => dilate(erode(m, r), r);
export const close = (m: Mask, r: number) => erode(dilate(m, r), r);

/** Remove 8-connected ink components smaller than minArea pixels. */
export function removeSmall(m: Mask, minArea: number): Mask {
  const { width: w, height: h } = m;
  const out = new Uint8Array(m.data);
  if (minArea <= 1) return { width: w, height: h, data: out };
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const comp = new Int32Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (!out[start] || seen[start]) continue;
    let sp = 0, cn = 0;
    stack[sp++] = start; seen[start] = 1;
    while (sp > 0) {
      const p = stack[--sp];
      comp[cn++] = p;
      const px = p % w, py = (p - px) / w;
      for (let dy = -1; dy <= 1; dy++) {
        const ny = py + dy;
        if (ny < 0 || ny >= h) continue;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = px + dx;
          if (nx < 0 || nx >= w) continue;
          const q = ny * w + nx;
          if (out[q] && !seen[q]) { seen[q] = 1; stack[sp++] = q; }
        }
      }
    }
    if (cn < minArea) for (let i = 0; i < cn; i++) out[comp[i]] = 0;
  }
  return { width: w, height: h, data: out };
}

/** Zhang–Suen thinning to a 1-px skeleton. */
export function thin(m: Mask, maxIter = 100): Mask {
  const { width: w, height: h } = m;
  const d = new Uint8Array(m.data);
  const del: number[] = [];
  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let sub = 0; sub < 2; sub++) {
      del.length = 0;
      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          if (!d[i]) continue;
          const p2 = d[i - w], p3 = d[i - w + 1], p4 = d[i + 1], p5 = d[i + w + 1];
          const p6 = d[i + w], p7 = d[i + w - 1], p8 = d[i - 1], p9 = d[i - w - 1];
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9;
          if (B < 2 || B > 6) continue;
          const A = (+(!p2 && p3)) + (+(!p3 && p4)) + (+(!p4 && p5)) + (+(!p5 && p6)) +
            (+(!p6 && p7)) + (+(!p7 && p8)) + (+(!p8 && p9)) + (+(!p9 && p2));
          if (A !== 1) continue;
          if (sub === 0 ? (p2 * p4 * p6 === 0 && p4 * p6 * p8 === 0) : (p2 * p4 * p8 === 0 && p2 * p6 * p8 === 0)) {
            del.push(i);
          }
        }
      }
      if (del.length) { changed = true; for (const i of del) d[i] = 0; }
    }
    if (!changed) break;
  }
  return { width: w, height: h, data: d };
}

/** Clear everything outside the inscribed circle. */
export function circleMask(m: Mask): Mask {
  const { width: w, height: h } = m;
  const out = new Uint8Array(m.data);
  const cx = (w - 1) / 2, cy = (h - 1) / 2, r = Math.min(w, h) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) out[y * w + x] = 0;
  }
  return { width: w, height: h, data: out };
}

export function stdDev(g: GrayImage): number {
  let s = 0, s2 = 0;
  const n = g.data.length;
  for (let i = 0; i < n; i++) { s += g.data[i]; s2 += g.data[i] * g.data[i]; }
  const mean = s / n;
  return Math.sqrt(Math.max(0, s2 / n - mean * mean));
}
