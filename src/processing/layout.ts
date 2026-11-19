// Pure layout maths shared by the raster (Skia) and vector (SVG) renderers.

export type FrameId = 'none' | 'circle' | 'heart' | 'paw';
export type FontId = 'script' | 'serif' | 'sans';

export interface TextOptions {
  name: string;
  date: string;
  font: FontId;
  position: 'below' | 'above';
}

export const DEFAULT_TEXT: TextOptions = { name: '', date: '', font: 'script', position: 'below' };

interface FrameDef {
  /** SVG path in a 0..100 box. */
  path: string;
  /** Where the circular design sits inside the frame (0..100 units). */
  design: { cx: number; cy: number; r: number };
}

const toe = (x: number, y: number, rx: number, ry: number) =>
  `M${x - rx} ${y} A${rx} ${ry} 0 1 0 ${x + rx} ${y} A${rx} ${ry} 0 1 0 ${x - rx} ${y} Z`;

export const FRAMES: Record<Exclude<FrameId, 'none'>, FrameDef> = {
  circle: {
    path: 'M50 3 A47 47 0 1 1 49.99 3 Z',
    design: { cx: 50, cy: 50, r: 41 },
  },
  heart: {
    path: 'M50 94 C22 74 3 56 3 32 C3 15 15 5 29 5 C39 5 46 11 50 19 C54 11 61 5 71 5 C85 5 97 15 97 32 C97 56 78 74 50 94 Z',
    design: { cx: 50, cy: 41, r: 27 },
  },
  paw: {
    path:
      'M50 40 C68 40 86 56 86 74 C86 89 73 97 60 95 C55 94 53 91 50 91 C47 91 45 94 40 95 C27 97 14 89 14 74 C14 56 32 40 50 40 Z ' +
      toe(17, 36, 8, 10) + ' ' + toe(36, 17, 9, 11) + ' ' + toe(64, 17, 9, 11) + ' ' + toe(83, 36, 8, 10),
    design: { cx: 50, cy: 70, r: 22 },
  },
};

export const FRAME_STROKE = 2.2; // in 0..100 units

export interface Rect { x: number; y: number; size: number }

export interface Layout {
  width: number;
  height: number;
  design: Rect;                       // square the design image is drawn into
  frame: { path: string; area: Rect; stroke: number } | null;
  text: { value: string; x: number; y: number; fontSize: number } | null;
}

export function textValue(t: TextOptions): string {
  return [t.name.trim(), t.date.trim()].filter(Boolean).join(' · ');
}

/** Square art area of side `size`, plus an extra band for text when needed. */
export function computeLayout(size: number, frame: FrameId, text: TextOptions): Layout {
  const value = textValue(text);
  const band = value ? Math.round(size * 0.18) : 0;
  const top = value && text.position === 'above' ? band : 0;
  const area: Rect = { x: 0, y: top, size };
  let design: Rect = area;
  let fr: Layout['frame'] = null;
  if (frame !== 'none') {
    const f = FRAMES[frame];
    const k = size / 100;
    design = { x: (f.design.cx - f.design.r) * k, y: top + (f.design.cy - f.design.r) * k, size: f.design.r * 2 * k };
    fr = { path: f.path, area, stroke: FRAME_STROKE * k };
  }
  const t = value
    ? { value, x: size / 2, y: text.position === 'above' ? band * 0.62 : size + band * 0.62, fontSize: Math.round(size * 0.075) }
    : null;
  return { width: size, height: size + band, design, frame: fr, text: t };
}
