/* 퇴마 서바이버(가제) — 소리. 파일 없이 브라우저에서 직접 합성합니다.
   효과음 + 국악풍 배경음(가야금 뜯는 소리·북·대금 비슷한 음색, 5음계) */
(function () {
let ac = null, master = null, sfxBus = null, bgmBus = null, synthBus = null, noiseBuf = null;
const opt = { sfx: true, bgm: true };
const BGM_VOL = 0.52;   // 배경음 크기 (이전 0.8의 65%)
/* 파일로 된 소리가 snd/ 폴더에 있으면 합성음 대신 그 파일을 씀 (sfx_이름.mp3, bgm_menu.mp3 등) */
const FILES = {}, BGM_KEYS = ['menu', 'battle', 'battle2', 'boss'];
let bgmSrc = null;
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
    bgmBus = ac.createGain(); bgmBus.gain.value = opt.bgm ? BGM_VOL : 0; bgmBus.connect(comp);
    synthBus = ac.createGain(); synthBus.gain.value = 0.78; synthBus.connect(bgmBus);   // 합성 배경음을 이전 곡과 같은 크기로
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { ac = null; }
  return ac;
}
function loadFiles(base) {
  const a = ctx(); if (!a) return;
  // snd/list.json 에 적힌 파일만 불러옴 (예: ["bgm_menu", "sfx_coin"])
  fetch(base + 'list.json').then(r => r.ok ? r.json() : []).then(names => { for (const n of names) fetch(base + n + '.mp3').then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => a.decodeAudioData(b)).then(buf => { FILES[n] = buf; if (n === 'bgm_' + songKey) { const k = songKey; songKey = ''; music(k); } }).catch(() => {}); }).catch(() => {});
}
function playBuf(buf, bus, loop, vol = 1) { const s = ac.createBufferSource(), g = ac.createGain(); s.buffer = buf; s.loop = !!loop; g.gain.value = vol; s.connect(g).connect(bus); s.start(); return s; }
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
  try { if (FILES['sfx_' + k]) playBuf(FILES['sfx_' + k], sfxBus); else P[k] && P[k](a.currentTime + 0.01); } catch (e) {}
}

/* ───── 배경음 (국악 퓨전 · 긴장감) ─────
   가야금·거문고 반복 리듬 + 해금·피리 선율(시김새: 밀어 올리기·흘러내리기·떠는 소리) + 북·장구·꽹과리·징 장단.
   전투 곡은 시간이 갈수록 악기가 늘어남(intensity 0~1). */
const N = m => 440 * Math.pow(2, (m - 69) / 12);
const GYE = [0, 3, 5, 7, 10];          // 계면조풍 5음 (단조)
const bow = (f, t, d, v, { type = 'sawtooth', lp = 1700, orn = '', bus } = {}) => {
  // 해금·피리: 활로 켜는/부는 긴 소리. orn: up(아래에서 밀어 올림) fall(끝을 흘려 내림) shake(점점 깊게 떠는 소리)
  const a = ac, o = a.createOscillator(), g = a.createGain(), fl = a.createBiquadFilter(), pk = a.createBiquadFilter();
  o.type = type; fl.type = 'lowpass'; fl.frequency.value = lp; pk.type = 'peaking'; pk.frequency.value = f * 2.2; pk.Q.value = 2; pk.gain.value = 5;
  const fr = o.frequency;
  if (orn.includes('up')) { fr.setValueAtTime(f * 0.89, t); fr.exponentialRampToValueAtTime(f, t + Math.min(0.18, d * 0.3)); } else fr.setValueAtTime(f, t);
  if (orn.includes('fall') && d > 0.4) { fr.setValueAtTime(f, t + d * 0.65); fr.exponentialRampToValueAtTime(f * 0.84, t + d); }
  const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t);
  lg.gain.linearRampToValueAtTime(f * (orn.includes('shake') ? 0.035 : 0.01), t + d * 0.8); l.connect(lg).connect(fr); l.start(t); l.stop(t + d + 0.1);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.07); g.gain.setValueAtTime(v, t + d * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.08);
  o.connect(fl).connect(pk).connect(g).connect(bus); o.start(t); o.stop(t + d + 0.12);
};
const gaya = (f, t, v, bus) => { osc(f, t, 0.5, { type: 'triangle', vol: v, attack: 0.002, bus, lp: 3000 }); osc(f * 2.01, t, 0.18, { type: 'sine', vol: v * 0.4, attack: 0.001, bus }); };
const geomungo = (f, t, v, bus) => { osc(f, t, 0.45, { type: 'sawtooth', vol: v, attack: 0.004, bus, lp: 700 }); noise(t, 0.03, { vol: v * 0.6, lp: 1500, hp: 300, bus }); };
const jing = (f, t, v, bus) => { osc(f, t, 3.2, { type: 'sine', vol: v, attack: 0.03, bus, vib: 0.006 }); osc(f * 1.47, t, 2.4, { type: 'sine', vol: v * 0.35, attack: 0.05, bus }); osc(f * 2.13, t, 1.6, { type: 'sine', vol: v * 0.2, attack: 0.05, bus }); };
const kkwae = (t, v, bus) => { osc(1870, t, 0.09, { type: 'square', vol: v, attack: 0.001, bus, lp: 6000 }); osc(2790, t, 0.07, { type: 'square', vol: v * 0.6, attack: 0.001, bus, lp: 7000 }); noise(t, 0.05, { vol: v * 0.8, lp: 9000, hp: 4000, bus }); };
const drone = (f, t, d, v, bus) => { osc(f, t, d, { type: 'sawtooth', vol: v, attack: d * 0.3, bus, lp: 380 }); osc(f * 1.5, t, d, { type: 'sawtooth', vol: v * 0.6, attack: d * 0.4, bus, lp: 380 }); };

