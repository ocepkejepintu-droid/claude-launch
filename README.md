# claude-launch

**Turn your product into a calm launch video, right from Claude Code.**

[![claude-launch demo: click to watch the full film](demo/preview.gif)](demo/claude-launch-demo.mp4)

*Demo film for "Tidepool", a made-up invoicing app, made entirely with this skill.
[Watch the full 77-second video with sound →](demo/claude-launch-demo.mp4)*

`claude-launch` is a Claude Code skill that makes calm, premium product launch films: pale pastel
backgrounds, big two-tone headlines, UI cards that animate your product's flow, soft eased motion
and an ambient score. Output is a 1920×1080, 60 fps MP4.

---

## Install

**1. Get the skill**

```bash
git clone https://github.com/ocepkejepintu-droid/claude-launch ~/.claude/skills/launch
```

**2. Install what it renders with** (once)

```bash
cd ~/.claude/skills/launch
npm install && npm run setup      # Playwright + the headless Chromium that draws the frames
pip install numpy scipy           # music synthesizer
# ffmpeg: brew install ffmpeg  /  sudo apt install ffmpeg  /  winget install ffmpeg
```

**3. Restart Claude Code.** `/launch` now shows up in the slash-command menu.

---

## How to use it

### With Claude (recommended)

Type `/launch` followed by what you want. Point it at your website, paste your copy, or both:

```
/launch make a launch video for acme.com
```
```
/launch make a 60 second video for our app. Brand color #3b5bfd, font Inter.
Features: smart invoices, time import, one-click payments. CTA "Start free".
```
```
/launch make a video like this one: <link to a reference video>
```

Claude will:

1. **Collect the facts.** It reads your site or brief and uses your real copy. It won't invent stats, prices or reviews, and it tells you which demo details (sample names, amounts) are made up.
2. **Write the script** as 8–11 scenes: intro → everything-in-one-place → feature steps → pricing → support → statement → outro.
3. **Fill in the config** with your logo, colors, fonts and scenes.
4. **Check every scene's layout** on a contact sheet and fix text that overlaps or wraps badly.
5. **Render a quick preview** (~2 min), then **the final film** (~20 min for 70 seconds).
6. **Hand you the MP4.**

Then just ask for changes in plain words:

```
change the step 2 headline to "Paid in days, not weeks."
make the pricing scene show yearly prices
swap the chat scene for a document-signing scene
```

If a change doesn't alter a scene's length, Claude re-renders only that scene, which takes minutes instead of the full 20.

### By hand

```bash
cd ~/.claude/skills/launch

scripts/new-film.sh ~/my-film                                    # 1. start from the example config
scripts/fetch-fonts.sh ~/my-film "Poppins:400,500,600" "Pacifico:400"   # 2. download brand fonts
#                                                                  3. edit ~/my-film/film.config.js
scripts/make.sh ~/my-film --preview                              # 4. draft: 960×540, ~2 min
scripts/make.sh ~/my-film                                        # 5. final: 1080p 60 fps → ~/my-film/film.mp4
scripts/make.sh ~/my-film --from 12 --to 28                      #    re-render one scene after a small edit
```

A whole film is one file. A shortened example:

```js
window.FILM = {
  brand: {
    name: 'Acme', url: 'acme.com', logo: { text: 'Acme' },
    colors: { accent: '#3b5bfd', gradient: ['#5b6cff', '#2fc6a0'] },
  },
  scenes: [
    { type: 'intro', tagline: 'Invoicing for freelancers,', accent: 'on autopilot.' },
    { type: 'feature', eyebrow: 'Step 1 · Create', title: 'Send an invoice', accent: 'in under a minute.',
      body: 'Pick a client and add your hours.',
      card: { kind: 'form', title: 'New invoice', sections: [ /* fields that fill themselves in */ ] } },
    { type: 'outro', cta: 'Start free', url: 'acme.com' },
  ],
};
```

The full example is [`examples/tidepool/film.config.js`](examples/tidepool/film.config.js) (the demo above), and every option is listed in [`references/config.md`](references/config.md).

---

## What's in a film

| Scene | What it shows |
|---|---|
| `intro` | Your logo builds in piece by piece, with a tagline and a trust badge |
| `hub` | All your services or features wired into your brand badge |
| `feature` | Headline on the left, an animated product card on the right |
| `pricing` | Plan cards rising in, with the recommended one lifted |
| `statement` | Big words that settle one by one ("Calm. Simple. Paid on time.") |
| `outro` | Closing line, logo, CTA button and URL |

Feature cards show the product doing its job: a **form** filling itself in, data **rows** importing
(with an ID-scan card), documents **generating**, a document being **signed**, a support **chat**
on a phone, or any custom **html**.

## How it works

Every frame is a pure function of time. A headless Chromium page lays out the scenes,
`render.js` seeks to each frame and screenshots it, `score.py` synthesizes an ambient track
timed to the on-screen moments, and `ffmpeg` encodes the result. Renders are deterministic, so
any range of seconds can be re-rendered on its own.

| File | Purpose |
|---|---|
| [`SKILL.md`](SKILL.md) | The workflow Claude follows |
| [`references/style-guide.md`](references/style-guide.md) | What makes the style work: motion, type, color, copy, sound |
| [`references/config.md`](references/config.md) | Every config option |
| [`references/pitfalls.md`](references/pitfalls.md) | Mistakes to avoid when changing the engine |
| `template/` | The scene engine (HTML/CSS/JS) |
| `scripts/` | Render, layout check, score, fonts and reference-video tools |

## License

MIT. Fonts fetched from Google Fonts carry their own (OFL) licenses.

Community project, not affiliated with or endorsed by Anthropic.
