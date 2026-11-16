# Style guide: the calm launch film

What makes these films feel calm, explanatory and expensive. Derived from frame-by-frame study
of modern SaaS launch videos (scene-cut detection on them finds **zero hard cuts**: every change
is a crossfade or a continuous move).

## Feeling
- **One idea per beat.** Each scene says one thing in ≤ 8 words of headline. ~5–9 s per scene.
- **Nothing snaps.** Every entrance is a long ease-out (0.9–1.4 s, quartic/quintic); exits are
  shorter ease-ins (0.6–0.9 s). Things rise 16–30 px, never fly across the screen.
- **Blur is motion.** Words arrive from a 10–12 px blur while rising; leaving elements blur 6–8 px.
- **The UI does the explaining.** Cards demonstrate the claim: a field types itself, a document
  generates, a signature draws. The headline names the benefit; the card shows it happening.
- **Always a little alive.** Background washes drift, the camera breathes (±0.6 % scale over
  ~25 s), cards float upward ~4 px/s while on screen, hub dots travel along lines.

## Layout patterns
1. **Centered title + diagram**: hub, pricing, statements, intro/outro.
2. **Text left, device right**: feature scenes. Text column starts at x = 150, vertically
   centered; card/phone on the right half, slightly overlapping the vertical center line is fine.
   The text must never touch the card (`check.js` warns).
3. **Big centered stack**: 2–4 lines at ~108 px, earlier lines fade to grey as the next arrives.

## Typography
- One geometric/grotesk sans for headlines and UI (Poppins, Plus Jakarta Sans, Inter Display…).
- Headline 72–80 px, weight 500, tracking −0.035 em, line height 1.12. Two lines:
  line 1 ink, line 2 brand gradient (one continuous gradient across the line, not per word).
- Eyebrow 24 px weight 500 in the accent color above the headline ("Step 1 · …", "Proactive").
- Body 25 px regular, grey (#5d5868), ≤ 2 lines, set line breaks by hand, no orphans.
- One optional script-font moment (outro) if the brand already uses one.

## Color
- Background: near-white lavender-grey (#f6f4f9) with 4 very pale radial washes in brand-adjacent
  hues. It should read as "white with a mood", never as "pink background".
- Faint dot grid (30 px pitch, ~5 % opacity) masked to the center, plus film grain at ~4 %
  (it also prevents gradient banding in H.264).
- Cards: pure white, 28 px radius, layered soft shadows tinted toward the brand.
- Accent color for interactive bits only (buttons, eyebrows, active chips, rings).

## Copy
- Real copy from the product beats clever copy. Pull headlines from the site's own claims.
- Two-line headlines read as "plain statement → benefit": "Tell us about / your company.",
  "Approve in a tap. / Paid in days."
- No exact review counts or stats the user hasn't approved; prefer "Hundreds of 5-star reviews".
- Prices date quickly. If the film shows them, tell the user the film needs a re-render when they change.

## Sound
- ~76 BPM ambient: warm detuned pad, sparse felt-piano arpeggio, soft sub, airy noise bed;
  a gentle kick/rim/hat pulse enters after the intro and leaves for the outro.
- Foley is quieter than you think: pops, ticks and chimes sit *under* the music; whooshes are
  filtered noise swells. Master to about −16 LUFS integrated, true peak ≤ −1.5 dBTP.

## Pacing reference (70 s film)
intro 5.6 · hub 7.6 · step 1 8.6 · import 7.6 · step 2 7.8 · step 3 8.2 · pricing 6.8 ·
support 9.2 · statement 5.4 · outro 9.8 (scenes overlap 0.6 s).
