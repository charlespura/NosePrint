# Demo narration: record it in your own voice

The landing-page demo plays one short audio clip per step. A real person talking sounds warmer than any AI voice,
and a little imperfection is fine. Talk like you're showing a friend your phone.

## How to record
1. Find a quiet room with soft furniture (a bedroom is better than a kitchen). Hold your phone about a hand's width from your mouth, slightly to the side.
2. Use any voice recorder app. Record each step as its **own file**, and leave a half-second of silence before you start talking.
3. Smile while you talk. People can hear it.
4. Save or convert the files to **MP3** with these exact names:
   ```
   public/demo/voice/step-1.mp3
   public/demo/voice/step-2.mp3
   public/demo/voice/step-3.mp3
   public/demo/voice/step-4.mp3
   public/demo/voice/step-5.mp3
   ```
5. Run `npm run deploy`. The demo picks them up automatically, shows a 🔊 button, and stretches each step to fit your clip. Without the files it plays with captions only.

Free tools: phone voice recorder → https://cloudconvert.com (m4a → mp3), or Audacity on PC (also good for "Noise Reduction").

## Script (about 40 seconds total)
Change words so they sound like *you*. Swap in your dog's name if it isn't Shadow (also change `DEMO_DOG_NAME` in `src/landing/DemoPlayer.tsx`).

**Step 1 – Snap** (~7 s)
> Did you know every dog's nose has its own pattern? Like a fingerprint. All you need is one close-up photo. Good light, nice and sharp.

**Step 2 – Crop** (~5 s)
> Drag and zoom until the nose fills the circle. That's the whole setup.

**Step 3 – Style** (~9 s)
> And now, watch this. It traces every little crease, the real ones from your photo. Then pick your style: sketch, fineline, stencil, dotwork, or bold.

**Step 4 – Make it theirs** (~6 s)
> Make it theirs. A heart, their name, maybe a date. I went with sepia for Shadow.

**Step 5 – Export** (~8 s)
> Save it to your phone, or send the SVG straight to your tattoo artist. It's free, and your photos never leave your phone. Go try it!
