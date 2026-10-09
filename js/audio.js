/* 퇴마 서바이버(가제) — 소리. 파일 없이 브라우저에서 직접 합성합니다.
   효과음 + 국악풍 배경음(가야금 뜯는 소리·북·대금 비슷한 음색, 5음계) */
(function () {
let ac = null, master = null, sfxBus = null, bgmBus = null, noiseBuf = null;
const opt = { sfx: true, bgm: true };
const last = {};

function ctx() {
  if (ac) return ac;
  try {
    // iOS: 무음(진동) 스위치가 켜져 있어도 소리가 나도록
    if (navigator.audioSession) try { navigator.audioSession.type = 'playback'; } catch (e) {}
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 1.5; master.connect(ac.destination);
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; comp.connect(master);
    sfxBus = ac.createGain(); sfxBus.gain.value = opt.sfx ? 1 : 0; sfxBus.connect(comp);
    bgmBus = ac.createGain(); bgmBus.gain.value = opt.bgm ? 0.8 : 0; bgmBus.connect(comp);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ac = null; }
  return ac;
}
/* 첫 터치·클릭·키 입력에서 소리 잠금 해제 (모바일 브라우저 규칙) */
function unlock() {
  const a = ctx(); if (!a) return;
  if (a.state === 'suspended') a.resume();
  try { const b = a.createBuffer(1, 1, 22050), s = a.createBufferSource(); s.buffer = b; s.connect(a.destination); s.start(0); } catch (e) {}
}
['pointerdown', 'touchend', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, unlock, { capture: true, passive: true }));

/* ───── 기본 음 ───── */
function osc(f, t0, dur, { type = 'triangle', vol = 0.1, slide = 0, attack = 0.005, bus, lp = 0, vib = 0 } = {}) {
  const a = ac, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t0);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t0 + dur);
  if (vib) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 5.2; lg.gain.value = f * vib; l.connect(lg).connect(o.frequency); l.start(t0); l.stop(t0 + dur + 0.05); }
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + attack); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let out = g;
  if (lp) { const fl = a.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; g.connect(fl); out = fl; }
  o.connect(g); out.connect(bus || sfxBus); o.start(t0); o.stop(t0 + dur + 0.05);
}
function noise(t0, dur, { vol = 0.1, lp = 1200, hp = 0, bus } = {}) {
  const a = ac, s = a.createBufferSource(), g = a.createGain(), f = a.createBiquadFilter();
  s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = lp;
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let n = s.connect(f); if (hp) { const h = a.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = hp; n = n.connect(h); }
  n.connect(g).connect(bus || sfxBus); s.start(t0); s.stop(t0 + dur + 0.02);
}
/* 악기 */
const pluck = (f, t, v = 0.12, bus) => { osc(f, t, 0.9, { type: 'triangle', vol: v, attack: 0.003, bus, lp: 2600 }); osc(f * 2, t, 0.35, { type: 'sine', vol: v * 0.35, attack: 0.002, bus }); };
const flute = (f, t, d, v = 0.05, bus) => osc(f, t, d, { type: 'sine', vol: v, attack: 0.12, bus, vib: 0.012 });
const buk = (t, v = 0.5, bus) => { osc(110, t, 0.35, { type: 'sine', vol: v, slide: -60, attack: 0.002, bus }); noise(t, 0.08, { vol: v * 0.25, lp: 900, bus }); };
const janggu = (t, v = 0.18, bus) => { noise(t, 0.07, { vol: v, lp: 5000, hp: 1500, bus }); osc(380, t, 0.06, { type: 'triangle', vol: v * 0.5, slide: -120, bus }); };
const bass = (f, t, d, v = 0.16, bus) => osc(f, t, d, { type: 'sine', vol: v, attack: 0.01, bus });

