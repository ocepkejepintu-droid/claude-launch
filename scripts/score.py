# Calm ambient score: warm pad + felt keys + soft sub + airy shimmer, light lo-fi pulse,
# plus subtle UI foley (pops, ticks, whooshes) placed from cues.json written by the film.
# Usage: python3 score.py <cues.json> <out.wav>
# cues.json comes from the film page (window.CUES): duration, scene-derived foley events, and
# optional music settings {bpm, transpose (semitones), pulse (bool)} from film.config.js.
import sys, json, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
cues = json.load(open(sys.argv[1]))
DUR = cues['duration']
N = int(DUR * SR) + SR
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N)

MUSIC = cues.get('music') or {}
BPM = float(MUSIC.get('bpm', 76))
TRANSPOSE = int(MUSIC.get('transpose', 0))
PULSE = MUSIC.get('pulse', True)
BEAT = 60 / BPM
BAR = BEAT * 4

def hz(n): return 440.0 * 2 ** ((n + TRANSPOSE - 69) / 12)
def lp(x, fc, o=2): return sosfilt(butter(o, fc / (SR / 2), 'low', output='sos'), x)
def hp(x, fc, o=2): return sosfilt(butter(o, fc / (SR / 2), 'high', output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo / (SR / 2), hi / (SR / 2)], 'band', output='sos'), x)

def put(sig, t, pan=0.0, g=1.0):
    i = int(t * SR)
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    s = sig[: N - i] * g
    L[i:i + len(s)] += s * np.sqrt(0.5 * (1 - pan))
    R[i:i + len(s)] += s * np.sqrt(0.5 * (1 + pan))

def env_adsr(n, a, d, s, r, hold):
    t = np.arange(n) / SR
    e = np.where(t < a, t / a, 1.0)
    e = np.where((t >= a) & (t < a + d), 1 - (1 - s) * (t - a) / d, e)
    e = np.where(t >= a + d, s, e)
    rel = np.clip((t - hold) / r, 0, 1)
    return e * (1 - rel) * (t < hold + r)

# chord progression (Fmaj9 - Am7 - Dm9 - Bbmaj7(#11)) — soft, unresolved, warm
PROG = [
    [41, 53, 57, 60, 64, 67],   # Fmaj9
    [45, 52, 55, 60, 64, 67],   # Am7 (add C/G)
    [38, 53, 57, 60, 62, 65],   # Dm9
    [46, 53, 57, 62, 65, 69],   # Bbmaj7
]

def pad_note(f, dur, g):
    n = int((dur + 3.0) * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for det in (-0.07, 0.0, 0.06):
        ph = rng.uniform(0, 2 * np.pi)
        ff = f * 2 ** (det / 12)
        # band-limited-ish saw via few harmonics
        for k in range(1, 9):
            x += np.sin(2 * np.pi * ff * k * t + ph * k) / k * (0.85 ** k)
    x = lp(x, 1400 + 400 * np.sin(2 * np.pi * 0.05 * t).mean())
    e = env_adsr(n, 1.8, 1.0, 0.8, 2.6, dur)
    lfo = 1 + 0.08 * np.sin(2 * np.pi * 0.21 * t + rng.uniform(0, 6))
    return x * e * lfo * g

def key_note(f, dur, g):
    # felt piano: sine partials w/ fast decay on highs, soft hammer
    n = int((dur + 2.5) * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for k, (a, dec) in enumerate([(1, 1.6), (0.45, 0.9), (0.18, 0.5), (0.08, 0.3), (0.04, 0.2)], start=1):
        x += a * np.sin(2 * np.pi * f * k * (1 + 0.0004 * k * k) * t) * np.exp(-t / (dec * (1 + 200 / f)))
    hammer = lp(rng.standard_normal(n), 2500) * np.exp(-t / 0.006) * 0.05
    x = (x + hammer) * np.minimum(t / 0.004, 1)
    x *= np.clip(1 - (t - dur) / 0.8, 0, 1)
    return lp(x, 3200) * g

def sub_note(f, dur, g):
    n = int((dur + 1.0) * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.15 * np.sin(4 * np.pi * f * t)
    return x * env_adsr(n, 0.25, 0.4, 0.85, 0.9, dur) * g

def kick(g):
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 48 + 70 * np.exp(-t / 0.04)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16) * g

def hat(g):
    n = int(0.12 * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 7000) * np.exp(-t / 0.025) * g

def rim(g):
    n = int(0.2 * SR); t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 900, 2600) * np.exp(-t / 0.03) + 0.4 * np.sin(2 * np.pi * 1700 * t) * np.exp(-t / 0.015)
    return x * g

# ---- arrangement -------------------------------------------------------------------
intro_end = cues.get('beat_in', 6.0)          # pulse enters after the opening title
outro = cues.get('outro', DUR - 8.0)          # pulse leaves for the end card
nbars = int(np.ceil(DUR / BAR)) + 1
for b in range(nbars):
    t0 = b * BAR
    if t0 > DUR: break
    ch = PROG[b % 4]
    fade = min(1.0, (DUR - t0) / 6.0)
    # pad
    for nn in ch[1:]:
        put(pad_note(hz(nn), BAR, 0.012 * fade), t0, pan=rng.uniform(-0.5, 0.5))
    # sub
    put(sub_note(hz(ch[0] - 12 if ch[0] > 40 else ch[0]), BAR * 0.95, 0.10 * fade), t0)
    # keys: sparse arpeggio, gentle swing
    pattern = [(0.0, 3), (1.0, 4), (1.5, 5), (2.5, 4), (3.0, 2)] if b % 2 == 0 else [(0.0, 2), (0.75, 4), (2.0, 5), (3.25, 3)]
    for pos, idx in pattern:
        tt = t0 + pos * BEAT + rng.uniform(0, 0.012)
        if tt < 1.2: continue
        put(key_note(hz(ch[idx] + 12), BEAT * 1.5, 0.05 * fade * rng.uniform(0.75, 1.0)), tt, pan=rng.uniform(-0.35, 0.35))
    # pulse
    if PULSE and intro_end <= t0 < outro:
        for q in range(4):
            tq = t0 + q * BEAT
            if q in (0, 2): put(kick(0.16), tq)
            if q in (1, 3): put(rim(0.05), tq, pan=0.15)
            put(hat(0.022), tq + BEAT * 0.5 + 0.02, pan=-0.3)
            put(hat(0.012), tq + BEAT * 0.75 + 0.02, pan=0.3)

# airy shimmer bed
n = N; t = np.arange(n) / SR
air = bp(rng.standard_normal(n), 3000, 9000) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t)) * 0.004
L += air; R += np.roll(air, 1234)

