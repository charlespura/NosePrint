import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Body, Button } from '../src/components/ui';
import { deleteDesign, listDesigns, loadDesignSource, thumbUri, type SavedDesign } from '../src/storage/designs';
import { resetSession, session } from '../src/state/session';
import { radius, space, useTheme } from '../src/theme';

function confirm(title: string, msg: string): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(window.confirm(`${title}\n\n${msg}`));
  return new Promise((resolve) => Alert.alert(title, msg, [
    { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
    { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
  ]));
}

export default function Designs() {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<(SavedDesign & { thumb: string | null })[] | null>(null);
  const [opening, setOpening] = useState<string | null>(null);
  const cols = width > 900 ? 4 : width > 600 ? 3 : 2;

  const load = useCallback(() => {
    listDesigns()
      .then((list) => Promise.all(list.map(async (d) => ({ ...d, thumb: await thumbUri(d.id) }))))
      .then(setItems)
      .catch(() => setItems([]));
  }, []);
  useFocusEffect(load);

  async function open(d: SavedDesign) {
    setOpening(d.id);
    try {
      const img = await loadDesignSource(d.id);
      resetSession();
      Object.assign(session, { cropped: img, designId: d.id, params: d.params, shape: d.shape, frame: d.frame, text: d.text });
      router.push('/editor');
    } catch (e) {
      Alert.alert('Could not open', e instanceof Error ? e.message : String(e));
    } finally {
      setOpening(null);
    }
  }

  async function remove(d: SavedDesign) {
    if (!(await confirm('Delete design?', `"${d.title}" will be removed from this device.`))) return;
    await deleteDesign(d.id);
    load();
  }

  if (!items) return <ActivityIndicator style={{ flex: 1, backgroundColor: t.bg }} color={t.accent} />;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        key={cols}
        data={items}
        numColumns={cols}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        columnWrapperStyle={{ gap: space(3) }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 48 }}>🐾</Text>
            <Body muted>No saved designs yet. Create one and tap “Save to My Designs”.</Body>
            <Button label="Create a design" onPress={() => router.replace('/')} style={{ marginTop: space(4) }} />
          </View>
        }
        renderItem={({ item: d }) => (
          <View style={[styles.card, { flex: 1 / cols, backgroundColor: t.surface, borderColor: t.border }]}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Open ${d.title}`} onPress={() => open(d)}>
              <View style={[styles.thumb, { backgroundColor: t.canvas }]}>
                {d.thumb && <Image source={{ uri: d.thumb }} style={StyleSheet.absoluteFill} resizeMode="contain" />}
                {opening === d.id && <ActivityIndicator style={StyleSheet.absoluteFill} color={t.accent} />}
              </View>
              <Text numberOfLines={1} style={[styles.title, { color: t.text }]}>{d.title}</Text>
              <Text style={{ color: t.textMuted, fontSize: 12 }}>{new Date(d.updatedAt).toLocaleDateString()} · {d.params.style}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${d.title}`} onPress={() => remove(d)} style={styles.del} hitSlop={8}>
              <Text style={{ color: t.danger, fontWeight: '600' }}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: { padding: space(4), gap: space(3), width: '100%', maxWidth: 1000, alignSelf: 'center', flexGrow: 1 },
  card: { borderWidth: 1, borderRadius: radius.lg, padding: space(3) },
  thumb: { aspectRatio: 1, borderRadius: radius.md, overflow: 'hidden', marginBottom: space(2) },
  title: { fontSize: 15, fontWeight: '700' },
  del: { marginTop: space(2), minHeight: 36, justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space(8), gap: space(2) },
});