/* ───── 효과음 ───── */
const P = {
  swing: t => { noise(t, 0.12, { vol: 0.18, lp: 2500, hp: 400 }); osc(260, t, 0.1, { type: 'triangle', vol: 0.06, slide: -150 }); },
  throw: t => { noise(t, 0.06, { vol: 0.08, lp: 6000, hp: 2000 }); osc(1100, t, 0.05, { type: 'triangle', vol: 0.03, slide: 400 }); },
  thunder: t => { noise(t, 0.4, { vol: 0.3, lp: 1400 }); osc(90, t, 0.3, { type: 'sawtooth', vol: 0.08, slide: -50, lp: 600 }); },
  wind: t => noise(t, 0.3, { vol: 0.12, lp: 1800, hp: 500 }),
  bell: t => { osc(1320, t, 0.5, { type: 'sine', vol: 0.07 }); osc(1980, t, 0.35, { type: 'sine', vol: 0.04 }); osc(2640, t, 0.2, { type: 'sine', vol: 0.02 }); },
  soul: t => osc(600, t, 0.18, { type: 'sine', vol: 0.06, slide: 500 }),
  quake: t => { osc(65, t, 0.4, { type: 'sine', vol: 0.3, slide: -25 }); noise(t, 0.25, { vol: 0.15, lp: 400 }); },
  bossatk: t => osc(200, t, 0.12, { type: 'square', vol: 0.03, slide: -80, lp: 1200 }),
  coin: t => { osc(1568, t, 0.07, { type: 'square', vol: 0.03, lp: 4000 }); osc(2093, t + 0.05, 0.1, { type: 'square', vol: 0.03, lp: 4000 }); },
  heal: t => { osc(523, t, 0.15, { type: 'sine', vol: 0.08 }); osc(784, t + 0.08, 0.2, { type: 'sine', vol: 0.08 }); },
  magnet: t => osc(400, t, 0.4, { type: 'sine', vol: 0.08, slide: 800 }),
  level: t => [523, 659, 784].forEach((f, i) => pluck(f, t + i * 0.07, 0.14)),
  hurt: t => { osc(150, t, 0.12, { type: 'sawtooth', vol: 0.08, slide: -60, lp: 900 }); noise(t, 0.06, { vol: 0.08, lp: 1500 }); },
  boss: t => { buk(t, 0.7); buk(t + 0.35, 0.7); buk(t + 0.7, 0.9); osc(98, t, 1.2, { type: 'sawtooth', vol: 0.05, lp: 500 }); },
  chest: t => [784, 988, 1175, 1568].forEach((f, i) => pluck(f, t + i * 0.06, 0.12)),
  evo: t => { [523, 659, 784, 1047, 1319].forEach((f, i) => pluck(f, t + i * 0.08, 0.15)); osc(1047, t + 0.4, 0.8, { type: 'sine', vol: 0.06 }); },
  clear: t => { [392, 523, 659, 784, 1047].forEach((f, i) => pluck(f, t + i * 0.12, 0.16)); buk(t, 0.5); buk(t + 0.6, 0.6); },
  dead: t => { [392, 330, 262, 196].forEach((f, i) => pluck(f, t + i * 0.18, 0.13)); osc(130, t, 1, { type: 'sine', vol: 0.1, slide: -60 }); },
  click: t => osc(880, t, 0.04, { type: 'triangle', vol: 0.05 }),
};
function play(k) {
  if (!opt.sfx) return; const a = ctx(); if (!a || a.state !== 'running') return;
  const n = performance.now(); if (last[k] && n - last[k] < (k === 'coin' ? 45 : 70)) return; last[k] = n;
  try { P[k] && P[k](a.currentTime + 0.01); } catch (e) {}
}

