import { test, expect } from '@jest/globals';
import type { Mask, RGBAImage } from '../core';
import { traceContours, contoursToPath, buildSvg } from '../vectorize';
import { computeLayout, DEFAULT_TEXT } from '../layout';
import { applyErase, DEFAULT_PARAMS, makeMask, Style } from '../pipeline';

function mask(w: number, h: number, on: (x: number, y: number) => boolean): Mask {
  const d = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = on(x, y) ? 1 : 0;
  return { width: w, height: h, data: d };
}

test('traces a square as one 4-corner contour', () => {
  const polys = traceContours(mask(10, 10, (x, y) => x >= 2 && x < 6 && y >= 3 && y < 7));
  expect(polys.length).toBe(1);
  expect(polys[0].length).toBe(8);
  expect(polys[0]).toEqual(expect.arrayContaining([2, 3, 6, 7]));
});

test('traces a ring as outer + hole', () => {
  const ring = mask(12, 12, (x, y) => x >= 1 && x < 11 && y >= 1 && y < 11 && !(x >= 4 && x < 8 && y >= 4 && y < 8));
  expect(traceContours(ring).length).toBe(2);
});

test('handles diagonal (saddle) pixels without hanging', () => {
  const polys = traceContours(mask(4, 4, (x, y) => (x === 1 && y === 1) || (x === 2 && y === 2)));
  expect(polys.length).toBeGreaterThanOrEqual(1);
  expect(contoursToPath(polys, 1, 0, 0)).toMatch(/^M/);
});

test('layout adds a text band and places the frame design', () => {
  const l = computeLayout(1000, 'heart', { ...DEFAULT_TEXT, name: 'Max', date: '2026' });
  expect(l.height).toBe(1180);
  expect(l.text?.value).toBe('Max · 2026');
  expect(l.design.size).toBeCloseTo(540);
  expect(computeLayout(1000, 'none', DEFAULT_TEXT).height).toBe(1000);
});

test('buildSvg produces valid-looking markup and escapes text', () => {
  const m = mask(20, 20, (x, y) => x > 5 && x < 15 && y > 5 && y < 15);
  const svg = buildSvg(m, computeLayout(200, 'circle', { ...DEFAULT_TEXT, name: 'A&B' }), { ink: '#111', background: null, font: 'serif' });
  expect(svg).toContain('<svg');
  expect(svg).toContain('A&amp;B');
  expect(svg).toContain('fill-rule="evenodd"');
});

test('eraser clears pixels', () => {
  const m = applyErase(mask(10, 10, () => true), [0.5, 0.5, 0.2]);
  expect(m.data[5 * 10 + 5]).toBe(0);
  expect(m.data[0]).toBe(1);
});

test('every style produces ink on a textured image', () => {
  const w = 128;
  const d = new Uint8Array(w * w * 4);
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) {
    const v = (x % 12 < 2 || y % 14 < 2) ? 40 : (x < 40 ? 70 : 180);
    d.set([v, v, v, 255], (y * w + x) * 4);
  }
  const img: RGBAImage = { width: w, height: w, data: d };
  for (const style of ['sketch', 'fineline', 'stencil', 'dotwork', 'bold'] as Style[]) {
    const m = makeMask(img, { ...DEFAULT_PARAMS, style, edgeFade: 0 }, 'square');
    const ink = m.data.reduce((a, b) => a + b, 0);
    expect(ink).toBeGreaterThan(50);
    expect(ink).toBeLessThan(w * w);
  }
});