# ---- foley from the film's cue list ------------------------------------------------
def pop(g, f=900):
    n = int(0.18 * SR); t = np.arange(n) / SR
    fr = f * (1 + 0.6 * np.exp(-t / 0.02))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.05) * g

def tick(g):
    n = int(0.05 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 2500, 6000) * np.exp(-t / 0.006) * g

def whoosh(g, d=0.9):
    n = int(d * SR); t = np.arange(n) / SR
    e = np.sin(np.pi * t / d) ** 2
    x = rng.standard_normal(n)
    lo = lp(x, 900); hi = bp(x, 1200, 5000)
    sweep = t / d
    return (lo * (1 - sweep) + hi * sweep) * e * g

def chime(g, root=72):
    x = key_note(hz(root), 0.6, 1.0)
    y = key_note(hz(root + 7), 0.6, 0.6)
    out = np.zeros(max(len(x), len(y) + int(0.09 * SR)))
    out[:len(x)] += x; out[int(0.09 * SR):int(0.09 * SR) + len(y)] += y
    return out * g

for c in cues['events']:
    k, tt = c['type'], c['t']
    pan = c.get('pan', 0.0)
    if k == 'pop': put(pop(0.05, c.get('f', 900)), tt, pan)
    elif k == 'tick': put(tick(0.035), tt, pan)
    elif k == 'type': put(tick(0.012), tt, pan)
    elif k == 'whoosh': put(whoosh(0.035, c.get('d', 0.9)), tt - c.get('d', 0.9) * 0.5, pan)
    elif k == 'chime': put(chime(0.075, c.get('root', 72)), tt, pan)

# ---- master: reverb, glue, loudness -------------------------------------------------
ir_n = int(3.2 * SR); ti = np.arange(ir_n) / SR
irL = rng.standard_normal(ir_n) * np.exp(-ti / 0.9); irR = rng.standard_normal(ir_n) * np.exp(-ti / 0.9)
irL = lp(irL, 5000); irR = lp(irR, 5000)
irL /= np.sqrt((irL ** 2).sum()); irR /= np.sqrt((irR ** 2).sum())
wetL = fftconvolve(L, irL)[:N]; wetR = fftconvolve(R, irR)[:N]
mixL = L * 0.75 + wetL * 0.5; mixR = R * 0.75 + wetR * 0.5
mixL = hp(mixL, 28); mixR = hp(mixR, 28)
# fades
tt = np.arange(N) / SR
fade = np.clip(tt / 1.5, 0, 1) * np.clip((DUR - tt) / 2.5, 0, 1)
mixL *= fade; mixR *= fade
# gentle soft clip + normalize to ~-16 LUFS-ish (RMS target)
st = np.stack([mixL, mixR])[:, : int(DUR * SR)]
rms = np.sqrt((st ** 2).mean())
st *= 0.12 / max(rms, 1e-9)
st = np.tanh(st * 1.1) / np.tanh(1.1)
st *= 0.89 / max(np.abs(st).max(), 1e-9) if np.abs(st).max() > 0.89 else 1.0
pcm = (st.T * 32767).astype(np.int16)
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote', sys.argv[2], f'{DUR:.2f}s')
