// High-level rendering: runs the pure pipeline, then composes with Skia or builds SVG.
import { resizeToMax, type RGBAImage } from './processing/core';
import { INK_COLORS, makeMask, renderMask } from './processing/pipeline';
import { computeLayout } from './processing/layout';
import { buildSvg } from './processing/vectorize';
import type { DesignSettings } from './state/session';
import { getImageIO } from './skia';

const hex = (c: [number, number, number]) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');

function colors(s: DesignSettings, transparent: boolean) {
  const ink = s.params.invert ? '#FAF8F4' : hex(INK_COLORS[s.params.ink]);
  const paper = s.params.invert ? hex(INK_COLORS[s.params.ink]) : '#FFFFFF';
  return { ink, background: transparent ? null : paper };
}

const effectiveShape = (s: DesignSettings) => (s.frame !== 'none' ? 'circle' : s.shape);

/** Base64 PNG of the full design (art + frame + text). */
export async function renderPng(img: RGBAImage, s: DesignSettings, transparent: boolean): Promise<string> {
  const io = await getImageIO();
  const shape = effectiveShape(s);
  const mask = makeMask(img, s.params, shape);
  const art = renderMask(mask, { invert: s.params.invert, ink: s.params.ink, transparent: true, shape });
  const { ink, background } = colors(s, transparent);
  // frames/text are laid out on a canvas the size of the art
  return io.compose(art, { layout: computeLayout(img.width, s.frame, s.text), ink, background, font: s.text.font });
}

/** SVG string (vector paths; traced at up to 1024 px to keep files manageable). */
export function renderSvg(img: RGBAImage, s: DesignSettings, transparent: boolean): string {
  const work = resizeToMax(img, 1024);
  const mask = makeMask(work, s.params, effectiveShape(s));
  const { ink, background } = colors(s, transparent);
  return buildSvg(mask, computeLayout(2000, s.frame, s.text), { ink, background, font: s.text.font });
}
