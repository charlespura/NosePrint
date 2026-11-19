// Web landing page. The app itself lives at /start (native builds open the app directly).
import { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useFonts as usePlayfair, PlayfairDisplay_600SemiBold_Italic, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { useFonts as useInter, Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts as useScript, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { APK_URL, BASE_URL, REPO_URL } from '../src/config';
import { DemoPlayer } from '../src/landing/DemoPlayer';
import { LANDING_CSS } from '../src/landing/styles';

const A = (f: string) => `${BASE_URL}/demo/${f}`;
const STYLES = [
  { id: 'sketch', name: 'Sketch', note: 'Engraved cells + soft stipple shading.' },
  { id: 'fineline', name: 'Fineline', note: 'Single delicate lines. Small and subtle.' },
  { id: 'stencil', name: 'Stencil', note: 'Clean outlines, ready for transfer paper.' },
  { id: 'dotwork', name: 'Dotwork', note: 'Built entirely from dots.' },
  { id: 'bold', name: 'Bold', note: 'Heavy blackwork that ages well.' },
] as const;

export default function Landing() {
  usePlayfair({ PlayfairDisplay_600SemiBold_Italic, PlayfairDisplay_700Bold });
  useInter({ Inter_400Regular, Inter_600SemiBold });
  useScript({ DancingScript_700Bold });
  const scroller = useRef<HTMLDivElement>(null);
  const openApp = () => router.push('/start');

  // reveal-on-scroll
  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }),
      { root, threshold: 0.15 },
    );
    root.querySelectorAll('.rv').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => { document.title = 'NosePrint · Your dog’s nose, as a tattoo'; }, []);

  const scrollTo = (id: string) => scroller.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="lp" ref={scroller}>
      <style>{LANDING_CSS}</style>

      <header className="nav">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); scroller.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <img src={`${BASE_URL}/demo/logo.png`} alt="" width={30} height={30} /> NosePrint
        </a>
        <nav>
          <button onClick={() => scrollTo('demo')}>How it works</button>
          <button onClick={() => scrollTo('styles')}>Styles</button>
          <button onClick={() => scrollTo('private')}>Privacy</button>
          <button className="btn btn-small btn-primary" onClick={openApp}>Open app</button>
        </nav>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-copy">
          <p className="kicker rise" style={{ animationDelay: '0ms' }}>Free · No account · Works offline</p>
          <h1 className="rise" style={{ animationDelay: '80ms' }}>
            No two noses <br />are the same. <em>Wear theirs.</em>
          </h1>
          <p className="lede rise" style={{ animationDelay: '160ms' }}>
            A dog’s nose print is as unique as a fingerprint. Take one close-up photo and NosePrint traces every
            real crease into clean line art you can hand straight to your tattoo artist.
          </p>
          <div className="cta-row rise" style={{ animationDelay: '240ms' }}>
            <button className="btn btn-primary btn-big" onClick={openApp}>Try it in your browser</button>
            <a className="btn btn-ghost btn-big" href={APK_URL} target="_blank" rel="noopener noreferrer">Get the Android app</a>
          </div>
          <p className="fineprint rise" style={{ animationDelay: '320ms' }}>Your photo is processed on your device. Nothing is uploaded.</p>
        </div>
        <CompareCard />
      </section>

      {/* ---------- DEMO ---------- */}
      <section className="section" id="demo">
        <div className="section-head rv">
          <p className="kicker">How it works</p>
          <h2>From a wet nose to <em>fresh ink</em> in five steps.</h2>
        </div>
        <div className="rv"><DemoPlayer onTry={openApp} /></div>
      </section>

      {/* ---------- STYLES ---------- */}
      <section className="section" id="styles">
        <div className="section-head rv">
          <p className="kicker">Five styles, one nose</p>
          <h2>Same dog. <em>Your</em> kind of tattoo.</h2>
          <p className="section-sub">Hover or tap a style to see the photo it came from.</p>
        </div>
        <div className="styles-grid">
          {STYLES.map((s, i) => (
            <figure key={s.id} className="style-card rv" style={{ transitionDelay: `${i * 70}ms` }} tabIndex={0}>
              <div className="style-img">
                <img src={A('nose-photo.png')} alt="" className="style-photo" />
                <img src={A(`nose-${s.id}.png`)} alt={`${s.name} style nose print`} className="style-art" loading="lazy" />
              </div>
              <figcaption><b>{s.name}</b><span>{s.note}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- FOR THE CHAIR ---------- */}
      <section className="section">
        <div className="section-head rv">
          <p className="kicker">Made for the tattoo chair</p>
          <h2>Everything your artist will ask for.</h2>
        </div>
        <div className="feature-grid">
          <Feature title="Vector SVG" text="Scales to any size without blur. Opens in Procreate, Illustrator and stencil printers." icon="pen" />
          <Feature title="Real-size preview" text="See it at 3, 5 or 8 cm before you commit, so the detail survives in ink." icon="ruler" />
          <Feature title="Frames & names" text="Heart, paw or circle. Add their name and a date in three typefaces." icon="heart" />
          <Feature title="Touch-ups" text="Erase a stray whisker, undo, redo. Presets for soft or high-contrast looks." icon="eraser" />
        </div>
      </section>

      {/* ---------- PRIVACY ---------- */}
      <section className="private rv" id="private">
        <div className="private-inner">
          <p className="kicker light">Privacy, by design</p>
          <h2>No account. No servers. <em>No ads.</em></h2>
          <p>Every pixel is processed right on your phone or in your browser. Your dog’s photo never leaves your device unless you choose to share it.</p>
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="final rv">
        <h2>Go get that nose.</h2>
        <p>It takes about a minute. Treats help.</p>
        <div className="cta-row center">
          <button className="btn btn-primary btn-big" onClick={openApp}>Start now, it’s free</button>
          <a className="btn btn-ghost btn-big" href={APK_URL} target="_blank" rel="noopener noreferrer">Download APK</a>
        </div>
      </section>

      <footer className="foot">
        <span>Made with ♥ for dogs by <a href="https://github.com/charlespura" target="_blank" rel="noopener noreferrer">@charlespura</a></span>
        <span className="foot-links">
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">⭐ Star on GitHub</a>
          <button onClick={() => router.push('/about')}>More projects</button>
        </span>
      </footer>
    </div>
  );
}

