import { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Body, Button } from '../components/ui';
import { resetSession, session } from '../state/session';
import { space, useTheme } from '../theme';
import { APK_URL } from '../config';

function notify(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(`${title}\n\n${msg}`);
  else Alert.alert(title, msg);
}

/** Web only: the Android APK download link (GitHub Releases). Hidden inside the app itself. */
const apkUrl = Platform.OS === 'web' ? APK_URL : null;

export default function Home() {
  const t = useTheme();
  const [busy, setBusy] = useState<'camera' | 'gallery' | null>(null);

  async function pick(source: 'camera' | 'gallery') {
    setBusy(source);
    try {
      if (source === 'camera' && Platform.OS !== 'web') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          notify('Camera access needed', 'Allow camera access in Settings, or choose a photo from your gallery instead.');
          return;
        }
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };
      const res = source === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);
      if (res.canceled || !res.assets?.[0]) return;
      resetSession();
      session.sourceUri = res.assets[0].uri;
      router.push('/crop');
    } catch (e) {
      notify('Something went wrong', e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={styles.wrap}>
        <View style={styles.hero}>
          <Image source={require('../../assets/icon.png')} style={styles.logo} accessibilityIgnoresInvertColors />
          <Text style={[styles.title, { color: t.text }]}>NosePrint</Text>
          <Body muted>Turn your dog's one-of-a-kind nose into tattoo-ready line art.</Body>
        </View>
        <View style={{ gap: space(3) }}>
          <Button icon="📷" label="Take Photo" onPress={() => pick('camera')} loading={busy === 'camera'} disabled={!!busy} />
          <Button icon="🖼" label="Choose from Gallery" variant="secondary" onPress={() => pick('gallery')} loading={busy === 'gallery'} disabled={!!busy} />
          <Button icon="♡" label="My Designs" variant="secondary" onPress={() => router.push('/designs')} />
          {apkUrl && <Button icon="🤖" label="Download Android app (APK)" variant="ghost" onPress={() => window.open(apkUrl, '_blank', 'noopener')} />}
          <Button label="Help, tips & more projects" variant="ghost" onPress={() => router.push('/about')} />
          <Text style={[styles.privacy, { color: t.textMuted }]}>🔒 Works offline. Your photos never leave this device.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', padding: space(6), justifyContent: 'space-between' },
  hero: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: space(3) },
  logo: { width: 112, height: 112, borderRadius: 28 },
  title: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  privacy: { textAlign: 'center', fontSize: 13, marginTop: space(2) },
});