// 장단 기호: B 큰북 b 작은북 K 장구 강 k 장구 약 / 꽹과리: X 강 x 약
const SONGS = {
  // 메뉴: 어둡고 신비로운 긴장 (느린 진양 느낌)
  menu:   { bpm: 66, grid: 16, root: 50, bars: [0, 0, -4, -2], drum: 'B.......b.....k.', kk: '', low: 'x...............', arp: '', lead: 'haegeum', dens: 0.25, jing: 8, drone: 1 },
  // 전투 1: 3-3-2로 몰아가는 리듬
  battle: { bpm: 112, grid: 16, root: 45, bars: [0, 0, -4, -2], drum: 'B..k..b.B.k.Kk.k', kk: 'x...x...x...x.x.', low: 'x..x..x.x..x..x.', arp: '0.7.12.7.10.7.12.', lead: 'haegeum', dens: 0.5, jing: 4, drone: 0.6 },
  // 전투 2: 자진모리(12/8) 느낌
  battle2:{ bpm: 100, grid: 12, root: 43, bars: [0, -2, -4, -5], drum: 'B.kb.kB.kK.k', kk: 'x.xx.xx.xx.x', low: 'x..x..x..x..', arp: '0.7.10.12.7.3.', lead: 'piri', dens: 0.5, jing: 4, drone: 0.6 },
  // 보스: 휘모리 (빠르고 몰아침)
  // 백귀야행: 달밤의 요괴 행렬. 중모리풍 12박, 대금 선율과 낮게 깔린 소리, 멀리서 울리는 징·방울
  night:  { bpm: 84, grid: 12, root: 50, bars: [0, -2, -4, -5], drum: 'B..k..b..kk.', kk: '', low: 'x.....x..x..', arp: '12.10.7.3.0.3.', lead: 'daegeum', dens: 0.45, jing: 4, drone: 1.3, night: true },
  boss:   { bpm: 140, grid: 16, root: 47, bars: [0, 1, 0, -2], drum: 'B.kkb.kkB.kkb.KK', kk: 'X.x.X.x.X.x.XxXx', low: 'xx.xx.x.xx.xx.x.', arp: '0.12.7.12.10.12.7.15.', lead: 'piri', dens: 0.7, jing: 2, drone: 1 },
};
let song = null, songKey = '', step = 0, nextT = 0, timer = null, seed = 1, phrase = [], inten = 0.3;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
function makePhrase(s) {
  // 4마디 선율: 긴 음 위주(4분·2분음), 마디 끝은 흘려 내림. A-A'-B-A'' 구조로 귀에 남게
  const q = s.grid === 12 ? 3 : 4, bar = s.grid, out = [];
  let d = 2; const pick = () => { d = Math.max(0, Math.min(7, d + [-2, -1, -1, 1, 1, 2, 0][(rnd() * 7) | 0])); return d; };
  const motif = []; let pos = 0;
  while (pos < bar * 2) { const len = q * [1, 1, 2, 2, 3][(rnd() * (s.dens > 0.6 ? 3 : 5)) | 0]; if (rnd() < s.dens + 0.35) motif.push({ pos, deg: pick(), len: Math.min(len, bar * 2 - pos) }); pos += len; }
  for (const m of motif) out.push({ ...m, orn: rnd() < 0.5 ? 'up' : 'shake' });
  for (const m of motif) out.push({ ...m, pos: m.pos + bar * 2, deg: m.pos >= bar ? Math.max(0, m.deg - 1 - ((rnd() * 2) | 0)) : m.deg, orn: rnd() < 0.4 ? 'up shake' : 'shake' });
  if (out.length) { const L = out[out.length - 1]; L.orn += ' fall'; L.len = Math.max(L.len, q * 2); }
  return out;
}
const degNote = (s, d) => s.root + 12 + GYE[d % 5] + 12 * Math.floor(d / 5);
function tick() {
  if (!song || !ac) return;
  const s = song, G = s.grid, spb = 60 / s.bpm / (G === 12 ? 3 : 4), b = synthBus;
  while (nextT < ac.currentTime + 0.15) {
    const i = step % G, barN = ((step / G) | 0), bi = barN % 4, t = nextT, tr = s.bars[bi], hot = s === SONGS.boss || inten > 0.66, mid = s === SONGS.boss || inten > 0.33;
    // 깔리는 소리 (근음+5도)
    if (i === 0 && s.drone && bi % 2 === 0) drone(N(s.root - 12 + tr), t, spb * G * 2, 0.022 * s.drone, b);
    // 거문고: 낮은 반복 리듬
    if (s.low[i] === 'x') geomungo(N(s.root - 12 + tr + (i === G - 2 && bi === 3 ? 7 : 0)), t, 0.07, b);
    // 가야금: 잔잔히 굴리는 반주 (중간 이상 긴장도)
    if (s.arp && mid) { const ar = s.arp.split('.').filter(x => x !== ''); if (i % 2 === 0) gaya(N(s.root + 12 + tr + +ar[(i / 2) % ar.length]), t, 0.035 + (i % 4 === 0 ? 0.015 : 0), b); }
    // 장단
    const dc = s.drum[i];
    if (dc === 'B') buk(t, 0.5, b); else if (dc === 'b') buk(t, 0.3, b); else if (dc === 'K') janggu(t, 0.14, b); else if (dc === 'k') janggu(t, 0.08, b);
    if (hot && s.kk[i] && s.kk[i] !== '.') kkwae(t, s.kk[i] === 'X' ? 0.022 : 0.012, b);
    if (i === 0 && barN % s.jing === 0) jing(N(s.root - 5), t, 0.09, b);
    if (s.night) {   // 밤바람과 멀리서 들리는 방울(요괴 행렬)
      if (i === 0 && bi % 2 === 1) noise(t, spb * G * 1.6, { vol: 0.02, lp: 700, hp: 150, bus: b });
      if ((i === 4 || i === 10) && rnd() < 0.35 + inten * 0.4) { const f = N(s.root + 36 + GYE[(rnd() * 5) | 0]); osc(f, t, 0.9, { type: 'sine', vol: 0.018, bus: b }); osc(f * 2.76, t, 0.5, { type: 'sine', vol: 0.006, bus: b }); }
      if (inten > 0.6 && i % 3 === 0) janggu(t, 0.05, b);
    }
    // 선율 (16마디 중: 4마디 선율 → 4마디 쉼/응답 → 반복). 메뉴는 듬성듬성
    const cyc = barN % 16, inPh = cyc < 4 || (cyc >= 8 && cyc < 12) || (s === SONGS.boss) || (inten > 0.5 && cyc >= 12);
    if (inPh) {
      const ps = (barN % 4) * G + i;
      for (const n of phrase) if (n.pos === ps) {
        const f = N(degNote(s, n.deg) + tr * (s === SONGS.boss ? 1 : 0)), d = n.len * spb;
        if (s.lead === 'daegeum') { bow(f, t, d, 0.06, { type: 'triangle', lp: 3200, orn: n.orn + ' shake', bus: b }); noise(t, Math.min(0.25, d), { vol: 0.012, lp: 5000, hp: 1800, bus: b }); }   // 대금: 맑은 소리 + 숨소리
        else if (s.lead === 'piri') bow(f, t, d, 0.05, { type: 'square', lp: 2300, orn: n.orn, bus: b });
        else bow(f, t, d, 0.055, { type: 'sawtooth', lp: 1900, orn: n.orn, bus: b });
        if (hot && s !== SONGS.menu) bow(f / 2, t, d, 0.03, { type: 'sawtooth', lp: 1100, orn: n.orn, bus: b });   // 아쟁 겹치기
      }
    }
    step++; nextT += spb;
    if (step % (G * 8) === 0) phrase = makePhrase(s);   // 8마디마다 새 선율
  }
}
function intensity(v) { inten = Math.max(0, Math.min(1, v)); }
function music(key) {
  if (key === songKey) return; songKey = key;
  if (timer) { clearInterval(timer); timer = null; }
  if (bgmSrc) { try { bgmSrc.stop(); } catch (e) {} bgmSrc = null; }
  if (!key) return;
  const a = ctx(); if (!a) return;
  if (FILES['bgm_' + key]) { bgmSrc = playBuf(FILES['bgm_' + key], bgmBus, true); return; }
  song = SONGS[key]; seed = [...key].reduce((x, c) => x * 31 + c.charCodeAt(0), 7) % 2147483646 + 1;
  phrase = makePhrase(song); step = 0; nextT = a.currentTime + 0.1;
  timer = setInterval(tick, 40);
}
function setOpts(o) {
  Object.assign(opt, o);
  if (ac) { sfxBus.gain.setTargetAtTime(opt.sfx ? 1 : 0, ac.currentTime, 0.05); bgmBus.gain.setTargetAtTime(opt.bgm ? BGM_VOL : 0, ac.currentTime, 0.2); }
}
document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else ac.resume(); });

window.AUDIO = { play, unlock, music, intensity, setOpts, loadFiles, KEYS: () => Object.keys(P), _dbg: () => ({ ac, master }) };
})();
