/* Web-only marketing demo: refs are read in event/animation handlers, not during render. */
/* eslint-disable react-hooks/refs, react-hooks/preserve-manual-memoization */
// Clickable, narrated story demo of the app (web only). Everything is driven by one
// clock (`t` ms into the current scene) so pause / seek / replay stay perfectly in sync.
import { useCallback, useEffect, useRef, useState } from 'react';
import { FRAMES } from '../processing/layout';
import { BASE_URL } from '../config';

const A = (f: string) => `${BASE_URL}/demo/${f}`;
export const DEMO_DOG_NAME = 'Shadow';

const STYLES = ['sketch', 'fineline', 'stencil', 'dotwork', 'bold'] as const;
const STYLE_LABEL: Record<(typeof STYLES)[number], string> = {
  sketch: 'Sketch', fineline: 'Fineline', stencil: 'Stencil', dotwork: 'Dotwork', bold: 'Bold',
};

export const SCENES = [
  { title: 'Snap', header: 'Camera', base: 6500, caption: 'One close-up photo of the nose. Good light, nice and sharp.' },
  { title: 'Crop', header: 'Crop the nose', base: 5500, caption: 'Drag and zoom until the nose fills the circle.' },
  { title: 'Style', header: 'Design', base: 9000, caption: 'Every crease is traced from the real photo. Pick the look you love.' },
  { title: 'Make it theirs', header: 'Design', base: 6500, caption: 'Add a frame, their name and a date.' },
  { title: 'Export', header: 'Export', base: 7500, caption: 'A PNG for your phone, an SVG your tattoo artist can scale to any size.' },
] as const;

// ---- tiny animation helpers ----
const clamp = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => { const x = clamp(v); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const prog = (t: number, start: number, dur: number) => ease((t - start) / dur);
const pulse = (t: number, at: number, len: number) => (t >= at && t <= at + len ? Math.sin(((t - at) / len) * Math.PI) : 0);

// ---- geometry of the phone screen (CSS px) ----
const SW = 300;
const ART = { x: 20, y: 104, size: 260 };
const HEART = FRAMES.heart;
const HEART_SCALE = 0.56;
const ART_CY = ART.y + ART.size / 2;
const FRAME_SIZE = (ART.size * HEART_SCALE) / ((HEART.design.r * 2) / 100);
const HEART_TARGET_CY = 214;
const FRAME_TOP = HEART_TARGET_CY - (HEART.design.cy / 100) * FRAME_SIZE;

// Dev aid: ?demo=<scene>&t=<ms> freezes the phone on one frame (used for screenshots).
const PREVIEW = (() => {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);
  return q.has('demo') ? { scene: Number(q.get('demo')), t: Number(q.get('t') ?? 0) } : null;
})();

interface Voice { el: HTMLAudioElement; ok: boolean; dur: number }

