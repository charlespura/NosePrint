// Generates app icons + splash from vector shapes using CanvasKit (Skia) in Node.
// Run: node scripts/make-icons.js
const fs = require('fs');
const path = require('path');
const CanvasKitInit = require('canvaskit-wasm/bin/full/canvaskit.js');

const OUT = path.join(__dirname, '..', 'assets');
const TERRACOTTA = '#C2562F';
const CREAM = '#FAF3E8';
const INK = '#2A1A14';

// Nose drawn in a 0..100 box.
const NOSE = 'M50 22 C70 20 90 28 93 46 C96 62 84 72 70 74 C62 75 57 80 54 86 C52 89 48 89 46 86 C43 80 38 75 30 74 C16 72 4 62 7 46 C10 28 30 20 50 22 Z';
const NOSTRIL_L = 'M16 51 C20 42 34 41 40 48 C44 53 42 61 35 63 C29 64 26 60 29 56 C25 55 20 54 16 51 Z';
const NOSTRIL_R = 'M84 51 C80 42 66 41 60 48 C56 53 58 61 65 63 C71 64 74 60 71 56 C75 55 80 54 84 51 Z';
const PHILTRUM = 'M50 58 C50 68 50 76 50 85';

CanvasKitInit().then((CK) => {
  const paint = (hex, style = 'fill', width = 0) => {
    const p = new CK.Paint();
    p.setColor(CK.parseColorString(hex));
    p.setAntiAlias(true);
    if (style === 'stroke') { p.setStyle(CK.PaintStyle.Stroke); p.setStrokeWidth(width); p.setStrokeCap(CK.StrokeCap.Round); }
    return p;
  };

  function drawNose(canvas, x, y, size, { nose, ink, hole }) {
    canvas.save();
    canvas.translate(x, y);
    canvas.scale(size / 100, size / 100);
    const nosePath = CK.Path.MakeFromSVGString(NOSE);
    canvas.drawPath(nosePath, paint(nose));
    // cobblestone texture: dots clipped to the nose
    canvas.save();
    canvas.clipPath(nosePath, CK.ClipOp.Intersect, true);
    const ring = paint(ink, 'stroke', 0.9);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let yy = 22; yy < 90; yy += 3.6) {
      for (let xx = 6 + ((yy / 3.6) % 2) * 1.8; xx < 95; xx += 3.6) {
        const fade = Math.max(0, 1 - (yy - 24) / 46);
        if (rnd() < 0.25 + fade * 0.75) canvas.drawCircle(xx + rnd() * 0.6, yy + rnd() * 0.6, 1.25 + rnd() * 0.35, ring);
      }
    }
    canvas.restore();
    canvas.drawPath(CK.Path.MakeFromSVGString(NOSTRIL_L), paint(hole));
    canvas.drawPath(CK.Path.MakeFromSVGString(NOSTRIL_R), paint(hole));
    canvas.drawPath(CK.Path.MakeFromSVGString(PHILTRUM), paint(hole, 'stroke', 1.8));
    canvas.restore();
  }

  function render(file, size, draw) {
    const surface = CK.MakeSurface(size, size);
    const canvas = surface.getCanvas();
    canvas.clear(CK.TRANSPARENT);
    draw(canvas, size);
    const img = surface.makeImageSnapshot();
    fs.writeFileSync(path.join(OUT, file), Buffer.from(img.encodeToBytes()));
    surface.delete();
    console.log('wrote', file);
  }

  const colored = { nose: INK, ink: '#5A3F33', hole: '#0B0605' };
  // iOS / generic icon: full bleed background
  render('icon.png', 1024, (c, s) => { c.clear(CK.parseColorString(TERRACOTTA)); drawNose(c, s * 0.16, s * 0.14, s * 0.68, colored); });
  // Android adaptive: art inside the 66% safe zone
  render('android-icon-foreground.png', 1024, (c, s) => drawNose(c, s * 0.25, s * 0.23, s * 0.5, colored));
  render('android-icon-background.png', 1024, (c) => c.clear(CK.parseColorString(TERRACOTTA)));
  render('android-icon-monochrome.png', 1024, (c, s) => drawNose(c, s * 0.25, s * 0.23, s * 0.5, { nose: '#FFFFFF', ink: '#FFFFFF', hole: '#00000000' }));
  // Splash: nose on transparent (background colour set in app.json)
  render('splash-icon.png', 1024, (c, s) => drawNose(c, s * 0.1, s * 0.08, s * 0.8, colored));
  render('favicon.png', 96, (c, s) => { c.clear(CK.parseColorString(TERRACOTTA)); drawNose(c, s * 0.08, s * 0.06, s * 0.84, colored); });
});
