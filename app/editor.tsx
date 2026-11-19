import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, GestureResponderEvent, Image, LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View,
} from 'react-native';
import { router } from 'expo-router';
import {
  Body, Button, Card, Chips, Field, Screen, SectionTitle, Segmented, SliderRow, ToggleRow,
} from '../src/components/ui';
import { currentSettings, session, type DesignSettings } from '../src/state/session';
import { getImageIO } from '../src/skia';
import { resizeToMax } from '../src/processing/core';
import { INK_COLORS, isLowContrast, PRESETS, type Ink, type Params, type Style } from '../src/processing/pipeline';
import { computeLayout, type FontId, type FrameId, type TextOptions } from '../src/processing/layout';
import { renderPng } from '../src/render';
import { resultMessage, saveFile } from '../src/storage/files';
import { saveDesign } from '../src/storage/designs';
import { radius, space, useTheme } from '../src/theme';

const PREVIEW_SIDE = 512;
const DEBOUNCE_MS = 150;
const HISTORY_GAP_MS = 600;
const PX_PER_CM = Platform.OS === 'web' ? 37.8 : 63; // CSS px / RN dp per centimetre (approx.)

const STYLES: { value: Style; label: string }[] = [
  { value: 'sketch', label: 'Sketch' }, { value: 'fineline', label: 'Fineline' },
  { value: 'stencil', label: 'Stencil' }, { value: 'dotwork', label: 'Dotwork' }, { value: 'bold', label: 'Bold' },
];
const INKS: { value: Ink; label: string }[] = [
  { value: 'black', label: 'Black' }, { value: 'sepia', label: 'Sepia' },
  { value: 'navy', label: 'Navy' }, { value: 'red', label: 'Red' },
];
const rgb = (c: number[]) => `rgb(${c.join(',')})`;
const SWATCHES = Object.fromEntries(INKS.map((i) => [i.value, rgb(INK_COLORS[i.value])])) as Record<Ink, string>;
const FRAMES: { value: FrameId; label: string }[] = [
  { value: 'none', label: 'None' }, { value: 'circle', label: '◯ Circle' },
  { value: 'heart', label: '♡ Heart' }, { value: 'paw', label: '🐾 Paw' },
];
const FONTS: { value: FontId; label: string }[] = [
  { value: 'script', label: 'Script' }, { value: 'serif', label: 'Serif' }, { value: 'sans', label: 'Sans' },
];

