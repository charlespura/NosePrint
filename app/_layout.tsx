import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme';
import { getImageIO } from '../src/skia';

export default function RootLayout() {
  const t = useTheme();
  useEffect(() => { getImageIO().catch(() => {}); }, []); // warm up Skia
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: t.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false, title: 'NosePrint' }} />
        <Stack.Screen name="start" options={{ headerShown: false, title: 'NosePrint' }} />
        <Stack.Screen name="crop" options={{ title: 'Crop the nose' }} />
        <Stack.Screen name="editor" options={{ title: 'Design' }} />
        <Stack.Screen name="export" options={{ title: 'Export' }} />
        <Stack.Screen name="designs" options={{ title: 'My Designs' }} />
        <Stack.Screen name="about" options={{ title: 'About & Help' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
