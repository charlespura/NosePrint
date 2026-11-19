import { test, expect } from "@jest/globals";
import {
  RGBAImage, Mask, crop, resizeToMax, grayscale, equalize, gaussianBlur,
  adaptiveThreshold, dilate, erode, removeSmall, thin, circleMask,
} from '../core';
import { makeMask, renderMask, DEFAULT_PARAMS, isLowContrast } from '../pipeline';

function solid(w: number, h: number, v: number): RGBAImage {
  const d = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; }
  return { width: w, height: h, data: d };
}
function mask(w: number, h: number, on: (x: number, y: number) => boolean): Mask {
  const d = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = on(x, y) ? 1 : 0;
  return { width: w, height: h, data: d };
}
const count = (m: Mask) => m.data.reduce((a, b) => a + b, 0);

test('crop and resize keep dimensions sane', () => {
  const img = solid(100, 80, 50);
  const c = crop(img, 10, 10, 50, 50);
  expect([c.width, c.height]).toEqual([50, 50]);
  const r = resizeToMax(solid(2000, 1000, 120), 1024);
  expect([r.width, r.height]).toEqual([1024, 512]);
  expect(r.data[0]).toBe(120);
});

test('grayscale and blur preserve a flat image', () => {
  const g = grayscale(solid(20, 20, 100));
  expect(g.data[0]).toBeCloseTo(100, 0);
  const b = gaussianBlur(g, 2);
  expect(b.data[210]).toBeCloseTo(100, 3);
});

test('equalize stretches a narrow range', () => {
  const g = grayscale(solid(10, 10, 0));
  for (let i = 0; i < 100; i++) g.data[i] = i < 50 ? 100 : 110;
  const e = equalize(g, 1);
  expect(e.data[99] - e.data[0]).toBeGreaterThan(100);
});

test('adaptive threshold finds a dark line', () => {
  const g = grayscale(solid(40, 40, 200));
  for (let y = 0; y < 40; y++) g.data[y * 40 + 20] = 50;
  const m = adaptiveThreshold(g, 9, 5);
  expect(m.data[10 * 40 + 20]).toBe(1);
  expect(m.data[10 * 40 + 5]).toBe(0);
});

test('dilate/erode are inverses on a block', () => {
  const m = mask(30, 30, (x, y) => x >= 10 && x < 20 && y >= 10 && y < 20);
  expect(count(dilate(m, 1))).toBe(144);
  expect(count(erode(m, 1))).toBe(64);
});

test('removeSmall drops specks', () => {
  const m = mask(30, 30, (x, y) => (x === 2 && y === 2) || (x >= 10 && x < 20 && y >= 10 && y < 20));
  const r = removeSmall(m, 5);
  expect(r.data[2 * 30 + 2]).toBe(0);
  expect(count(r)).toBe(100);
});

test('thin reduces a thick bar to ~1px', () => {
  const m = mask(60, 20, (x, y) => x >= 5 && x < 55 && y >= 6 && y < 13);
  const t = thin(m);
  for (let x = 15; x < 45; x++) {
    let col = 0;
    for (let y = 0; y < 20; y++) col += t.data[y * 60 + x];
    expect(col).toBe(1);
  }
});

test('circleMask clears corners', () => {
  const c = circleMask(mask(20, 20, () => true));
  expect(c.data[0]).toBe(0);
  expect(c.data[10 * 20 + 10]).toBe(1);
});

test('pipeline end-to-end on a synthetic crease pattern', () => {
  const img = solid(256, 256, 190);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    if (x % 32 < 3 || y % 40 < 3) { const j = (y * 256 + x) * 4; img.data[j] = img.data[j + 1] = img.data[j + 2] = 60; }
  }
  const m = makeMask(img, DEFAULT_PARAMS, 'circle');
  expect(m.width).toBe(256);
  expect(count(m)).toBeGreaterThan(200);
  const out = renderMask(m, { invert: false, transparent: true, shape: 'circle' });
  expect(out.data[3]).toBe(0);
  expect(isLowContrast(solid(10, 10, 128))).toBe(true);
  expect(isLowContrast(img)).toBe(false);
});
