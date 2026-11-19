import { useState } from 'react';
import { Platform, Text } from 'react-native';
import { router } from 'expo-router';
import { Body, Button, Card, Screen, ToggleRow } from '../src/components/ui';
import { currentSettings, session } from '../src/state/session';
import { renderPng, renderSvg } from '../src/render';
import { resultMessage, saveFile, shareFile, type Kind } from '../src/storage/files';
import { space, useTheme } from '../src/theme';

type Job = `${'save' | 'share'}-${Kind}`;

export default function Export() {
  const t = useTheme();
  const [transparent, setTransparent] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const src = session.cropped;

  async function run(action: 'save' | 'share', kind: Kind) {
    if (!src) { router.replace('/'); return; }
    setJob(`${action}-${kind}`); setMsg(null);
    await new Promise((r) => setTimeout(r, 30)); // let the spinner paint
    try {
      const s = currentSettings();
      const content = kind === 'png' ? await renderPng(src, s, transparent) : renderSvg(src, s, transparent);
      const name = `noseprint-${Date.now()}`;
      const res = action === 'save' ? await saveFile(content, kind, name) : await shareFile(content, kind, name);
      setMsg(resultMessage(res, kind));
    } catch (e) {
      setMsg(`Something went wrong: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setJob(null);
    }
  }

  const H = ({ children }: { children: string }) => (
    <Text style={{ color: t.text, fontSize: 18, fontWeight: '700', marginBottom: space(1) }}>{children}</Text>
  );

  return (
    <Screen>
      <Card>
        <ToggleRow label="Transparent background" value={transparent} onChange={setTransparent} />
        <Body muted>Turn this off for a white (or dark, if inverted) background.</Body>
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <H>PNG · high resolution</H>
        <Body muted>{src ? `${src.width} × ${src.height} px` : ''}. Best for printing, phones and social media.</Body>
        <Button label="Download PNG" icon="⬇" onPress={() => run('save', 'png')} loading={job === 'save-png'} disabled={!!job} style={{ marginTop: space(3) }} />
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <H>SVG · vector for tattoo artists</H>
        <Body muted>Scales to any size without blurring. Opens in Illustrator, Inkscape, Procreate and stencil printers.</Body>
        <Button
          label={Platform.OS === 'web' ? 'Download SVG' : 'Save SVG to Files…'}
          icon="✒"
          variant="secondary"
          onPress={() => run('save', 'svg')}
          loading={job === 'save-svg'}
          disabled={!!job}
          style={{ marginTop: space(3) }}
        />
      </Card>

      <Card style={{ marginTop: space(4) }}>
        <H>Share</H>
        <Body muted>Send to your tattoo artist through WhatsApp, Messenger, email and more.</Body>
        <Button label="Share PNG" icon="↗" variant="secondary" onPress={() => run('share', 'png')} loading={job === 'share-png'} disabled={!!job} style={{ marginTop: space(3) }} />
        <Button label="Share SVG" icon="↗" variant="ghost" onPress={() => run('share', 'svg')} loading={job === 'share-svg'} disabled={!!job} />
      </Card>

      {msg && <Text style={{ color: t.text, marginTop: space(4), textAlign: 'center' }}>{msg}</Text>}
    </Screen>
  );
}