export default function Editor() {
  const t = useTheme();
  const [st, setSt] = useState<DesignSettings>(currentSettings);
  const [past, setPast] = useState<DesignSettings[]>([]);
  const [future, setFuture] = useState<DesignSettings[]>([]);
  const lastPush = useRef(0);
  const [art, setArt] = useState<string | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  const [view, setView] = useState<'after' | 'before'>('after');
  const [busy, setBusy] = useState(false);
  const [box, setBox] = useState(320);
  const [erasing, setErasing] = useState(false);
  const [brush, setBrush] = useState(14);
  const [realSize, setRealSize] = useState<number | null>(null);
  const [action, setAction] = useState<'png' | 'save' | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const work = useMemo(() => (session.cropped ? resizeToMax(session.cropped, PREVIEW_SIDE) : null), []);
  const lowContrast = useMemo(() => (work ? isLowContrast(work) : false), [work]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ----- state + history -----
  const update = useCallback((patch: Partial<DesignSettings> | ((prev: DesignSettings) => Partial<DesignSettings>)) => {
    setSt((prev) => {
      const now = Date.now();
      if (now - lastPush.current > HISTORY_GAP_MS) { setPast((p) => [...p.slice(-49), prev]); setFuture([]); }
      lastPush.current = now;
      return { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) };
    });
  }, []);
  const setP = <K extends keyof Params>(k: K) => (v: Params[K]) => update({ params: { ...st.params, [k]: v } });
  const setText = <K extends keyof TextOptions>(k: K) => (v: TextOptions[K]) => update({ text: { ...st.text, [k]: v } });
  const undo = () => { const prev = past[past.length - 1]; if (!prev) return; setFuture((f) => [st, ...f]); setPast((p) => p.slice(0, -1)); setSt(prev); lastPush.current = 0; };
  const redo = () => { const next = future[0]; if (!next) return; setPast((p) => [...p, st]); setFuture((f) => f.slice(1)); setSt(next); lastPush.current = 0; };

  // ----- rendering -----
  useEffect(() => {
    if (!work) { router.replace('/'); return; }
    getImageIO().then((io) => setOriginal(`data:image/png;base64,${io.encodePng(work)}`));
  }, [work]);

  useEffect(() => {
    if (!work) return;
    Object.assign(session, st);
    setBusy(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { setArt(`data:image/png;base64,${await renderPng(work, st, false)}`); } finally { setBusy(false); }
    }, DEBOUNCE_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [st, work]);

  // ----- eraser -----
  const layout = computeLayout(box, st.frame, st.text);
  const previewH = view === 'after' ? layout.height : box;
  function eraseAt(e: GestureResponderEvent) {
    const { locationX: lx, locationY: ly } = e.nativeEvent;
    const d = layout.design;
    const x = (lx - d.x) / d.size, y = (ly - d.y) / d.size;
    if (x < 0 || y < 0 || x > 1 || y > 1) return;
    const dot = [+x.toFixed(4), +y.toFixed(4), +(brush / d.size).toFixed(4)];
    update((prev) => ({ params: { ...prev.params, erase: [...prev.params.erase, ...dot] } }));
  }

  // ----- actions -----
  async function run(kind: 'png' | 'save') {
    if (!session.cropped) return;
    setAction(kind); setMsg(null);
    await new Promise((r) => setTimeout(r, 30)); // let the spinner paint
    try {
      if (kind === 'png') {
        const png = await renderPng(session.cropped, st, true);
        setMsg(resultMessage(await saveFile(png, 'png', `noseprint-${Date.now()}`), 'png'));
      } else {
        const rec = await saveDesign(session.cropped, st, session.designId);
        session.designId = rec.id;
        setMsg('✓ Saved to My Designs.');
      }
    } catch (e) {
      setMsg(`Something went wrong: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setAction(null);
    }
  }

  const circle = st.shape === 'circle' && st.frame === 'none' && !st.text.name && !st.text.date;
  const shown = view === 'after' ? art : original;
  const p = st.params;

  return (
    <Screen>
      <View onLayout={(e: LayoutChangeEvent) => setBox(Math.min(e.nativeEvent.layout.width, 480))} style={{ alignItems: 'center' }}>
        <View
          onStartShouldSetResponder={() => erasing && view === 'after'}
          onMoveShouldSetResponder={() => erasing && view === 'after'}
          onResponderGrant={eraseAt}
          onResponderMove={eraseAt}
          style={[styles.preview, {
            width: box, height: previewH, backgroundColor: t.canvas, borderColor: erasing ? t.accent : t.border,
            borderRadius: circle || view === 'before' ? (st.shape === 'circle' ? box / 2 : radius.lg) : radius.lg,
          }]}
        >
          {shown ? <Image source={{ uri: shown }} style={{ width: box, height: previewH }} accessibilityLabel={view === 'after' ? 'Tattoo preview' : 'Original photo'} /> : null}
          {busy && view === 'after' && <View style={styles.spinner}><ActivityIndicator color={t.accent} /></View>}
        </View>
      </View>

      <View style={styles.toolbar}>
        <View style={{ flex: 1 }}>
          <Segmented value={view} onChange={setView} options={[{ value: 'after', label: 'Tattoo' }, { value: 'before', label: 'Original' }]} />
        </View>
        <IconBtn label="Undo" glyph="↶" onPress={undo} disabled={!past.length} />
        <IconBtn label="Redo" glyph="↷" onPress={redo} disabled={!future.length} />
        <IconBtn label={erasing ? 'Stop erasing' : 'Eraser'} glyph="⌫" onPress={() => { setErasing(!erasing); setView('after'); }} active={erasing} />
      </View>

      {erasing && (
        <Card style={{ marginTop: space(3) }}>
          <Body muted>Drag on the preview to erase stray dots or fur.</Body>
          <SliderRow label="Brush size" value={brush} min={4} max={40} onChange={setBrush} />
          <Button label="Clear all erasing" variant="ghost" onPress={() => update({ params: { ...p, erase: [] } })} disabled={!p.erase.length} />
        </Card>
      )}

      {lowContrast && (
        <Card style={{ marginTop: space(3) }}>
          <Text style={{ color: t.text, fontWeight: '700' }}>Low-contrast photo</Text>
          <Body muted>Try raising Contrast, or retake the photo in brighter, indirect light.</Body>
        </Card>
      )}

      <Card style={{ marginTop: space(4) }}>
        <SectionTitle>PRESETS</SectionTitle>
        <View style={styles.chipRow}>
          {PRESETS.map((pr) => (
            <Button key={pr.name} label={pr.name} variant="secondary" onPress={() => update({ params: { ...p, ...pr.params } })} style={styles.preset} />
          ))}
        </View>
        <SectionTitle>STYLE</SectionTitle>
        <Chips options={STYLES} value={p.style} onChange={setP('style')} />
        <View style={{ height: space(4) }} />
        <SliderRow label="Detail" value={p.detail} min={0} max={100} onChange={setP('detail')} />
        <SliderRow label="Line thickness" value={p.thickness} min={1} max={6} step={0.5} onChange={setP('thickness')} format={(v) => v.toFixed(1)} />
        <SliderRow label="Smoothness" value={p.smoothness} min={0} max={5} step={0.25} onChange={setP('smoothness')} format={(v) => v.toFixed(1)} />
        <SliderRow label="Contrast" value={p.contrast} min={0} max={100} onChange={setP('contrast')} />
        {p.style !== 'fineline' && <SliderRow label="Shading" value={p.shading} min={0} max={100} onChange={setP('shading')} />}
        <SliderRow label="Edge fade" value={p.edgeFade} min={0} max={100} onChange={setP('edgeFade')} />
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <SectionTitle>INK</SectionTitle>
        <Chips options={INKS} value={p.ink} onChange={setP('ink')} swatches={SWATCHES} />
        <ToggleRow label="Invert (light ink on dark)" value={p.invert} onChange={setP('invert')} />
        <SectionTitle>FRAME</SectionTitle>
        <Chips options={FRAMES} value={st.frame} onChange={(v) => update({ frame: v })} />
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <SectionTitle>TEXT</SectionTitle>
        <View style={{ flexDirection: 'row', gap: space(3) }}>
          <Field label="Dog's name" value={st.text.name} onChange={setText('name')} placeholder="Max" maxLength={24} />
          <Field label="Date" value={st.text.date} onChange={setText('date')} placeholder="2015 – 2026" maxLength={24} />
        </View>
        <Chips options={FONTS} value={st.text.font} onChange={setText('font')} />
        <View style={{ height: space(3) }} />
        <Segmented value={st.text.position} onChange={setText('position')} options={[{ value: 'below', label: 'Below' }, { value: 'above', label: 'Above' }]} />
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <SectionTitle>REAL SIZE PREVIEW</SectionTitle>
        <Chips
          options={[{ value: '0', label: 'Off' }, { value: '3', label: '3 cm' }, { value: '5', label: '5 cm' }, { value: '8', label: '8 cm' }]}
          value={String(realSize ?? 0)}
          onChange={(v) => setRealSize(v === '0' ? null : Number(v))}
        />
        {realSize && art && (
          <View style={{ alignItems: 'center', marginTop: space(4) }}>
            <Image source={{ uri: art }} style={{ width: realSize * PX_PER_CM, height: (realSize * PX_PER_CM * layout.height) / layout.width }} />
            <Text style={{ color: t.textMuted, marginTop: space(2), fontSize: 13, textAlign: 'center' }}>
              Approximately {realSize} cm wide. Fine detail that disappears here may blur in ink — try Bold or thicker lines for small tattoos.
            </Text>
          </View>
        )}
      </Card>

      <View style={{ gap: space(3), marginTop: space(4) }}>
        <Button label="Download PNG" icon="⬇" onPress={() => run('png')} loading={action === 'png'} disabled={!art || !!action} />
        <Button label={session.designId ? 'Update in My Designs' : 'Save to My Designs'} icon="♡" variant="secondary" onPress={() => run('save')} loading={action === 'save'} disabled={!art || !!action} />
        {msg && <Text style={{ color: t.text, textAlign: 'center' }}>{msg}</Text>}
        <Button label="SVG, share & more" variant="ghost" onPress={() => router.push('/export')} disabled={!art} />
      </View>
    </Screen>
  );
}

function IconBtn({ label, glyph, onPress, disabled, active }: { label: string; glyph: string; onPress: () => void; disabled?: boolean; active?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      style={[styles.iconBtn, { backgroundColor: active ? t.accent : t.surfaceAlt, opacity: disabled ? 0.4 : 1 }]}
    >
      <Text style={{ fontSize: 20, color: active ? t.accentText : t.text }}>{glyph}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  preview: { overflow: 'hidden', borderWidth: 1 },
  spinner: { position: 'absolute', top: 12, right: 12 },
  toolbar: { flexDirection: 'row', gap: 8, marginTop: space(4), alignItems: 'center' },
  iconBtn: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space(4) },
  preset: { minHeight: 44, paddingHorizontal: 14 },
});