/* ───── 배경음 (5음계 자동 작곡 루프) ───── */
const N = m => 440 * Math.pow(2, (m - 69) / 12);
// 평조(솔라도레미 계열) / 계면조풍(단조) 음계
const PYEONG = [0, 2, 5, 7, 9], GYEMYEON = [0, 3, 5, 7, 10];
const SONGS = {
  menu:   { bpm: 72,  root: 62, scale: PYEONG,   drums: 'slow',  dens: 0.35, flute: true },
  battle: { bpm: 104, root: 57, scale: PYEONG,   drums: 'gutgeori', dens: 0.55, flute: false },
  battle2:{ bpm: 108, root: 55, scale: GYEMYEON, drums: 'gutgeori', dens: 0.55, flute: false },
  boss:   { bpm: 132, root: 52, scale: GYEMYEON, drums: 'jajinmori', dens: 0.7, flute: true },
};
let song = null, songKey = '', step = 0, nextT = 0, timer = null, seed = 1, phrase = [];
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function makePhrase(s) {
  // 4마디 × 8칸 선율. 같은 동기를 반복·변형해서 노래처럼 들리게
  const deg = () => s.scale[(rnd() * 5) | 0] + 12 * ((rnd() < 0.3) ? 1 : 0);
  const motif = Array.from({ length: 8 }, (_, i) => (i % 2 === 0 || rnd() < s.dens) ? deg() : null);
  const ph = [];
  for (let bar = 0; bar < 4; bar++) for (let i = 0; i < 8; i++) { let n = motif[i]; if (bar === 2 && n != null && rnd() < 0.5) n = deg(); if (bar === 3 && i >= 6) n = i === 6 ? s.scale[0] + 12 : null; ph.push(n); }
  return ph;
}
const BASSLINE = [0, 0, 7, 5];   // 마디별 베이스(근음 기준 반음)
function tick() {
  if (!song || !ac) return;
  const spb = 60 / song.bpm / 2;   // 8분음표
  while (nextT < ac.currentTime + 0.15) {
    const i = step % 32, bar = (i / 8) | 0, t = nextT, b = bgmBus;
    // 선율
    const n = phrase[i]; if (n != null) pluck(N(song.root + 12 + n), t, 0.09, b);
    // 베이스
    if (i % 8 === 0) bass(N(song.root - 12 + BASSLINE[bar]), t, spb * 7, 0.13, b);
    // 대금
    if (song.flute && i % 16 === 0) flute(N(song.root + 24 + song.scale[(rnd() * 5) | 0]), t, spb * 12, 0.035, b);
    // 장단
    const k = i % 8;
    if (song.drums === 'slow') { if (k === 0) buk(t, 0.3, b); if (k === 6) janggu(t, 0.08, b); }
    else if (song.drums === 'gutgeori') { if (k === 0) buk(t, 0.45, b); if (k === 3) janggu(t, 0.12, b); if (k === 4) buk(t, 0.25, b); if (k === 6 || k === 7) janggu(t, 0.08, b); }
    else { if (k % 2 === 0) buk(t, k === 0 ? 0.55 : 0.3, b); janggu(t, k % 2 ? 0.1 : 0.05, b); }
    step++; nextT += spb;
    if (step % 128 === 0) phrase = makePhrase(song);   // 16마디마다 새 선율
  }
}
function music(key) {
  if (key === songKey) return; songKey = key;
  if (timer) { clearInterval(timer); timer = null; }
  if (!key) return;
  const a = ctx(); if (!a) return;
  song = SONGS[key]; seed = [...key].reduce((x, c) => x * 31 + c.charCodeAt(0), 7) % 2147483646 + 1;
  phrase = makePhrase(song); step = 0; nextT = a.currentTime + 0.1;
  timer = setInterval(tick, 40);
}
function setOpts(o) {
  Object.assign(opt, o);
  if (ac) { sfxBus.gain.setTargetAtTime(opt.sfx ? 1 : 0, ac.currentTime, 0.05); bgmBus.gain.setTargetAtTime(opt.bgm ? 0.8 : 0, ac.currentTime, 0.2); }
}
document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });

window.AUDIO = { play, unlock, music, setOpts, _dbg: () => ({ ac, master }) };
})();
