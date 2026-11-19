import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Body, Button, Card, Screen, Segmented, SliderRow } from '../src/components/ui';
import { session } from '../src/state/session';
import { getImageIO } from '../src/skia';
import { crop, resizeToMax } from '../src/processing/core';
import type { Shape } from '../src/processing/pipeline';
import { radius, space, useTheme } from '../src/theme';

const MIN_SIDE = 200;

export default function Crop() {
  const t = useTheme();
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [box, setBox] = useState(300);
  const [zoom, setZoom] = useState(1.5);
  const [center, setCenter] = useState({ x: 0.5, y: 0.5 }); // normalized
  const [shape, setShape] = useState<Shape>(session.shape);
  const [tips, setTips] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const uri = session.sourceUri;
    if (!uri) { router.replace('/'); return; }
    getImageIO()
      .then((io) => io.decodeUri(uri))
      .then((img) => {
        if (Math.min(img.width, img.height) < MIN_SIDE) {
          setError(`This photo is too small (${img.width}×${img.height}). Use one at least ${MIN_SIDE}px on each side.`);
          return;
        }
        session.source = img;
        setSize({ w: img.width, h: img.height });
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not open this photo.'));
  }, []);

  // crop square side in source pixels, and its clamped top-left
  const geom = useMemo(() => {
    if (!size) return null;
    const side = Math.min(size.w, size.h) / zoom;
    const cx = Math.min(Math.max(center.x * size.w, side / 2), size.w - side / 2);
    const cy = Math.min(Math.max(center.y * size.h, side / 2), size.h - side / 2);
    return { side, x: cx - side / 2, y: cy - side / 2, scale: box / side };
  }, [size, zoom, center, box]);

  const geomRef = useRef(geom);
  geomRef.current = geom;
  const start = useRef({ x: 0.5, y: 0.5 });
  const centerRef = useRef(center);
  centerRef.current = center;

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { start.current = centerRef.current; },
    onPanResponderMove: (_e, g) => {
      const gm = geomRef.current;
      if (!gm || !session.source) return;
      const dx = -g.dx / gm.scale / session.source.width;
      const dy = -g.dy / gm.scale / session.source.height;
      setCenter({
        x: Math.min(1, Math.max(0, start.current.x + dx)),
        y: Math.min(1, Math.max(0, start.current.y + dy)),
      });
    },
  }), []);

  function onLayout(e: LayoutChangeEvent) {
    setBox(Math.min(e.nativeEvent.layout.width, 480));
  }

  function next() {
    if (!geom || !session.source) return;
    setBusy(true);
    setTimeout(() => {
      const c = crop(session.source!, geom.x, geom.y, geom.side, geom.side);
      session.cropped = resizeToMax(c, 2048);
      session.shape = shape;
      setBusy(false);
      router.push('/editor');
    }, 16);
  }

  if (error) {
    return (
      <Screen>
        <Card><Body>{error}</Body></Card>
        <Button label="Pick another photo" onPress={() => router.back()} style={{ marginTop: space(4) }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View onLayout={onLayout} style={{ alignItems: 'center' }}>
        <View
          {...pan.panHandlers}
          style={[styles.frame, { width: box, height: box, borderRadius: shape === 'circle' ? box / 2 : radius.lg, backgroundColor: t.surfaceAlt }]}
        >
          {geom && session.sourceUri && size ? (
            <Image
              source={{ uri: session.sourceUri }}
              style={{
                position: 'absolute',
                width: size.w * geom.scale,
                height: size.h * geom.scale,
                left: -geom.x * geom.scale,
                top: -geom.y * geom.scale,
              }}
            />
          ) : <ActivityIndicator style={{ flex: 1 }} color={t.accent} />}
        </View>
        <Text style={{ color: t.textMuted, marginTop: space(2) }}>Drag to position · zoom with the slider</Text>
      </View>

      {tips && (
        <Card style={{ marginTop: space(4) }}>
          <Text style={{ color: t.text, fontWeight: '700', marginBottom: space(1) }}>📸 Tips for a great print</Text>
          <Body muted>• Bright, even daylight — no harsh flash{'\n'}• Get close so the nose fills the frame{'\n'}• Tap to focus; the ridges should look sharp</Body>
          <Button label="Got it" variant="ghost" onPress={() => setTips(false)} />
        </Card>
      )}

      <View style={{ marginTop: space(4) }}>
        <Segmented
          value={shape}
          onChange={setShape}
          options={[{ value: 'circle', label: '◯ Circle' }, { value: 'square', label: '▢ Square' }]}
        />
        <View style={{ height: space(4) }} />
        <SliderRow label="Zoom" value={zoom} min={1} max={5} step={0.05} onChange={setZoom} format={(v) => `${v.toFixed(1)}×`} />
        <Button label="Continue" onPress={next} disabled={!geom} loading={busy} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden' },
});
