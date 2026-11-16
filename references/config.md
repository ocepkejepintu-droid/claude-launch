# film.config.js reference

`film.config.js` sets `window.FILM = { brand, music, overlap, scenes }`. It is plain JavaScript,
so comments and trailing commas are fine. All text is HTML-escaped; only `card.kind: 'html'`
injects raw HTML.

## brand

```js
brand: {
  name: 'Acme',                      // hub badge label, chat header default
  url: 'acme.com',                   // browser bar in form cards
  logo: { text: 'Acme' },            // simple wordmark + gradient tile with the first letter
  // or real vector paths (copy the d="" attributes out of the brand's SVG):
  // logo: { viewBox: '0 0 600 100', mark: ['M0,0h80v100H0Z', …], word: ['M120…Z', …],
  //         markGradient: ['#5b6cff', '#2fc6a0'], markViewBox: '0 0 100 100', wordColor: '#17131f' },
  colors: {
    accent: '#3b5bfd',               // eyebrows, buttons, chat bubbles, icons
    accentSoft: '#e8edff',           // icon circles, tags, active chips
    highlight: '#3b5bfd',            // focus rings, field labels, scan line, hub glow
    gradient: ['#5b6cff', '#3aa7e8 55%', '#2fc6a0'],   // accent headline lines + progress bars
    markGradient: ['#5b6cff', '#2fc6a0'],               // badge/tile behind the mark
    ink: '#17131f', bg: '#f6f4f9', ok: '#1a9a5c', okBg: '#e8f7ef',
  },
  scriptGradient: 'linear-gradient(90deg,#5b6cff,#2fc6a0)',  // outro script line
  blobs: ['#ffd7e6', '#ffe6cc', '#e7dcff', '#fff1d6'],  // 4 pale background washes; keep them very light
  fonts: {
    head: 'Poppins', ui: 'Poppins', script: 'Pacifico',
    faces: [ { family: 'Poppins', src: 'fonts/poppins-500.woff2', weight: 500 }, … ],  // from fetch-fonts.sh
  },
}
```

Without `fonts.faces` the film falls back to Inter (if installed) then sans-serif.

## music

`{ bpm: 76, transpose: 0, pulse: true }`. `transpose` shifts the whole score (and UI chimes)
in semitones; `pulse: false` keeps only pad + keys (no soft kick/rim/hats).

## overlap

Seconds two neighbouring scenes share while one leaves and the next arrives. Default `0.6`.

## scenes

Every scene accepts `dur` (seconds) to override its automatic length. Times inside a scene are
derived from its content (number of fields, message lengths, …), so prefer adjusting content.

### intro
`{ type: 'intro', tagline: 'Invoicing for freelancers,', accent: 'on autopilot.', chip: { icon: 'shield', text: 'Bank-level encryption' }, logoWidth: 810 }`

### hub
`{ type: 'hub', title: 'Everything you bill for.', accent: 'In one calm place.', hubLabel: 'Acme', items: [ { label: 'Invoices', icon: 'doc' }, … ] }`
4–8 items, split left/right. Keep labels ≤ 20 characters.

### feature
```js
{ type: 'feature', eyebrow: 'Step 1 · Create', title: 'Send an invoice', accent: 'in under a minute.',
  body: ['Pick a client and add your hours.', 'Acme does the math.'],   // string or array of lines
  titleSize: 66,        // optional: fix the headline size (otherwise it auto-fits beside the card)
  textTop: 340,         // optional: vertical position of the text block
  card: { kind: …, … } }
```

**card.kind = 'form'**: browser window with sections of fields that fill in order.
```js
{ kind: 'form', title: 'New invoice', icon: 'doc', url: 'acme.com',
  sections: [ { title: 'Client', sub: 'Who is this invoice for?', note: 'Saved client found',   // note = green chip after the section
                fields: [ { label: 'Client name', value: 'HARBOR STUDIO', type: true, flex: 1.7 },  // type: typed with a caret
                          { label: 'Currency', value: 'USD', select: true }, { label: 'Hours', value: '32' } ] } ] }
```
Keep it to 3 sections × 2 fields so the card fits the frame.

**card.kind = 'rows'**: key/value rows shimmer in from skeletons; optional secondary verify card with a scan line.
`{ kind: 'rows', title: 'Account details', sub: 'Imported from your bank', icon: 'user', badge: 'Imported', rows: [['Full name','ALEX MORGAN'], …], secondary: { title: 'ID check', sub: 'Automatic', icon: 'passport', ok: 'Identity verified' } }`

**card.kind = 'progress'**: items generate one by one; optional notification drops in afterwards.
`{ kind: 'progress', title: 'Invoice #1042', pending: 'Preparing…', done: '4 files ready', items: [['Invoice','1 page · PDF'], …], notification: { from: 'Acme', text: '…', time: 'now' } }`

**card.kind = 'sign'**: document page, a signature draws itself, then status chips.
`{ kind: 'sign', kicker: 'Contract 1 of 2', title: 'Service agreement', fieldLabel: 'Signature', chips: [ { text: 'Signed' }, { text: 'Sent to client', icon: 'send' } ] }`

**card.kind = 'chat'**: phone with a conversation. `me` messages type in; `them` messages get typing dots first.
`{ kind: 'chat', name: 'Acme Support', status: 'Online now', placeholder: 'Message Acme…', messages: [ { from: 'me', text: '…' }, { from: 'them', text: '…' } ], choices: ['Start screen share', "I'll keep chatting"], choiceIcon: 'screen', toast: { title: 'Screen sharing', sub: 'Connected', icon: 'screen' } }`

**card.kind = 'html'**: escape hatch. Elements with class `dev` get the standard rise-in.
`{ kind: 'html', need: 6, html: '<div class="card dev" style="left:1000px;top:300px;width:600px;height:400px">…</div>', update(lt, api) { /* api: { tin, tout, wrap, Engine, seg, E, css, block } */ }, cues: [ { type: 'pop', t: 2 } ] }`

### pricing
`{ type: 'pricing', title: 'Simple pricing.', accent: 'No surprises.', highlight: 1, plans: [ { name: 'Pro', prefix: '$', value: '12', suffix: '/mo', tag: 'Most popular', tagTone: 'warm', bullets: ['…'] } ], footnote: '…' }`

### statement
`{ type: 'statement', lines: ['Calm.', 'Simple.', 'Paid on time.'], footer: { stars: 5, text: 'Loved by freelancers' } }`

### outro
`{ type: 'outro', lead: 'Less admin. More work you love.', script: 'Go make things.', cta: 'Start free', url: 'acme.com', sub: '…' }`
Drop `lead`/`script` for a shorter logo-only ending.

## icons

`check shield lock briefcase building user users userok pin calc chart doc pen sparkle passport
screen send globe arrow bolt card calendar bell mail cloud gear rocket heart star search chat`
(unknown names fall back to `sparkle`). Add more in `IC` at the top of `template/scenes.js`.

## sound cues

Scenes emit cues automatically (`whoosh` on entrances, `type` per keystroke, `tick` per field,
`pop` when things land, `chime` on success moments). `score.py` mixes them under the music.
Custom `html` cards can add their own `cues: [{ type, t, pan?, f?, root? }]` with `t` relative to the scene.
