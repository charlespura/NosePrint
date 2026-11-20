import { Linking, Pressable, Text, View } from 'react-native';
import { Body, Card, Screen } from '../src/components/ui';
import { radius, space, useTheme } from '../src/theme';

const GITHUB = 'https://github.com/charlespura';

const PROJECTS: { title: string; emoji: string; desc: string; site?: string; repo: string }[] = [
  {
    title: 'Shadow & Aqua',
    emoji: '🐕',
    desc: 'Two dogs, one little world: a profile site for Shadow and Aqua.',
    site: 'https://charlespura.github.io/ShadowANDaquaWhiteProfiles/',
    repo: `${GITHUB}/ShadowANDaquaWhiteProfiles`,
  },
  {
    title: 'Dog Guide',
    emoji: '📖',
    desc: 'A world of dogs, understood. A guide to dogs and their care.',
    site: 'https://charlespura.github.io/DOG-GUIDE/',
    repo: `${GITHUB}/DOG-GUIDE`,
  },
  {
    title: 'PawAdopt',
    emoji: '🏠',
    desc: 'Dog adoption management system for shelters (Angular, Node.js, GraphQL, MySQL).',
    repo: `${GITHUB}/chDogAdoptionManagementSystem`,
  },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Card style={{ marginBottom: space(4) }}>
      <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', marginBottom: space(2) }}>{title}</Text>
      <View style={{ gap: space(1) }}>{children}</View>
    </Card>
  );
}

function LinkPill({ label, url, primary }: { label: string; url: string; primary?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      onPress={() => Linking.openURL(url)}
      style={({ pressed }) => ({
        minHeight: 44, paddingHorizontal: 16, borderRadius: radius.pill, justifyContent: 'center',
        borderWidth: 1.5, borderColor: primary ? t.accent : t.border,
        backgroundColor: primary ? t.accent : t.surface, opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: primary ? t.accentText : t.text, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

function ProjectCard({ p }: { p: (typeof PROJECTS)[number] }) {
  const t = useTheme();
  return (
    <View style={{ borderWidth: 1, borderColor: t.border, borderRadius: radius.md, padding: space(3), backgroundColor: t.bg, gap: space(2) }}>
      <Text style={{ color: t.text, fontSize: 16, fontWeight: '700' }}>{p.emoji}  {p.title}</Text>
      <Body muted>{p.desc}</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {p.site && <LinkPill label="Open site ↗" url={p.site} />}
        <LinkPill label="⭐ Star on GitHub" url={p.repo} primary />
      </View>
    </View>
  );
}

export default function About() {
  const t = useTheme();
  return (
    <Screen>
      <Section title="📸 Taking a good nose photo">
        <Body>• Use bright, indirect daylight. Avoid a direct flash, which hides the ridges.</Body>
        <Body>• Get close so the nose fills most of the frame.</Body>
        <Body>• Tap the screen to focus on the nose. The texture should look crisp.</Body>
        <Body>• A treat held just above the camera helps keep your dog still.</Body>
        <Body>• Take a few shots and pick the sharpest one.</Body>
      </Section>
      <Section title="🎛 Tuning the design">
        <Body>Detail picks up more or fewer creases. Smoothness reduces noise. Contrast helps with flat or dim photos.</Body>
      </Section>
      <Section title="🔒 Privacy">
        <Body>NosePrint has no accounts, no ads, and no servers. All processing happens on this device, and your photos never leave it unless you share them.</Body>
      </Section>

      <Section title="🐾 More from the developer">
        <Body muted>If you like NosePrint, check out these other dog projects. A ⭐ on GitHub helps a lot!</Body>
        <View style={{ gap: space(3), marginTop: space(2) }}>
          {PROJECTS.map((p) => <ProjectCard key={p.repo} p={p} />)}
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Follow charlespura on GitHub"
          onPress={() => Linking.openURL(GITHUB)}
          style={({ pressed }) => ({
            marginTop: space(4), minHeight: 54, borderRadius: radius.md, flexDirection: 'row',
            alignItems: 'center', justifyContent: 'center', gap: 10,
            backgroundColor: t.text, opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ color: t.bg, fontSize: 17, fontWeight: '700' }}>Follow @charlespura on GitHub ↗</Text>
        </Pressable>
      </Section>
      <Pressable
        accessibilityRole="link"
        onPress={() => Linking.openURL('https://charlespura.github.io/NosePrint/privacy.html')}
        style={{ marginTop: space(4), paddingVertical: space(2), alignItems: 'center' }}
      >
        <Text style={{ color: t.textMuted ?? t.text, textDecorationLine: 'underline' }}>Privacy Policy</Text>
      </Pressable>
    </Screen>
  );
}
