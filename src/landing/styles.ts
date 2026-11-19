export const LANDING_CSS = `
:root{
  --bg:#FAF6EF; --bg2:#F2EBE0; --card:#FFFFFF; --ink:#1C1814; --muted:#6E655A; --line:#E5DCCD;
  --accent:#C2562F; --accent-ink:#FFFFFF; --accent-soft:#F4DDD2; --paper:#FFFDF9; --shadow:0 30px 60px -30px rgba(60,35,20,.35);
  --serif:'PlayfairDisplay_700Bold', Georgia, 'Times New Roman', serif;
  --serif-i:'PlayfairDisplay_600SemiBold_Italic', Georgia, serif;
  --sans:'Inter_400Regular', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --sans-b:'Inter_600SemiBold', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --script:'DancingScript_700Bold', cursive;
}
@media (prefers-color-scheme: dark){
  :root{ --bg:#14110E; --bg2:#1C1814; --card:#211C17; --ink:#F4EEE4; --muted:#A79C8E; --line:#332B23;
    --accent:#E07A52; --accent-ink:#1A120D; --accent-soft:#3A2419; --shadow:0 30px 60px -30px rgba(0,0,0,.7); }
}
.lp{ position:fixed; inset:0; overflow-y:auto; overflow-x:hidden; background:var(--bg); color:var(--ink); font-family:var(--sans);
  -webkit-font-smoothing:antialiased; scroll-behavior:smooth; }
.lp *{ box-sizing:border-box; }
.lp h1,.lp h2,.lp h3{ font-family:var(--serif); font-weight:400; letter-spacing:-.02em; margin:0; }
.lp em{ font-family:var(--serif-i); font-style:normal; color:var(--accent); }
.lp a{ color:inherit; }
:where(.lp) button{ font:inherit; color:inherit; background:none; border:0; cursor:pointer; }

/* buttons */
.btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px; border-radius:999px; padding:12px 22px;
  font-family:var(--sans-b); font-size:15px; text-decoration:none; transition:transform .2s ease, background .2s, box-shadow .2s; min-height:44px; }
.btn:active{ transform:scale(.97); }
.btn-primary{ background:var(--accent); color:var(--accent-ink)!important; box-shadow:0 10px 24px -12px var(--accent); }
.btn-primary:hover{ transform:translateY(-1px); box-shadow:0 14px 28px -12px var(--accent); }
.btn-ghost{ border:1.5px solid var(--line)!important; background:transparent; }
.btn-ghost:hover{ border-color:var(--ink)!important; }
.btn-big{ padding:16px 28px; font-size:16px; }
.btn-small{ padding:8px 16px; min-height:38px; font-size:14px; }

/* nav */
.nav{ position:sticky; top:0; z-index:20; display:flex; justify-content:space-between; align-items:center; padding:14px clamp(16px,4vw,48px);
  background:color-mix(in srgb, var(--bg) 82%, transparent); backdrop-filter:blur(10px); border-bottom:1px solid transparent; }
.brand{ display:flex; align-items:center; gap:10px; font-family:var(--serif); font-size:20px; text-decoration:none; }
.brand img{ border-radius:8px; }
.nav nav{ display:flex; align-items:center; gap:6px; }
.nav nav > button:not(.btn){ padding:8px 12px; border-radius:8px; color:var(--muted); font-size:14px; }
.nav nav > button:not(.btn):hover{ color:var(--ink); }
@media (max-width:720px){ .nav nav > button:not(.btn){ display:none; } }

/* hero */
.hero{ display:grid; grid-template-columns:1.05fr .95fr; gap:clamp(24px,5vw,72px); align-items:center;
  max-width:1200px; margin:0 auto; padding:clamp(28px,6vw,80px) clamp(16px,4vw,48px) clamp(48px,8vw,110px); }
@media (max-width:900px){ .hero{ grid-template-columns:1fr; } }
.kicker{ font-family:var(--sans-b); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); margin:0 0 14px; }
.kicker.light{ color:#F0B79F; }
.hero h1{ font-size:clamp(40px,6.4vw,80px); line-height:1.02; }
.lede{ font-size:clamp(17px,1.6vw,19px); line-height:1.6; color:var(--muted); max-width:34em; margin:22px 0 30px; }
.cta-row{ display:flex; flex-wrap:wrap; gap:12px; }
.cta-row.center{ justify-content:center; }
.fineprint{ color:var(--muted); font-size:13px; margin-top:16px; }
.rise{ opacity:0; transform:translateY(14px); animation:rise .8s cubic-bezier(.2,.7,.2,1) forwards; }
@keyframes rise{ to{ opacity:1; transform:none; } }

/* compare card */
.compare-wrap{ display:flex; flex-direction:column; align-items:center; gap:18px; position:relative; }
.compare-wrap::before{ content:''; position:absolute; inset:6% 4% 18%; border-radius:50%;
  background:radial-gradient(closest-side, var(--accent-soft), transparent); filter:blur(10px); z-index:0; }
.compare{ position:relative; z-index:1; width:min(460px,86vw); aspect-ratio:1; border-radius:50%; overflow:hidden; cursor:ew-resize;
  box-shadow:var(--shadow), 0 0 0 10px var(--card), 0 0 0 11px var(--line); touch-action:pan-y; user-select:none; }
.cmp-layer{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.cmp-paper{ background:var(--paper); }
.cmp-fade{ transition:opacity .45s ease; }
.cmp-line{ position:absolute; top:0; bottom:0; width:2px; margin-left:-1px; background:var(--accent); box-shadow:0 0 18px 2px var(--accent); }
.cmp-handle{ position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:42px; height:42px; border-radius:50%;
  background:var(--accent); color:var(--accent-ink); display:grid; place-items:center; font-size:18px; box-shadow:0 6px 16px -4px rgba(0,0,0,.35); }
.cmp-tag{ position:absolute; top:50%; transform:translateY(-50%); font-family:var(--sans-b); font-size:11px; letter-spacing:.12em; text-transform:uppercase;
  padding:5px 10px; border-radius:999px; background:rgba(255,255,255,.85); color:#1C1814; transition:opacity .3s; pointer-events:none; }
.cmp-tag-l{ left:7%; } .cmp-tag-r{ right:7%; }
.cmp-styles{ position:relative; z-index:1; display:flex; flex-wrap:wrap; justify-content:center; gap:6px; padding:5px; border-radius:999px; background:var(--bg2); }
.cmp-styles button{ padding:8px 14px; border-radius:999px; font-size:13px; color:var(--muted); min-height:36px; transition:background .2s,color .2s; }
.cmp-styles button.on{ background:var(--card); color:var(--ink); font-family:var(--sans-b); box-shadow:0 2px 8px -3px rgba(0,0,0,.2); }

/* sections */
.section{ max-width:1200px; margin:0 auto; padding:clamp(56px,8vw,110px) clamp(16px,4vw,48px); }
.section-head{ max-width:720px; margin-bottom:clamp(28px,4vw,52px); }
.section h2,.private h2,.final h2{ font-size:clamp(32px,4.4vw,54px); line-height:1.08; }
.section-sub{ color:var(--muted); margin:14px 0 0; }
.rv{ opacity:0; transform:translateY(28px); transition:opacity .9s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1); }
.rv.in{ opacity:1; transform:none; }

/* demo */
.demo{ display:grid; grid-template-columns:auto 1fr; gap:clamp(24px,5vw,72px); align-items:center; outline:none; }
@media (max-width:860px){ .demo{ grid-template-columns:1fr; justify-items:center; } }
.demo-stage{ display:flex; justify-content:center; }
.phone{ position:relative; width:316px; height:636px; border-radius:46px; padding:8px; background:#16120F;
  box-shadow:var(--shadow), inset 0 0 0 2px #3a322b; }
.phone-notch{ position:absolute; top:16px; left:50%; transform:translateX(-50%); width:88px; height:24px; border-radius:20px; background:#16120F; z-index:5; }
.screen{ transition:background .6s ease, color .6s ease; position:relative; width:300px; height:620px; border-radius:38px; overflow:hidden; background:#FAF7F2; color:#1C1A17; font-family:var(--sans); }
.screen.dark{ background:#0E0C0A; color:#F4EEE4; }
.screen.dark .appbar-back{ color:#A79C8E; }
.statusbar{ transition:color .5s; position:absolute; top:0; left:0; right:0; height:44px; display:flex; justify-content:space-between; align-items:center; padding:0 26px;
  font-family:var(--sans-b); font-size:12px; z-index:4; }
.appbar{ position:absolute; top:44px; left:0; right:0; height:44px; display:flex; align-items:center; gap:10px; padding:0 18px; z-index:4; }
.appbar-back{ font-size:26px; line-height:1; color:#6E675E; }
.appbar-title{ font-family:var(--sans-b); font-size:16px; animation:fadein .5s ease; }
@keyframes fadein{ from{ opacity:0; transform:translateY(4px);} to{ opacity:1; transform:none; } }
.group{ position:absolute; inset:0; transform-origin:50% 92px; }
.art{ position:absolute; border-radius:50%; overflow:hidden; will-change:transform; }
.ui{ position:absolute; inset:0; }
.layer{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.paper{ background:#FFFFFF; }
.fade{ transition:opacity .45s ease; }
.scanline{ position:absolute; top:0; bottom:0; width:2px; margin-left:-1px; background:#E07A52; box-shadow:0 0 14px 3px rgba(224,122,82,.8); }
.vignette{ position:absolute; inset:0; background:radial-gradient(circle at 50% 38%, transparent 42%, rgba(0,0,0,.35) 75%); pointer-events:none; }
.brackets{ position:absolute; left:30px; top:114px; width:240px; height:240px; }
.brackets i{ position:absolute; width:30px; height:30px; border:3px solid #fff; }
.brackets i:nth-child(1){ left:0; top:0; border-right:0; border-bottom:0; border-top-left-radius:10px; }
.brackets i:nth-child(2){ right:0; top:0; border-left:0; border-bottom:0; border-top-right-radius:10px; }
.brackets i:nth-child(3){ left:0; bottom:0; border-right:0; border-top:0; border-bottom-left-radius:10px; }
.brackets i:nth-child(4){ right:0; bottom:0; border-left:0; border-top:0; border-bottom-right-radius:10px; }
.hint{ position:absolute; top:396px; left:50%; padding:7px 14px; border-radius:999px; background:#1C1A17; color:#fff; font-size:13px; }
.shutter-row{ position:absolute; bottom:34px; left:0; right:0; display:flex; align-items:center; justify-content:space-around; }
.shutter{ width:66px; height:66px; border-radius:50%; background:#fff; box-shadow:0 0 0 5px rgba(28,26,23,.15); transition:transform .12s; }
.thumb{ width:42px; height:42px; border-radius:10px; background-size:cover; background-position:center; transition:opacity .4s; box-shadow:0 0 0 2px #fff; }
.thumb.ghost{ opacity:0; }
.flash{ position:absolute; inset:0; background:#fff; pointer-events:none; }
.cropmask{ position:absolute; border-radius:50%; box-shadow:0 0 0 400px rgba(20,17,14,.55); border:2px solid rgba(255,255,255,.9); pointer-events:none; }
.sheet-lite{ position:absolute; left:16px; right:16px; bottom:24px; display:flex; flex-direction:column; gap:12px; animation:fadein .6s ease; }
.seg{ display:flex; background:#F1ECE4; border-radius:14px; padding:4px; }
.seg span{ flex:1; text-align:center; padding:9px 0; border-radius:10px; font-size:13px; color:#6E675E; }
.seg span.on{ background:#fff; color:#1C1A17; font-family:var(--sans-b); }
.slider{ display:flex; align-items:center; gap:12px; font-size:13px; font-family:var(--sans-b); }
.slider-label{ width:48px; }
.track{ position:relative; flex:1; height:4px; border-radius:2px; background:#E4DDD2; }
.knob{ position:absolute; top:50%; width:20px; height:20px; margin:-10px 0 0 -10px; border-radius:50%; background:#C2562F; box-shadow:0 2px 6px rgba(0,0,0,.25); }
.chips{ display:flex; flex-wrap:wrap; gap:6px; }
.chip{ display:inline-flex; align-items:center; gap:6px; padding:7px 11px; border-radius:999px; border:1.5px solid #E4DDD2; background:#fff; font-size:12px; color:#6E675E;
  transition:all .3s ease; }
.chip.on{ border-color:#C2562F; background:#F6EEE6; color:#1C1A17; font-family:var(--sans-b); }
.sw{ width:12px; height:12px; border-radius:50%; display:inline-block; }
.cta{ height:48px; border-radius:14px; background:#C2562F; color:#fff; display:flex; align-items:center; justify-content:center; font-family:var(--sans-b); font-size:15px;
  transition:transform .15s, filter .15s; }
.cta.pressed{ transform:scale(.96); filter:brightness(.9); }
.cta.alt{ background:#fff; color:#1C1A17; border:1.5px solid #E4DDD2; }
.cta.ghost{ background:transparent; color:#1C1A17; }
.heart{ position:absolute; overflow:visible; pointer-events:none; }
.name{ position:absolute; left:0; right:0; text-align:center; font-family:var(--script); font-size:34px; transition:color .4s; }
.caret{ font-family:var(--sans); font-weight:300; margin-left:2px; animation:blink 1s steps(1) infinite; }
@keyframes blink{ 50%{ opacity:0; } }
.date{ position:absolute; left:0; right:0; text-align:center; font-family:var(--serif-i); font-size:14px; letter-spacing:.06em; transition:color .4s; }
.sheet{ position:absolute; left:0; right:0; bottom:0; padding:18px 16px 26px; background:#fff; border-radius:26px 26px 0 0;
  box-shadow:0 -10px 30px -10px rgba(0,0,0,.18); display:flex; flex-direction:column; gap:8px; }
.toast{ position:absolute; top:338px; left:50%; transform:translate(-50%,-14px); padding:10px 16px; border-radius:14px; background:#1C1A17; color:#fff;
  font-size:13px; white-space:nowrap; z-index:6; }
.finger{ position:absolute; width:34px; height:34px; margin:-17px 0 0 -17px; border-radius:50%; background:rgba(28,26,23,.28);
  border:2px solid rgba(255,255,255,.9); z-index:7; pointer-events:none; }
.ripple{ position:absolute; inset:-2px; border-radius:50%; border:2px solid rgba(255,255,255,.95); }
.poster{ position:absolute; inset:8px; border-radius:38px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px;
  background:linear-gradient(180deg, rgba(20,17,14,.15), rgba(20,17,14,.65)); color:#fff!important; z-index:8; }
.poster-play{ width:76px; height:76px; border-radius:50%; background:var(--accent); display:grid; place-items:center; font-size:26px; padding-left:5px;
  box-shadow:0 0 0 0 rgba(224,122,82,.6); animation:ring 2.2s ease-out infinite; }
@keyframes ring{ 0%{ box-shadow:0 0 0 0 rgba(224,122,82,.55);} 100%{ box-shadow:0 0 0 26px rgba(224,122,82,0);} }
.poster-text{ font-family:var(--serif); font-size:24px; margin-top:8px; }
.poster-sub{ font-size:13px; opacity:.85; }
.endcard{ position:absolute; inset:8px; border-radius:38px; z-index:8; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:10px;
  padding:0 26px 40px; background:linear-gradient(180deg, transparent 30%, rgba(250,246,239,.96) 62%); animation:fadein .6s ease; color:#1C1814; }
.endcard-kicker{ margin:0; font-family:var(--sans-b); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:#C2562F; }
.endcard-title{ margin:0 0 6px; font-family:var(--serif); font-size:26px; text-align:center; line-height:1.15; }
.endcard .btn{ width:100%; }
.endcard .btn-ghost{ border-color:#E5DCCD!important; color:#1C1814; }

.demo-side{ max-width:480px; }
.bars{ display:flex; flex-direction:column; gap:4px; }
.bar{ display:flex; flex-direction:column; gap:8px; text-align:left; padding:12px 14px; border-radius:14px; transition:background .25s; }
.bar:hover{ background:var(--bg2); }
.bar.is-on{ background:var(--card); box-shadow:0 8px 24px -16px rgba(0,0,0,.4); }
.bar-track{ display:block; height:3px; border-radius:2px; background:var(--line); overflow:hidden; }
.bar-fill{ display:block; height:100%; background:var(--accent); transform-origin:left; }
.bar-label{ font-size:15px; color:var(--muted); }
.bar.is-on .bar-label{ color:var(--ink); font-family:var(--sans-b); }
.bar-label b{ display:inline-block; width:22px; color:var(--accent); font-family:var(--sans-b); }
.caption{ font-family:var(--serif); font-size:clamp(22px,2.3vw,28px); line-height:1.3; margin:26px 0 22px; min-height:3.9em; animation:fadein .6s ease; }
.demo-controls{ display:flex; gap:10px; }
.ctl{ width:48px; height:48px; border-radius:50%; border:1.5px solid var(--line)!important; font-size:16px; display:grid; place-items:center; transition:all .2s; }
.ctl:hover:not(:disabled){ border-color:var(--ink)!important; }
.ctl:disabled{ opacity:.35; cursor:default; }
.ctl-main{ background:var(--accent)!important; color:var(--accent-ink)!important; border-color:var(--accent)!important; }

/* styles gallery */
.styles-grid{ display:grid; grid-template-columns:repeat(5,1fr); gap:16px; }
@media (max-width:1000px){ .styles-grid{ grid-template-columns:repeat(3,1fr);} }
@media (max-width:620px){ .styles-grid{ grid-template-columns:repeat(2,1fr);} }
.style-card{ margin:0; background:var(--card); border:1px solid var(--line); border-radius:22px; padding:14px; outline:none;
  transition:transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s, opacity .9s, border-color .3s; }
.style-card:hover,.style-card:focus{ transform:translateY(-4px); box-shadow:var(--shadow); border-color:var(--accent); }
.style-img{ position:relative; aspect-ratio:1; border-radius:50%; overflow:hidden; background:#fff; }
.style-img img{ position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:opacity .45s ease; }
.style-photo{ opacity:0; }
.style-card:hover .style-photo,.style-card:focus .style-photo{ opacity:1; }
.style-card:hover .style-art,.style-card:focus .style-art{ opacity:0; }
.style-card figcaption{ display:flex; flex-direction:column; gap:4px; padding:14px 4px 4px; }
.style-card b{ font-family:var(--serif); font-weight:400; font-size:20px; }
.style-card span{ color:var(--muted); font-size:13px; line-height:1.45; }

/* features */
.feature-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:16px; }
@media (max-width:1000px){ .feature-grid{ grid-template-columns:repeat(2,1fr);} }
@media (max-width:560px){ .feature-grid{ grid-template-columns:1fr;} }
.feature{ padding:24px; border-radius:22px; background:var(--bg2); }
.feature svg{ color:var(--accent); }
.feature h3{ font-size:22px; margin:14px 0 8px; }
.feature p{ margin:0; color:var(--muted); line-height:1.55; font-size:15px; }

/* privacy band */
.private{ margin:0 clamp(12px,3vw,32px); border-radius:36px; background:#1C1814; color:#F4EEE4; overflow:hidden; position:relative; }
.private-inner{ max-width:820px; margin:0 auto; padding:clamp(56px,8vw,110px) clamp(20px,4vw,48px); text-align:center; }
.private p{ color:#BFB4A6; font-size:18px; line-height:1.6; margin:18px auto 0; max-width:36em; }
.private em{ color:#F0B79F; }

/* final */
.final{ text-align:center; padding:clamp(64px,10vw,130px) 16px; }
.final p{ color:var(--muted); font-size:18px; margin:14px 0 28px; }
.foot{ display:flex; flex-wrap:wrap; justify-content:space-between; gap:12px; padding:28px clamp(16px,4vw,48px) 36px; border-top:1px solid var(--line);
  color:var(--muted); font-size:14px; }
.foot a{ color:var(--ink); }
.foot-links{ display:flex; gap:18px; }
.foot-links button{ color:var(--ink); text-decoration:underline; }

.render .phone *{ transition:none!important; animation:none!important; }
@media (prefers-reduced-motion: reduce){
  .rise,.rv{ opacity:1!important; transform:none!important; animation:none!important; transition:none!important; }
  .poster-play{ animation:none; }
}
`;

