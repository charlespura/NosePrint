import {
  Skia, AlphaType, ColorType, ImageFormat, PaintStyle, StrokeJoin, FilterMode, MipmapMode,
  type SkTypeface,
} from '@shopify/react-native-skia';
import { Asset } from 'expo-asset';
import type { RGBAImage } from '../processing/core';
import type { FontId, Layout } from '../processing/layout';

/** Decode an image URI (file://, content://, blob:, data:) into RGBA pixels. */
export async function decodeUri(uri: string): Promise<RGBAImage> {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('Could not read this image.');
  const width = image.width();
  const height = image.height();
  const pixels = image.readPixels(0, 0, {
    width, height, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul,
  });
  if (!pixels || pixels instanceof Float32Array) throw new Error('Could not read image pixels.');
  return { width, height, data: new Uint8Array(pixels) };
}

function toSkImage(img: RGBAImage) {
  const data = Skia.Data.fromBytes(new Uint8Array(img.data.buffer, img.data.byteOffset, img.data.byteLength));
  const image = Skia.Image.MakeImage(
    { width: img.width, height: img.height, colorType: ColorType.RGBA_8888, alphaType: AlphaType.Unpremul },
    data, img.width * 4,
  );
  if (!image) throw new Error('Could not encode image.');
  return image;
}

/** Encode RGBA pixels to base64 (no data: prefix). */
export function encode(img: RGBAImage, format: 'png' | 'jpeg' = 'png'): string {
  return toSkImage(img).encodeToBase64(format === 'png' ? ImageFormat.PNG : ImageFormat.JPEG, format === 'png' ? 100 : 90);
}
export const encodePng = (img: RGBAImage) => encode(img, 'png');

// ---------- fonts (bundled, so text works offline) ----------

const FONT_MODULES: Record<FontId, number> = {
  script: require('@expo-google-fonts/dancing-script/700Bold/DancingScript_700Bold.ttf'),
  serif: require('@expo-google-fonts/playfair-display/700Bold/PlayfairDisplay_700Bold.ttf'),
  sans: require('@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf'),
};
const typefaces = new Map<FontId, Promise<SkTypeface | null>>();

export function loadTypeface(id: FontId): Promise<SkTypeface | null> {
  let p = typefaces.get(id);
  if (!p) {
    p = (async () => {
      const asset = Asset.fromModule(FONT_MODULES[id]);
      await asset.downloadAsync();
      const data = await Skia.Data.fromURI(asset.localUri ?? asset.uri);
      return Skia.Typeface.MakeFreeTypeFaceFromData(data);
    })().catch(() => null);
    typefaces.set(id, p);
  }
  return p;
}

// ---------- composition ----------

export interface ComposeOptions {
  layout: Layout;
  ink: string;              // css hex
  background: string | null; // null = transparent
  font: FontId;
}

/** Draw design + frame + text onto one canvas and return a base64 PNG. */
export async function compose(design: RGBAImage, o: ComposeOptions): Promise<string> {
  const { layout } = o;
  const W = Math.round(layout.width), H = Math.round(layout.height);
  const surface = Skia.Surface.Make(W, H);
  if (!surface) throw new Error('Could not create drawing surface.');
  const canvas = surface.getCanvas();
  canvas.clear(Skia.Color(o.background ?? 'transparent'));

  const img = toSkImage(design);
  const d = layout.design;
  canvas.drawImageRectOptions(
    img,
    Skia.XYWHRect(0, 0, design.width, design.height),
    Skia.XYWHRect(d.x, d.y, d.size, d.size),
    FilterMode.Linear, MipmapMode.Linear, Skia.Paint(),
  );

  if (layout.frame) {
    const path = Skia.Path.MakeFromSVGString(layout.frame.path);
    if (path) {
      const k = layout.frame.area.size / 100;
      const paint = Skia.Paint();
      paint.setColor(Skia.Color(o.ink));
      paint.setStyle(PaintStyle.Stroke);
      paint.setStrokeWidth(layout.frame.stroke / k);
      paint.setStrokeJoin(StrokeJoin.Round);
      paint.setAntiAlias(true);
      canvas.save();
      canvas.translate(layout.frame.area.x, layout.frame.area.y);
      canvas.scale(k, k);
      canvas.drawPath(path, paint);
      canvas.restore();
    }
  }

  if (layout.text) {
    const tf = await loadTypeface(o.font);
    const font = Skia.Font(tf ?? undefined, layout.text.fontSize);
    const paint = Skia.Paint();
    paint.setColor(Skia.Color(o.ink));
    paint.setAntiAlias(true);
    const width = font.measureText(layout.text.value).width;
    canvas.drawText(layout.text.value, layout.text.x - width / 2, layout.text.y + layout.text.fontSize * 0.35, paint, font);
  }

  surface.flush();
  const snap = surface.makeImageSnapshot();
  return snap.encodeToBase64(ImageFormat.PNG, 100);
}
