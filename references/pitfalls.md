# Pitfalls (learned the hard way)

## Rendering
- **Drive everything from `seek(t)`.** No CSS transitions, CSS animations, `requestAnimationFrame`
  or timers: screenshots happen at arbitrary times, from several browsers at once. Every style
  must be a pure function of `t`, which is also what makes partial re-renders seamless.
- **Wait for fonts** (`window.READY`) before the first screenshot, or the first frames of every
  worker render in the fallback font. Declared `@font-face` files only load when requested, so
  `READY` calls `document.fonts.load` for each face explicitly.
- **Don't animate `filter: blur()` on big layers.** 120 px blurred background blobs cost a full
  re-raster every frame. Use radial gradients instead (same look, far cheaper). Small text blur
  during reveals is fine.
- **PNG screenshots are the bottleneck** (~3–4 rendered fps on 4 cores at 1080p). Use
  `--preview` (half-size JPEG at 15 fps) while iterating; render 60 fps PNG only for the final.
- **Re-render ranges, not films.** Changing copy inside one scene only needs
  `make.sh dir --from A --to B` with that scene's times. If you change anything that alters a
  scene's duration, re-render everything: later scenes and the score shift.
- **Layout reads need visible elements.** `offsetWidth`/`getTotalLength` return 0 inside
  `visibility: hidden` ancestors in some cases; `seek` runs every scene's `layout()` once with the
  scene made visible, before the first frame.

## JavaScript
- `engine.js` is wrapped in an IIFE and exports `window.Engine`. Top-level `const`s in two classic
  scripts share one global scope, so destructuring `clamp` in a second script throws
  "Identifier has already been declared" and kills `seek`.
- Per-word gradient text: splitting a gradient line into word spans makes each word restart the
  gradient. `prepGrad()` gives every word the same gradient size and an offset so the line reads
  as one continuous gradient.

## Shell / environment
- **Never `pkill -f render.js`** (or any pattern) from a shell whose own command line contains
  that pattern: it kills the shell running it. Use `pgrep` to find PIDs, or kill by PID.
- Long renders: run in the background and poll the log; a 70 s film takes ~20 min at 60 fps.
- Partial re-renders overwrite frames in place; always re-encode afterwards and check frames
  pulled from the *final MP4*, not the PNGs.

## Copy & layout
- Long second headline lines ("We handle all of the paperwork.") won't fit 80 px beside a card.
  The feature scene auto-shrinks the headline to clear the card; set `titleSize` to pin it.
- Orphans: write `body` as an array of lines. `check.js` flags a short last line.
- Use real product copy. Mark invented demo data (names, amounts, document titles) and tell the
  user which parts are illustrative.

## Audio
- UI chimes at the same gain as music keys poke out as obvious spikes; keep foley ~10 dB under
  the bed. Plot `showwavespic` to spot spikes, since you can't listen.
- Negative cue times (whoosh pre-roll before t=0) must be clipped, not indexed.
- Normalise with ffmpeg `loudnorm=I=-16:TP=-1.5` at encode time.
