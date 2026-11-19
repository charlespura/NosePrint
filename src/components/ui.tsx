import React from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View, ViewStyle,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, space, useTheme } from '../theme';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const t = useTheme();
  const inner = <View style={styles.inner}>{children}</View>;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: t.bg }}>
      {scroll ? <ScrollView contentContainerStyle={styles.scroll}>{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

type Variant = 'primary' | 'secondary' | 'ghost';

export function Button({
  label, onPress, variant = 'primary', disabled, loading, icon, style,
}: {
  label: string; onPress: () => void; variant?: Variant; disabled?: boolean;
  loading?: boolean; icon?: string; style?: ViewStyle;
}) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.accent : variant === 'secondary' ? t.surface : 'transparent';
  const fg = variant === 'primary' ? t.accentText : t.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, borderColor: variant === 'secondary' ? t.border : 'transparent' },
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : (
        <Text style={[styles.buttonText, { color: fg }]}>{icon ? `${icon}  ` : ''}{label}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }, style]}>{children}</View>;
}

export function SliderRow({
  label, value, min, max, step = 1, onChange, format,
}: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  const t = useTheme();
  return (
    <View style={{ marginBottom: space(3) }}>
      <View style={styles.rowBetween}>
        <Text style={[styles.label, { color: t.text }]}>{label}</Text>
        <Text style={[styles.value, { color: t.textMuted }]}>{format ? format(value) : Math.round(value)}</Text>
      </View>
      <Slider
        accessibilityLabel={label}
        style={{ height: 40 }}
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onChange}
        minimumTrackTintColor={t.accent}
        maximumTrackTintColor={t.border}
        thumbTintColor={t.accent}
      />
    </View>
  );
}

export function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <View style={[styles.rowBetween, { minHeight: 48 }]}>
      <Text style={[styles.label, { color: t.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: t.accent, false: t.border }} accessibilityLabel={label} />
    </View>
  );
}

export function Segmented<T extends string>({
  options, value, onChange,
}: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const t = useTheme();
  return (
    <View style={[styles.segment, { backgroundColor: t.surfaceAlt }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, active && { backgroundColor: t.surface }]}
          >
            <Text style={{ color: active ? t.text : t.textMuted, fontWeight: '600' }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Chips<T extends string>({
  options, value, onChange, swatches,
}: {
  options: { value: T; label: string }[]; value: T; onChange: (v: T) => void;
  swatches?: Partial<Record<T, string>>;
}) {
  const t = useTheme();
  return (
    <View style={styles.chips}>
      {options.map((o) => {
        const active = o.value === value;
        const sw = swatches?.[o.value];
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.chip, { borderColor: active ? t.accent : t.border, backgroundColor: active ? t.surfaceAlt : t.surface }]}
          >
            {sw && <View style={[styles.swatch, { backgroundColor: sw }]} />}
            <Text style={{ color: active ? t.text : t.textMuted, fontWeight: active ? '700' : '500' }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({
  label, value, onChange, placeholder, maxLength = 40,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, marginBottom: space(3) }}>
      <Text style={[styles.label, { color: t.text, marginBottom: space(1) }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={t.textMuted}
        maxLength={maxLength}
        accessibilityLabel={label}
        style={[styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.bg }]}
      />
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.section, { color: t.textMuted }]}>{children}</Text>;
}

export function H1({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={[styles.h1, { color: t.text }]}>{children}</Text>;
}
export function Body({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  const t = useTheme();
  return <Text style={[styles.body, { color: muted ? t.textMuted : t.text }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  inner: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center', padding: space(4) },
  button: {
    minHeight: 54, borderRadius: radius.md, paddingHorizontal: space(5),
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  buttonText: { fontSize: 17, fontWeight: '600' },
  card: { borderRadius: radius.lg, borderWidth: 1, padding: space(4) },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '600' },
  value: { fontSize: 14, fontVariant: ['tabular-nums'] },
  segment: { flexDirection: 'row', borderRadius: radius.md, padding: 4 },
  segmentItem: { flex: 1, minHeight: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 8 },
  swatch: { width: 16, height: 16, borderRadius: 8 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: 16 },
  section: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 10, marginTop: 4 },
  h1: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  body: { fontSize: 16, lineHeight: 23 },
});