export function DemoPlayer({ onTry }: { onTry: () => void }) {
  const [pv, setPv] = useState(PREVIEW);
  useEffect(() => {
    if (!PREVIEW) return;
    (window as unknown as { __demoFrame: (s: number, t: number) => void }).__demoFrame = (s, t) => setPv({ scene: s, t });
  }, []);
  const [scene, setScene] = useState(0);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const voices = useRef<Voice[]>([]);
  const raf = useRef(0);
  const clock = useRef({ scene: 0, t: 0, last: 0 });

  // Optional narration: public/demo/voice/step-1.mp3 … step-5.mp3 (your own recordings).
  useEffect(() => {
    voices.current = SCENES.map((_, i) => {
      const el = new Audio(A(`voice/step-${i + 1}.mp3`));
      el.preload = 'auto';
      const v: Voice = { el, ok: false, dur: 0 };
      el.addEventListener('loadedmetadata', () => { v.ok = true; v.dur = el.duration * 1000; setVoiceAvailable(true); });
      return v;
    });
    return () => voices.current.forEach((v) => v.el.pause());
  }, []);

  const duration = useCallback((i: number) => {
    const v = voices.current[i];
    return Math.max(SCENES[i].base, v?.ok && voiceOn ? v.dur + 900 : 0);
  }, [voiceOn]);

  const playVoice = useCallback((i: number, from: number) => {
    voices.current.forEach((v, k) => { if (k !== i) v.el.pause(); });
    const v = voices.current[i];
    if (!v?.ok || !voiceOn) return;
    v.el.currentTime = Math.min(from / 1000, v.el.duration || 0);
    v.el.play().catch(() => {});
  }, [voiceOn]);

  const goTo = useCallback((i: number, keepPlaying = true) => {
    clock.current = { scene: i, t: 0, last: performance.now() };
    setScene(i); setT(0); setEnded(false); setStarted(true);
    if (keepPlaying) { setPlaying(true); playVoice(i, 0); }
  }, [playVoice]);

  // main clock
  useEffect(() => {
    if (!playing) return;
    clock.current.last = performance.now();
    const tick = (now: number) => {
      const c = clock.current;
      c.t += now - c.last;
      c.last = now;
      if (c.t >= duration(c.scene)) {
        if (c.scene < SCENES.length - 1) {
          c.scene += 1; c.t = 0;
          setScene(c.scene);
          playVoice(c.scene, 0);
        } else {
          c.t = duration(c.scene);
          setT(c.t); setPlaying(false); setEnded(true);
          return;
        }
      }
      setT(c.t);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, duration, playVoice]);

  function toggle() {
    if (ended) { goTo(0); return; }
    if (!started) { goTo(0); return; }
    if (playing) { setPlaying(false); voices.current.forEach((v) => v.el.pause()); }
    else { setPlaying(true); playVoice(clock.current.scene, clock.current.t); }
  }

  function toggleVoice() {
    setVoiceOn((on) => {
      if (on) voices.current.forEach((v) => v.el.pause());
      else if (playing) setTimeout(() => playVoice(clock.current.scene, clock.current.t), 0);
      return !on;
    });
  }

  // keyboard: space = play/pause, arrows = steps
  const rootRef = useRef<HTMLDivElement>(null);
  function onKey(e: React.KeyboardEvent) {
    if (e.key === ' ') { e.preventDefault(); toggle(); }
    if (e.key === 'ArrowRight' && scene < SCENES.length - 1) goTo(scene + 1);
    if (e.key === 'ArrowLeft' && scene > 0) goTo(scene - 1);
  }

  const total = duration(scene);
  return (
    <div className={`demo ${PREVIEW ? 'render' : ''}`} ref={rootRef} tabIndex={0} onKeyDown={onKey} aria-label="Interactive demo of NosePrint">
      <div className="demo-stage">
        <div className="phone" aria-hidden>
          <div className="phone-notch" />
          {started ? <Screen scene={scene} t={t} /> : <Screen scene={pv?.scene ?? 3} t={pv?.t ?? 6000} />}
          {!started && !PREVIEW && (
            <button className="poster" onClick={toggle} aria-label="Play the demo">
              <span className="poster-play">▶</span>
              <span className="poster-text">Watch how it works</span>
              <span className="poster-sub">40 seconds · tap to play</span>
            </button>
          )}
          {ended && (
            <div className="endcard">
              <p className="endcard-kicker">That&apos;s it.</p>
              <p className="endcard-title">Now try it with your dog.</p>
              <button className="btn btn-primary" onClick={onTry}>Open NosePrint</button>
              <button className="btn btn-ghost" onClick={() => goTo(0)}>↺ Watch again</button>
            </div>
          )}
        </div>
      </div>

      <div className="demo-side">
        <div className="bars" role="tablist" aria-label="Demo steps">
          {SCENES.map((s, i) => (
            <button
              key={s.title}
              role="tab"
              aria-selected={i === scene}
              className={`bar ${i === scene ? 'is-on' : ''}`}
              onClick={() => goTo(i)}
            >
              <span className="bar-track">
                <span className="bar-fill" style={{ transform: `scaleX(${i < scene ? 1 : i === scene && started ? clamp(t / total) : 0})` }} />
              </span>
              <span className="bar-label"><b>{i + 1}</b> {s.title}</span>
            </button>
          ))}
        </div>
        <p className="caption" key={scene} aria-live="polite">{SCENES[scene].caption}</p>
        <div className="demo-controls">
          <button className="ctl" onClick={() => scene > 0 && goTo(scene - 1)} disabled={scene === 0} aria-label="Previous step">←</button>
          <button className="ctl ctl-main" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '❚❚' : ended ? '↺' : '▶'}</button>
          <button className="ctl" onClick={() => scene < SCENES.length - 1 && goTo(scene + 1)} disabled={scene === SCENES.length - 1} aria-label="Next step">→</button>
          {voiceAvailable && (
            <button className="ctl" onClick={toggleVoice} aria-label={voiceOn ? 'Mute narration' : 'Unmute narration'}>{voiceOn ? '🔊' : '🔇'}</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- the phone screen ----------------

interface ArtState { x: number; y: number; s: number; blur: number }
const END = 1e9;
function artState(scene: number, t: number): ArtState {
  if (scene === 0) { const f = prog(t, 0, 1800); return { x: 0, y: 0, s: 1.55 - 0.55 * f, blur: (1 - f) * 7 }; }
  if (scene === 1) { const f = prog(t, 300, 2200); return { x: (1 - f) * 18, y: (1 - f) * -12, s: 1.18 - 0.18 * f, blur: 0 }; }
  if (scene === 2) return { x: 0, y: 0, s: 1, blur: 0 };
  return { x: 0, y: HEART_TARGET_CY - ART_CY, s: HEART_SCALE, blur: 0 };
}
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
function mixHex(a: string, b: string, k: number) {
  const p = (h: string, i: number) => parseInt(h.slice(1 + i * 2, 3 + i * 2), 16);
  return '#' + [0, 1, 2].map((i) => Math.round(lerp(p(a, i), p(b, i), k)).toString(16).padStart(2, '0')).join('');
}
/** 0→1→0 envelope: fades in at `a`, out at `b` (ms), each over `f` ms. */
const env = (t: number, a: number, b: number, f = 280) => Math.min(clamp((t - a) / f), clamp((b - t) / f));

const ORDER = ['sketch', 'fineline', 'stencil', 'dotwork', 'bold', 'sketch'] as const;
const SWITCH0 = 3000, SWITCH_EVERY = 1150, FADE = 450;

/** Everything is a pure function of (scene, t), so live playback, pausing and frame-by-frame video export match. */
function Screen({ scene, t }: { scene: number; t: number }) {
  // shared "art" element: morphs from the previous scene's end state over 900 ms
  const to = artState(scene, t);
  const k = scene > 0 ? ease(t / 900) : 1;
  const from = scene > 0 ? artState(scene - 1, END) : to;
  const a = { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k), s: lerp(from.s, to.s, k), blur: lerp(from.blur, to.blur, k) };
  const artTransform = `translate(${a.x}px, ${a.y}px) scale(${a.s})`;
  const artFilter = a.blur > 0.05 ? `blur(${a.blur}px)` : 'none';

  // style layers with time-based cross-fades
  const reveal = scene < 2 ? 0 : scene === 2 ? prog(t, 500, 1900) : 1;
  const photoOpacity = scene < 2 ? 1 : scene === 2 ? 1 - prog(t, 2500, 500) : 0;
  const idx = scene === 2 && t > SWITCH0 ? Math.min(ORDER.length - 1, Math.floor((t - SWITCH0) / SWITCH_EVERY)) : 0;
  const current = scene === 2 ? ORDER[idx] : 'sketch';
  const prev = idx > 0 ? ORDER[idx - 1] : null;
  const fadeK = idx > 0 ? clamp((t - (SWITCH0 + idx * SWITCH_EVERY)) / FADE) : 1;
  const sepiaK = scene === 3 ? prog(t, 4300, FADE) : scene > 3 ? 1 : 0;
  const styleOpacity = (s: string) => {
    let o = s === current ? fadeK : s === prev && prev !== current ? 1 - fadeK : 0;
    if (s === 'sketch' && current === 'sketch' && prev === 'bold') o = fadeK;
    return o * (1 - sepiaK);
  };
  const inkColor = mixHex('#111111', '#5E3C28', sepiaK);

  // group transform for export scene
  const groupT = scene === 4 ? `scale(${1 - 0.3 * prog(t, 0, 700)})` : 'none';
  const uiIn = prog(t, 0, 380);

  return (
    <div className={`screen ${scene === 0 ? 'dark' : ''}`}>
      <div className="statusbar"><span>9:41</span><span>●●● ▮</span></div>
      <div className="appbar"><span className="appbar-back">‹</span><span key={scene} className="appbar-title">{SCENES[scene].header}</span></div>

      <div className="group" style={{ transform: groupT }}>
        <div
          className="art"
          style={{ left: ART.x, top: ART.y, width: ART.size, height: ART.size, transform: artTransform, filter: artFilter }}
        >
          <img src={A('nose-photo.png')} alt="" className="layer" style={{ opacity: photoOpacity }} />
          <div className="layer paper" style={{ clipPath: `inset(0 ${100 - reveal * 100}% 0 0)`, opacity: scene < 2 ? 0 : 1 }}>
            {STYLES.map((s) => (
              <img key={s} src={A(`nose-${s}.png`)} alt="" className="layer" style={{ opacity: styleOpacity(s) }} />
            ))}
            <img src={A('nose-sketch-sepia.png')} alt="" className="layer" style={{ opacity: sepiaK }} />
          </div>
          {scene === 2 && reveal > 0 && reveal < 1 && <div className="scanline" style={{ left: `${reveal * 100}%` }} />}
        </div>

        {scene >= 3 && <HeartAndName scene={scene} t={t} ink={inkColor} />}
      </div>

      <div className="ui" style={{ opacity: uiIn, transform: `translateY(${(1 - uiIn) * 10}px)` }}>
        {scene === 0 && <CameraUI t={t} />}
        {scene === 1 && <CropUI t={t} />}
        {scene === 2 && <StyleUI t={t} current={current} />}
        {scene === 3 && <PersonaliseUI t={t} sepia={sepiaK > 0.5} />}
        {scene === 4 && <ExportUI t={t} />}
      </div>
    </div>
  );
}

function CameraUI({ t }: { t: number }) {
  const focus = prog(t, 900, 700);
  const flash = pulse(t, 3000, 420);
  const shutter = t > 2900 && t < 3150;
  const sharp = t > 3500;
  return (
    <>
      <div className="vignette" />
      <div className="brackets" style={{ transform: `scale(${1.12 - 0.12 * focus})`, opacity: 0.4 + 0.6 * focus }}>
        <i /><i /><i /><i />
      </div>
      <div className="hint" style={{ opacity: env(t, 3500, 1e9), transform: `translate(-50%, ${(1 - env(t, 3500, 1e9)) * 8}px)` }}>✓ Nice and sharp</div>
      <div className="shutter-row">
        <span className="thumb" style={{ opacity: sharp ? 1 : 0, backgroundImage: `url(${A('nose-photo.png')})` }} />
        <span className="shutter" style={{ transform: `scale(${shutter ? 0.86 : 1})` }} />
        <span className="thumb ghost" />
      </div>
      <Finger x={150} y={548} at={2750} t={t} />
      <div className="flash" style={{ opacity: flash }} />
    </>
  );
}

function CropUI({ t }: { t: number }) {
  const f = prog(t, 300, 2200);
  const cont = t > 3800;
  return (
    <>
      <div className="cropmask" style={{ left: ART.x, top: ART.y, width: ART.size, height: ART.size }} />
      <Finger x={190 - 40 * f} y={300 - 30 * f} at={250} hold={2300} t={t} />
      <div className="sheet-lite">
        <div className="seg"><span className="on">◯ Circle</span><span>▢ Square</span></div>
        <div className="slider"><span className="slider-label">Zoom</span><span className="track"><span className="knob" style={{ left: `${30 + 25 * f}%` }} /></span></div>
        <div className={`cta ${cont ? 'pressed' : ''}`}>Continue</div>
      </div>
      <Finger x={150} y={560} at={3650} t={t} />
    </>
  );
}

function StyleUI({ t, current }: { t: number; current: string }) {
  const knob = 40 + 18 * Math.sin(Math.max(0, t - 2600) / 900);
  return (
    <div className="sheet-lite">
      <div className="slider"><span className="slider-label">Detail</span><span className="track"><span className="knob" style={{ left: `${knob}%` }} /></span></div>
      <div className="chips">
        {STYLES.map((s) => <span key={s} className={`chip ${current === s ? 'on' : ''}`}>{STYLE_LABEL[s]}</span>)}
      </div>
    </div>
  );
}

function HeartAndName({ scene, t, ink }: { scene: number; t: number; ink: string }) {
  const draw = scene === 3 ? prog(t, 250, 1500) : 1;
  const chars = scene === 3 ? Math.max(0, Math.floor((t - 1700) / 95)) : 99;
  const dateIn = scene === 3 ? prog(t, 2500, 600) : 1;
  const name = DEMO_DOG_NAME.slice(0, chars);
  return (
    <>
      <svg
        className="heart"
        viewBox="0 0 100 100"
        style={{ left: (SW - FRAME_SIZE) / 2, top: FRAME_TOP, width: FRAME_SIZE, height: FRAME_SIZE }}
      >
        <path d={HEART.path} fill="none" stroke={ink} strokeWidth={1.6} strokeLinejoin="round" pathLength={1}
          strokeDasharray={1} strokeDashoffset={1 - draw} style={{ transition: 'stroke 400ms' }} />
      </svg>
      <div className="name" style={{ top: FRAME_TOP + FRAME_SIZE * 0.93, color: ink }}>
        {name}<span className="caret" style={{ opacity: scene === 3 && chars < DEMO_DOG_NAME.length + 3 && chars > 0 ? 1 : 0 }}>|</span>
      </div>
      <div className="date" style={{ top: FRAME_TOP + FRAME_SIZE * 0.93 + 40, opacity: dateIn, color: ink }}>2019 – forever</div>
    </>
  );
}

function PersonaliseUI({ t, sepia }: { t: number; sepia: boolean }) {
  return (
    <div className="sheet-lite">
      <div className="chips">
        <span className="chip">None</span><span className="chip on">♡ Heart</span><span className="chip">🐾 Paw</span><span className="chip">◯</span>
      </div>
      <div className="chips">
        <span className={`chip ${!sepia ? 'on' : ''}`}><i className="sw" style={{ background: '#111' }} />Black</span>
        <span className={`chip ${sepia ? 'on' : ''}`}><i className="sw" style={{ background: '#5E3C28' }} />Sepia</span>
        <span className="chip"><i className="sw" style={{ background: '#1C2A54' }} />Navy</span>
      </div>
      <Finger x={130} y={555} at={4050} t={t} />
    </div>
  );
}

function ExportUI({ t }: { t: number }) {
  const up = prog(t, 150, 650);
  const toast1 = env(t, 2350, 4300);
  const toast2 = env(t, 4850, 1e9);
  return (
    <>
      <div className="sheet" style={{ transform: `translateY(${(1 - up) * 105}%)` }}>
        <div className={`cta ${t > 2050 && t < 2400 ? 'pressed' : ''}`}>↓ Download PNG</div>
        <div className={`cta alt ${t > 4550 && t < 4900 ? 'pressed' : ''}`}>✒ SVG for your artist</div>
        <div className="cta ghost">↗ Share</div>
      </div>
      <Finger x={150} y={474} at={1900} t={t} />
      <Finger x={150} y={530} at={4400} t={t} />
      <div className="toast" style={{ opacity: toast1, transform: `translate(-50%, ${(1 - toast1) * -12}px)` }}>✓ Saved to Photos</div>
      <div className="toast" style={{ opacity: toast2, transform: `translate(-50%, ${(1 - toast2) * -12}px)` }}>✓ Ready to send to your artist</div>
    </>
  );
}

/** A soft "finger" that appears, taps (ripple) and disappears. `hold` = drag duration. */
function Finger({ x, y, at, t, hold = 0 }: { x: number; y: number; at: number; t: number; hold?: number }) {
  const life = 650 + hold;
  if (t < at - 250 || t > at + life) return null;
  const inOut = Math.min(clamp((t - (at - 250)) / 250), clamp((at + life - t) / 250));
  const ripple = clamp((t - at) / 500);
  return (
    <span className="finger" style={{ left: x, top: y, opacity: inOut }}>
      <span className="ripple" style={{ transform: `scale(${0.4 + ripple * 1.6})`, opacity: t >= at ? 1 - ripple : 0 }} />
    </span>
  );
}
