---
name: launch
description: Make a calm, explanatory product launch video (60 fps 1080p MP4 with an ambient score): pale pastel backgrounds, big two-tone headlines, UI cards that rise in like a slow scroll, soft eased motion. Built from one config file of brand + scenes, rendered deterministically with headless Chromium, scored with a synthesized ambient track. Use when someone asks for a product video, launch film, explainer, motion graphics or "a video like this" for a SaaS/app/service, or wants to turn a website's copy into a motion video.
---

# claude-launch · `/launch`

A config-driven pipeline for 60–80 second product films in the style of modern calm SaaS
launch videos: quiet, explanatory, premium. Every frame is a pure function of time, so any
second can be re-rendered on its own and the result is the same on every machine.

```
film.config.js ──▶ template (HTML scenes) ──▶ cues.js ──▶ score.py ──▶ score.wav ─┐
                                         └──▶ render.js ──▶ PNG frames ─────────────┴─▶ ffmpeg ─▶ film.mp4
```

## Requirements

- Node 18+; run `npm install && npm run setup` once inside this skill's folder (Playwright + Chromium)
- `ffmpeg`/`ffprobe` with libx264
- Python 3 with `numpy` and `scipy`

## Workflow

### 1. Get the real facts first
The film is only as good as its copy. Collect, from the product's site or the user:
one-line positioning, 4–7 features or steps, any real UI details (screen names, field labels,
example data), pricing if they want it, CTA text, URL, and brand (logo, colors, fonts).
If the user points at a reference video, run `scripts/probe-reference.sh <video-or-x.com-url>`
and study the contact sheet before writing anything (see `references/style-guide.md`).
Never invent claims, stats, prices or review counts. Mark any invented sample data
(names, amounts) and tell the user which parts are illustrative.

### 2. Write the script as scenes
Read `references/style-guide.md`, then plan 8–11 scenes. A proven arc:
`intro` → `hub` (everything in one place) → 3–5 `feature` scenes (step 1/2/3, each with a
card) → `pricing` (optional) → support/trust `feature` → `statement` → `outro`.
Headline rule: line 1 dark, line 2 (`accent`) gradient; each line ≤ ~22 characters.
Body copy: 1–2 short sentences; use an array to set your own line breaks.

### 3. Scaffold and fill the config
```bash
SKILL=<path to this skill>
$SKILL/scripts/new-film.sh my-film                      # copies the example config
$SKILL/scripts/fetch-fonts.sh my-film "Poppins:400,500,600,700" "Pacifico:400"   # prints `faces` entries
```
Edit `my-film/film.config.js`. All fields are documented in `references/config.md`;
`examples/tidepool/film.config.js` uses every scene type and card kind. Put a real logo in
as SVG path data (`logo.mark` / `logo.word`) when you have it; otherwise `logo.text` builds
a clean wordmark.

### 4. Check layout before rendering anything long
```bash
mkdir -p my-film/.build && cp $SKILL/template/* my-film/.build/ && cp -r my-film/film.config.js my-film/fonts my-film/.build/
node $SKILL/scripts/check.js my-film/.build my-film/check.png        # contact sheet + timeline + warnings
```
(`make.sh` does the copying for you on every run; the manual copy is only for this quick check.)
Look at the sheet and fix every warning: text overlapping cards, headlines over two lines,
orphan words at the end of body lines, elements off-frame. Pass explicit times
(`check.js build sheet.png 12.5 14 30`) to inspect mid-animation moments.

### 5. Preview, then render
```bash
$SKILL/scripts/make.sh my-film --preview      # 960x540 @15fps, ~2 min → my-film/film-preview.mp4
$SKILL/scripts/make.sh my-film                # 1920x1080 @60fps, PNG frames → my-film/film.mp4 (~3–4 rendered fps on 4 cores)
```
Run the full render in the background; it takes ~20 min for a 70 s film on 4 cores.

### 6. Verify the output, not the source
Pull frames from the final MP4 (`ffmpeg -i film.mp4 -vf "fps=1/3.5,scale=480:-1,tile=4x5" -frames:v 1 sheet.jpg`)
and look at them. Check loudness (`ffmpeg -i film.mp4 -af ebur128 -f null -`, target ≈ −16 LUFS).
You cannot listen to the music: say so, and ask the user to listen before posting.

### 7. Iterate cheaply
Copy edits that don't change a scene's duration only need that scene re-rendered:
```bash
$SKILL/scripts/make.sh my-film --from 12.0 --to 27.6     # times from the timeline check.js prints
```
If an edit changes durations (more fields, longer chat), everything after it shifts:
do a full render, because the score is timed to the scenes.

## Scene types (details in references/config.md)

| type | what it shows |
|---|---|
| `intro` | logo builds in piece by piece, tagline with gradient accent, optional trust chip |
| `hub` | title + 4–8 service pills wired into a glowing brand badge with travelling dots |
| `feature` | eyebrow + two-tone headline + body on the left, an animated card on the right |
| `pricing` | 2–4 plan cards rising in, middle one lifted, footnote |
| `statement` | 2–4 big words/lines; earlier lines fade to grey, last line gradient; optional stars + text |
| `outro` | lead line + script-font line, then logo, CTA button and URL pill; fades out |

Feature `card.kind`: `form` (fields fill in, one typed with a caret, availability chip),
`rows` (data import from skeletons + optional scan/verify card), `progress` (items generate
with bars and checks + optional notification), `sign` (document, signature draws itself,
status chips), `chat` (phone conversation with typing, choices, a toast), `html` (anything custom).

## Pitfalls

Read `references/pitfalls.md` before changing the engine. The short version: drive all motion
from `seek(t)` (no CSS transitions or animations), don't animate CSS `filter: blur` on large
layers, keep `engine.js` wrapped in its IIFE, never `pkill -f` a pattern that matches your own
shell command, and re-encode after every partial re-render.