/** Hero: drag (or watch) the scan line turn the photo into line art. */
function CompareCard() {
  const [p, setP] = useState(0.5);
  const [style, setStyle] = useState<(typeof STYLES)[number]['id']>('sketch');
  const idleUntil = useRef(0);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const loop = (now: number) => {
      if (now > idleUntil.current) {
        const s = (now - t0) / 1000;
        setP(0.5 + 0.36 * Math.sin(s * 0.9));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  function follow(clientX: number) {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    idleUntil.current = performance.now() + 2500;
    setP(Math.min(1, Math.max(0, (clientX - r.left) / r.width)));
  }

  return (
    <div className="compare-wrap rise" style={{ animationDelay: '200ms' }}>
      <div
        className="compare"
        ref={box}
        onPointerMove={(e) => follow(e.clientX)}
        onPointerDown={(e) => follow(e.clientX)}
        role="img"
        aria-label="A dog nose photo turning into tattoo line art"
      >
        <img src={A('nose-photo.png')} alt="" className="cmp-layer" draggable={false} />
        <div className="cmp-layer cmp-paper" style={{ clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
          {STYLES.map((s) => (
            <img key={s.id} src={A(`nose-${s.id}.png`)} alt="" className="cmp-layer cmp-fade" style={{ opacity: style === s.id ? 1 : 0 }} draggable={false} />
          ))}
        </div>
        <div className="cmp-line" style={{ left: `${p * 100}%` }}><span className="cmp-handle">⟷</span></div>
        <span className="cmp-tag cmp-tag-l" style={{ opacity: p > 0.18 ? 1 : 0 }}>Tattoo</span>
        <span className="cmp-tag cmp-tag-r" style={{ opacity: p < 0.82 ? 1 : 0 }}>Photo</span>
      </div>
      <div className="cmp-styles" role="radiogroup" aria-label="Preview style">
        {STYLES.map((s) => (
          <button key={s.id} role="radio" aria-checked={style === s.id} className={style === s.id ? 'on' : ''} onClick={() => setStyle(s.id)}>{s.name}</button>
        ))}
      </div>
    </div>
  );
}

const ICONS: Record<string, string> = {
  pen: 'M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3',
  ruler: 'M3 17L17 3l4 4L7 21l-4-4zM7 13l2 2M10 10l2 2M13 7l2 2',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z',
  eraser: 'M8 20h12M5 15l8-8 6 6-6 6H9l-4-4zM10 10l6 6',
};

function Feature({ title, text, icon }: { title: string; text: string; icon: string }) {
  return (
    <div className="feature rv">
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden><path d={ICONS[icon]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
