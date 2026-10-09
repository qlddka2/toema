/* 퇴마록: 서바이버(가제) — 게임 규칙 코어. 화면(DOM)과 분리되어 있어 자동 시뮬레이션에도 그대로 쓰입니다. */
(function (G) {
const D = G.DATA || (typeof require !== 'undefined' ? require('./data.js') : null);
const TAU = Math.PI * 2;
const hyp = Math.hypot;

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function wpick(R, w) { let s = 0; for (const k in w) s += w[k]; let x = R() * s; for (const k in w) { x -= w[k]; if (x <= 0) return k; } return Object.keys(w)[0]; }

/* ───── 공간 분할(충돌 검사용) ───── */
const CELL = 48;
function grid(S) {
  const m = S.grid; m.clear();
  for (const e of S.en) { if (e.dead) continue; const k = (Math.floor(e.x / CELL) + 5000) * 10007 + Math.floor(e.y / CELL) + 5000; let a = m.get(k); if (!a) { a = []; m.set(k, a); } a.push(e); }
}
function near(S, x, y, r, out) {
  out.length = 0;
  const x0 = Math.floor((x - r - 40) / CELL), x1 = Math.floor((x + r + 40) / CELL), y0 = Math.floor((y - r - 40) / CELL), y1 = Math.floor((y + r + 40) / CELL);
  for (let cx = x0; cx <= x1; cx++) for (let cy = y0; cy <= y1; cy++) {
    const a = S.grid.get((cx + 5000) * 10007 + cy + 5000); if (!a) continue;
    for (const e of a) { if (!e.dead && hyp(e.x - x, e.y - y) < r + e.r) out.push(e); }
  }
  return out;
}
const TMP = [], TMP2 = [];

/* ───── 새 판 ───── */
function newRun(o) {
  const hero = D.HEROES[o.hero], ch = D.CHAPTERS[o.chapter - 1], meta = o.meta || {}, hard = !!o.hard, H = D.HARD;
  const S = {
    t: 0, R: rng(o.seed || (Math.random() * 1e9) | 0), heroId: o.hero, hero, ch, meta, hard, viewR: o.viewR || 420,
    mod: { hp: ch.hpMul * (hard ? H.hpMul : 1), dmg: ch.dmgMul * (hard ? H.dmgMul : 1), spawn: hard ? H.spawnMul : 1, bossHp: hard ? H.hpMul : 1 },
    goldMul: (hard ? H.goldMul : 1) * (hero.goldMul || 1) * (1 + (meta.greed || 0) * D.META.greed.per),
    p: { x: 0, y: 0, vx: 0, vy: 0, r: 12, hp: 1, maxhp: 1, fx: 1, fy: 0, face: 1, hurt: 0, moving: false, chill: 0, hzcd: 0 },
    W: [], P: {}, lv: 1, xp: 0, need: D.xpNeed(1), pendingLv: 0, chests: 0, chestN: [],
    rerolls: 1 + (meta.roll || 0), freeRev: meta.rev || 0, revived: false, revives: 0, over: '', kills: 0, gold: 0,
    en: [], pr: [], ep: [], pz: [], hz: [], warn: [], gems: [], drops: [], fx: [], tele: [], ev: [], grid: new Map(),
    spawnAcc: 0, evIdx: 0, boss: null, arena: null, midDone: false, bossT0: 0, bossT: 0, stashXp: 0, uid: 1, dlog: {},
    bosses: 0, evolved: [],
  };
  addWeapon(S, hero.weapon);
  recalc(S); S.p.hp = S.p.maxhp;
  return S;
}

function recalc(S) {
  const h = S.hero, P = S.P, m = S.meta, p = S.p;
  const old = p.maxhp;
  p.might = 1 + (P.might || 0) * D.PASSIVES.might.per + (m.atk || 0) * D.META.atk.per;
  p.cdMul = (h.cdMul || 1) * (1 - (P.haste || 0) * D.PASSIVES.haste.per);
  p.maxhp = Math.round(h.hp * (1 + (P.vigor || 0) * D.PASSIVES.vigor.per + (m.hp || 0) * D.META.hp.per));
  p.spd = h.speed * (1 + (P.swift || 0) * D.PASSIVES.swift.per + (m.spd || 0) * D.META.spd.per);
  p.mag = 42 * (1 + (P.magnet || 0) * D.PASSIVES.magnet.per + (m.mag || 0) * D.META.mag.per);
  p.regen = (P.regen || 0) * D.PASSIVES.regen.per + (h.regen || 0);
  p.xpMul = (1 + (m.xp || 0) * D.META.xp.per) * (h.xpMul || 1);
  p.armor = h.armor + (P.armor || 0) * D.PASSIVES.armor.per + (m.arm || 0);
  p.crit = D.CRIT_BASE + (P.luck || 0) * D.PASSIVES.luck.per + (m.luck || 0) * D.META.luck.per;
  p.area = h.areaMul || 1; p.kbMul = 1; p.critMul = D.CRIT_MUL;
  // 세트 효과
  const sc = {}; for (const w of S.W) { const k = D.SET_OF[w.id]; if (k) sc[k] = (sc[k] || 0) + 1; }
  S.sets = sc;
  for (const k in sc) for (const b of D.SETS[k].b) if (sc[k] >= b.n) {
    if (b.cd) p.cdMul *= 1 - b.cd; if (b.crit) p.crit += b.crit; if (b.might) p.might += b.might;
    if (b.kb) p.kbMul += b.kb; if (b.critDmg) p.critMul += b.critDmg; if (b.area) p.area *= 1 + b.area; if (b.regen) p.regen += b.regen;
  }
  if (old > 1 && p.maxhp > old) p.hp += p.maxhp - old;
}

function addWeapon(S, id) { S.W.push({ id, lv: 1, cd: 0.4, tm: 0, evo: false }); }
const wst = w => w.evo ? D.WEAPONS[w.id].evo.s : D.WEAPONS[w.id].lv[w.lv - 1];

/* ───── 레벨업·상자 선택지 ───── */
function evoReady(S) { return S.W.filter(w => !w.evo && w.lv >= D.MAX_LV && (S.P[D.WEAPONS[w.id].evo.with] || 0) > 0); }
function choices(S, n = 3) {
  if (S.chests > 0) { const ev = evoReady(S); if (ev.length) return [describe({ kind: 'evo', id: ev[0].id })]; }
  const R = S.R, pool = [];
  const owned = new Set(S.W.map(w => w.id));
  for (const w of S.W) if (w.lv < D.MAX_LV) pool.push({ kind: 'w', id: w.id, lv: w.lv + 1, wt: 1.2 });
  if (S.W.length < D.MAX_W) for (const id in D.WEAPONS) if (!owned.has(id)) pool.push({ kind: 'w', id, lv: 1, wt: (S.sets && S.sets[D.SET_OF[id]]) ? 1.35 : 1 });   // 세트를 맞출 수 있는 무기는 조금 더 잘 나옴
  const pc = Object.keys(S.P).length;
  for (const id in S.P) if (S.P[id] < D.MAX_LV) pool.push({ kind: 'p', id, lv: S.P[id] + 1, wt: 0.9 });
  if (pc < D.MAX_P) for (const id in D.PASSIVES) if (!(id in S.P)) {
    // 가진 무기의 진화 짝 패시브는 조금 더 잘 나오게
    const pair = S.W.some(w => D.WEAPONS[w.id].evo.with === id);
    pool.push({ kind: 'p', id, lv: 1, wt: pair ? 1.3 : 0.8 });
  }
  const out = [];
  const take = filt => { const c = pool.filter(x => filt(x) && !out.includes(x)); if (!c.length) return; let s = 0; for (const x of c) s += x.wt; let r = R() * s; for (const x of c) { r -= x.wt; if (r <= 0) { out.push(x); return; } } out.push(c[c.length - 1]); };
  take(x => x.kind === 'w');               // 공격 수단 최소 1개 보장
  while (out.length < n && out.length < pool.length) take(() => true);
  if (!out.length) { out.push({ kind: 'heal' }, { kind: 'gold' }); }
  for (const o of out) { describe(o); if (o.kind === 'w') o.set = setInfo(S, o.id, o.lv === 1); }
  return out;
}
function setInfo(S, id, adding) {
  const k = D.SET_OF[id]; if (!k) return null; const st = D.SETS[k], have = ((S.sets && S.sets[k]) || 0) + (adding ? 1 : 0);
  const next = st.b.find(b => b.n > ((S.sets && S.sets[k]) || 0) && b.n <= have);   // 이걸 고르면 새로 켜지는 효과
  return { key: k, name: st.name, color: st.color, have, max: st.b[st.b.length - 1].n, on: next ? next.desc : '' };
}
function describe(o) {
  if (o.kind === 'w') { const W = D.WEAPONS[o.id]; o.name = W.name; o.icon = W.icon; o.desc = o.lv === 1 ? W.desc : W.up[o.lv - 2]; o.pair = D.PASSIVES[W.evo.with].name; }
  else if (o.kind === 'p') { const P = D.PASSIVES[o.id]; o.name = P.name; o.icon = P.icon; o.desc = P.desc; }
  else if (o.kind === 'evo') { const W = D.WEAPONS[o.id]; o.name = W.evo.name; o.icon = W.icon; o.desc = W.evo.desc; o.from = W.name; }
  else if (o.kind === 'heal') { o.name = '인삼'; o.icon = 'heal'; o.desc = '체력 40% 회복'; }
  else { o.name = '엽전 꾸러미'; o.icon = 'gold'; o.desc = '금화 +25'; }
  return o;
}
function pick(S, o) {
  if (o.kind === 'w') { const w = S.W.find(x => x.id === o.id); if (w) w.lv = Math.min(D.MAX_LV, w.lv + 1); else { addWeapon(S, o.id); recalc(S); } }
  else if (o.kind === 'p') { S.P[o.id] = (S.P[o.id] || 0) + 1; recalc(S); }
  else if (o.kind === 'evo') { const w = S.W.find(x => x.id === o.id); if (w) { w.evo = true; S.evolved.push(o.id); S.ev.push({ k: 'evo', id: o.id }); } }
  else if (o.kind === 'heal') S.p.hp = Math.min(S.p.maxhp, S.p.hp + S.p.maxhp * 0.4);
  else addGold(S, 25);
  if (S.chests > 0) S.chests--; else if (S.pendingLv > 0) S.pendingLv--;
}
const paused = S => S.over || S.pendingLv > 0 || S.chests > 0;
const addGold = (S, v) => { S.gold += v * S.goldMul; };

/* ───── 스폰 ───── */
function mkEnemy(S, type, x, y) {
  const b = D.ENEMIES[type], t = S.t;
  const hp = Math.round(b.hp * S.mod.hp * D.hpScale(t));
  const e = { id: S.uid++, type, spr: b.spr, tint: b.tint, x, y, r: b.r, hp, max: hp, spd: b.spd * (1 + Math.min(t, 600) / 600 * 0.12), dmg: b.dmg * S.mod.dmg * D.dmgScale(t), xp: b.xp, ai: b.ai, mass: b.mass,
    elite: !!b.elite, kx: 0, ky: 0, hitcd: 0, flash: 0, slowT: 0, slow: 0, stun: 0, hb: {}, st: 0, tm: 1 + S.R() * 3, dx: 0, dy: 0, ph: S.R() * TAU, face: 1 };
  S.en.push(e); return e;
}
function ringPos(S, rad) { const a = S.R() * TAU; return [S.p.x + Math.cos(a) * rad, S.p.y + Math.sin(a) * rad]; }
function spawnBoss(S, id) {
  const B = D.BOSSES[id], a = S.R() * TAU;
  const hp = Math.round(B.hp * S.mod.bossHp);
  const e = { id: S.uid++, type: id, boss: true, def: B, spr: B.spr, name: B.name, x: S.p.x + Math.cos(a) * 230, y: S.p.y + Math.sin(a) * 230, r: B.r, hp, max: hp,
    spd: B.spd, dmg: B.dmg * S.mod.dmg, xp: 0, mass: 999, kx: 0, ky: 0, hitcd: 0, flash: 0, slowT: 0, slow: 0, stun: 0, hb: {}, face: 1, ang: a + Math.PI, gold: B.gold,
    st: 'idle', tm: 1.6, ai: 0, orb: a, trailT: 0, rage: false };
  e.final = S.t >= D.BOSS_TIME - 1; if (e.final) S.bossT0 = S.t;
  S.en.push(e); S.boss = e;
  S.arena = { x: S.p.x, y: S.p.y, r: 280 };
  if (B.segs) { e.segs = []; e.trail = []; for (let i = 0; i < B.segs; i++) { const s = { id: S.uid++, type: 'seg', seg: true, si: i, segSpr: B.segSpr, par: e, x: e.x, y: e.y, r: Math.max(9, 15 - i * 0.4), hp: 1, max: 1, mass: 999, kx: 0, ky: 0, hitcd: 0, flash: 0, slowT: 0, slow: 0, stun: 0, hb: {}, dmg: e.dmg * 0.5, face: 1 }; e.segs.push(s); S.en.push(s); } }
  S.ev.push({ k: 'boss', name: B.name, sub: B.sub, final: e.final, spr: B.spr });
}
function spawning(S, dt) {
  const ch = S.ch;
  while (S.evIdx < ch.events.length && S.t >= ch.events[S.evIdx][0]) {
    const [, k, a, b] = ch.events[S.evIdx++];
    if (k === 'ring') { const n = Math.round(b * S.mod.spawn); for (let i = 0; i < n; i++) { const an = i / n * TAU; mkEnemy(S, a, S.p.x + Math.cos(an) * 320, S.p.y + Math.sin(an) * 320); } S.ev.push({ k: 'warn', txt: '포위당했다!' }); }
    else if (k === 'elite') { const [x, y] = ringPos(S, S.viewR + 20); mkEnemy(S, a, x, y); S.ev.push({ k: 'warn', txt: D.ENEMIES[a].name + ' 출현' }); }
    else if (k === 'boss') { if (!S.boss) spawnBoss(S, a); else S.queuedBoss = a; }
  }
  if (S.queuedBoss && !S.boss) { spawnBoss(S, S.queuedBoss); S.queuedBoss = null; }
  let wv = ch.waves[0]; for (const w of ch.waves) if (S.t >= w[0]) wv = w;
  const rate = wv[1] * S.mod.spawn * (S.boss ? 0.45 : 1);
  S.spawnAcc += rate * dt;
  let alive = 0; for (const e of S.en) if (!e.dead && !e.seg) alive++;
  while (S.spawnAcc >= 1) { S.spawnAcc -= 1; if (alive >= D.ENEMY_CAP) continue; const [x, y] = ringPos(S, S.viewR + 30); mkEnemy(S, wpick(S.R, wv[2]), x, y); alive++; }
}

/* ───── 피해 ───── */
function hurtEnemy(S, e, dmg, kx, ky) {
  if (e.dead) return;
  if (e.seg) { e.flash = 0.1; e = e.par; if (e.dead) return; dmg *= 0.2; }
  const crit = S.R() < S.p.crit;
  dmg = Math.round(dmg * S.p.might * (0.9 + S.R() * 0.2) * (crit ? (S.p.critMul || D.CRIT_MUL) : 1));
  e.hp -= dmg; e.flash = 0.12;
  if (kx || ky) { const m = (S.p.kbMul || 1) / Math.max(1, e.mass); e.kx += kx * m; e.ky += ky * m; }
  if (S.fx.length < 140) S.fx.push({ k: 'num', x: e.x + (S.R() - 0.5) * 10, y: e.y - e.r, v: dmg, t: 0.6, big: e.boss, crit });
  if (e.hp <= 0) kill(S, e);
}
function kill(S, e) {
  e.dead = true;
  S.fx.push({ k: 'pop', x: e.x, y: e.y, r: e.r, t: 0.3, c: e.elite || e.boss ? '#ffd36b' : '#b9ff9a' });
  if (e.boss) {
    if (e.segs) for (const s of e.segs) { s.dead = true; S.fx.push({ k: 'pop', x: s.x, y: s.y, r: s.r, t: 0.4, c: '#ffd36b' }); }
    S.boss = null; S.arena = null; S.bosses++; addGold(S, e.gold); S.hz.length = 0; S.warn.length = 0;
    S.drops.push({ k: 'chest', x: e.x, y: e.y, n: e.final ? 1 : 2 });
    S.drops.push({ k: 'heal', x: e.x + 30, y: e.y });
    if (e.final) { S.bossT = S.t - S.bossT0; S.over = 'clear'; addGold(S, S.ch.clearGold); S.ev.push({ k: 'clear' }); }
    else { S.midDone = true; S.ev.push({ k: 'bossdown', name: e.name }); }
    return;
  }
  S.kills++;
  const aura = S.W.find(w => w.id === 'aura' && w.evo); if (aura) S.p.hp = Math.min(S.p.maxhp, S.p.hp + D.WEAPONS.aura.evo.s.heal);
  if (e.elite) { S.drops.push({ k: 'chest', x: e.x, y: e.y, n: 1 }); S.drops.push({ k: 'bag', x: e.x + 14, y: e.y }); }
  let v = e.xp + S.stashXp; S.stashXp = 0;
  S.gems.push({ x: e.x, y: e.y, v, fly: false, vs: 0 });
  if (S.gems.length > 360) { let fi = 0, fd = -1; for (let i = 0; i < S.gems.length; i++) { const g = S.gems[i], d = hyp(g.x - S.p.x, g.y - S.p.y); if (d > fd && !g.fly) { fd = d; fi = i; } } S.stashXp += S.gems[fi].v; S.gems.splice(fi, 1); }
  const r = S.R();
  if (r < 0.008) S.drops.push({ k: 'heal', x: e.x, y: e.y });
  else if (r < 0.011) S.drops.push({ k: 'magnet', x: e.x, y: e.y });
  else if (r < 0.061) S.drops.push({ k: 'coin', x: e.x, y: e.y });
}
function hurtPlayer(S, dmg, src, k) {
  const p = S.p; if (S.over) return;
  // 탄환·장판류는 맞은 직후 잠깐 무적 (한 프레임에 몰아서 맞는 것 방지)
  if (src && src !== 'mob' && src !== 'boss') { if (p.ifr > 0) return; p.ifr = 0.35; }
  const d = Math.max(1, Math.round(dmg - p.armor));
  S.dlog[src || 'mob'] = (S.dlog[src || 'mob'] || 0) + d;
  p.hp -= d; p.hurt = 0.18; S.ev.push({ k: 'hurt' });
  if (k === 'ice') p.chill = 1.2;
  if (p.hp <= 0) { p.hp = 0; S.over = 'dead'; S.ev.push({ k: 'dead' }); }
}
function revive(S) {
  const p = S.p; S.over = ''; S.revived = true; S.revives++; p.hp = Math.round(p.maxhp * 0.6);
  for (const e of S.en) { if (e.dead || e.boss || e.seg) continue; const d = hyp(e.x - p.x, e.y - p.y); if (d < 220) { const k = 600 / Math.max(20, d); e.kx += (e.x - p.x) * k / Math.max(1, e.mass); e.ky += (e.y - p.y) * k / Math.max(1, e.mass); e.hp -= 60; if (e.hp <= 0) kill(S, e); } }
  S.ep.length = 0; S.warn.length = 0; S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 220, t: 0.5, c: '#ffe08a' });
}

/* ───── 무기 ───── */
function nearestN(S, n, maxd) {
  const p = S.p, a = [];
  for (const e of S.en) { if (e.dead) continue; const d = hyp(e.x - p.x, e.y - p.y); if (d < maxd) a.push([d, e]); }
  a.sort((x, y) => x[0] - y[0]); return a.slice(0, n).map(x => x[1]);
}
/* 공격 동작(그림용): 근접 휘두르기 swing · 던지기 throw · 술법 cast · 내려찍기 stomp */
function anim(S, kind, a) { const q = S.p.atk; if (q && q.t > q.t0 * 0.5 && kind !== 'swing') return; const D0 = { swing: 0.26, throw: 0.18, cast: 0.3, stomp: 0.32 }[kind]; S.p.atk = { k: kind, a: a == null ? Math.atan2(S.p.fy, S.p.fx) : a, t: D0, t0: D0 }; }
function weapons(S, dt) {
  const p = S.p, A = p.area;
  for (const w of S.W) {
    const s = wst(w);
    if (w.id === 'beads') { beads(S, w, s, dt); continue; }
    if (w.id === 'aura') { w.tm -= dt; if (w.tm <= 0) { w.tm = s.tick * p.cdMul; for (const e of near(S, p.x, p.y, s.r * A, TMP)) { hurtEnemy(S, e, s.dmg, 0, 0); e.slowT = 0.6; e.slow = s.slow; } } continue; }
    if (w.id === 'bell' && w.second > 0) { w.second -= dt; if (w.second <= 0) bellWave(S, s); }
    w.cd -= dt; if (w.cd > 0) continue;
    w.cd = s.cd * p.cdMul;
    if (w.id === 'staff') {
      const tn = nearestN(S, 1, s.range * A + 40)[0], dirs = [tn ? Math.atan2(tn.y - p.y, tn.x - p.x) : Math.atan2(p.fy, p.fx)]; if (s.back) dirs.push(dirs[0] + Math.PI);
      const half = s.arc / 2 * Math.PI / 180, rr = s.range * A, mul = S.hero.meleeMul || 1;
      for (const an of dirs) {
        S.fx.push({ k: 'swing', x: p.x, y: p.y, a: an, arc: half * 2, r: rr, t: 0.2, t0: 0.2, evo: w.evo });
        for (const e of near(S, p.x, p.y, rr, TMP)) { let da = Math.atan2(e.y - p.y, e.x - p.x) - an; da = Math.atan2(Math.sin(da), Math.cos(da)); if (half >= Math.PI || Math.abs(da) <= half + 0.25) { const d = hyp(e.x - p.x, e.y - p.y) || 1; hurtEnemy(S, e, s.dmg * mul, (e.x - p.x) / d * s.kb, (e.y - p.y) / d * s.kb); } }
      }
      anim(S, 'swing', dirs[0]); S.ev.push({ k: 'sfx', s: 'swing' });
    } else if (w.id === 'talisman') {
      const tg = nearestN(S, s.n, 340);
      if (!tg.length) { w.cd = 0.15; continue; }
      for (let i = 0; i < s.n; i++) { const e = tg[i % tg.length]; const a = Math.atan2(e.y - p.y, e.x - p.x) + (i >= tg.length ? (i - tg.length + 1) * 0.18 : 0); S.pr.push({ k: 'tal', x: p.x, y: p.y, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, dmg: s.dmg, pierce: s.pierce, life: 1.3, r: 7, hit: new Set(), a, evo: w.evo }); }
      anim(S, 'throw', Math.atan2(tg[0].y - p.y, tg[0].x - p.x)); S.ev.push({ k: 'sfx', s: 'throw' });
    } else if (w.id === 'thunder') {
      const cand = []; for (const e of S.en) if (!e.dead && !e.seg && hyp(e.x - p.x, e.y - p.y) < 330) cand.push(e);
      if (!cand.length) { w.cd = 0.3; continue; }
      for (let i = 0; i < s.n; i++) {
        const e = (S.boss && i === 0 && S.R() < 0.5) ? S.boss : cand[(S.R() * cand.length) | 0];
        S.fx.push({ k: 'bolt', x: e.x, y: e.y, r: s.r * A, t: 0.25, seed: S.R(), evo: w.evo });
        for (const o of near(S, e.x, e.y, s.r * A, TMP)) hurtEnemy(S, o, s.dmg, 0, 0);
      }
      anim(S, 'cast'); S.ev.push({ k: 'sfx', s: 'thunder' });
    } else if (w.id === 'fan') {
      const tf = nearestN(S, 1, 260)[0], a0 = tf ? Math.atan2(tf.y - p.y, tf.x - p.x) : Math.atan2(p.fy, p.fx);
      for (let i = 0; i < s.dirs; i++) { const a = a0 + i * TAU / s.dirs; S.pr.push({ k: 'wind', x: p.x, y: p.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, dmg: s.dmg, w: s.w * A, life: s.range / 260, kb: s.kb, stun: s.stun || 0, hit: new Set(), a, pierce: 999, r: 12, evo: w.evo }); }
      anim(S, 'swing', a0); S.ev.push({ k: 'sfx', s: 'wind' });
    } else if (w.id === 'bell') {
      bellWave(S, s); anim(S, 'cast'); if (s.twice) w.second = 0.35;
    } else if (w.id === 'knives') {
      const tk = nearestN(S, 1, 320)[0], base = tk ? Math.atan2(tk.y - p.y, tk.x - p.x) : Math.atan2(p.fy, p.fx), n = s.n;
      for (let i = 0; i < n; i++) {
        const a = s.all ? base + i * TAU / n : base + (i - (n - 1) / 2) * 0.12;
        S.pr.push({ k: 'knife', x: p.x, y: p.y, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, dmg: s.dmg, pierce: s.pierce, life: 0.8, r: 6, hit: new Set(), a, evo: w.evo });
      }
      anim(S, 'throw', base); S.ev.push({ k: 'sfx', s: 'throw' });
    } else if (w.id === 'soulfire') {
      const cand = []; for (const e of S.en) if (!e.dead && !e.seg && hyp(e.x - p.x, e.y - p.y) < 320) cand.push(e);
      if (!cand.length) { w.cd = 0.3; continue; }
      for (let i = 0; i < s.n; i++) { const e = cand[(S.R() * cand.length) | 0], a = S.R() * TAU; S.pr.push({ k: 'soul', x: p.x, y: p.y, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, spd: s.spd, tgt: e, dmg: s.dmg, er: s.r * A, life: 3, r: 8, hit: new Set(), a, burn: s.burn, evo: w.evo }); }
      anim(S, 'cast'); S.ev.push({ k: 'sfx', s: 'soul' });
    } else if (w.id === 'quake') {
      const area = s.area * A, cand = []; for (const e of S.en) if (!e.dead && !e.seg && hyp(e.x - p.x, e.y - p.y) < area) cand.push(e);
      for (let i = 0; i < s.n; i++) {
        let x, y; if (cand.length && S.R() < 0.75) { const e = cand[(S.R() * cand.length) | 0]; x = e.x; y = e.y; } else { const a = S.R() * TAU, d = 30 + S.R() * area; x = p.x + Math.cos(a) * d; y = p.y + Math.sin(a) * d; }
        S.pz.push({ k: 'quake', x, y, r: s.r * A, delay: 0.25 + i * 0.04, dmg: s.dmg, stun: s.stun || 0, t: 0.25 + i * 0.04 + 0.4, evo: w.evo });
      }
      anim(S, 'stomp'); S.ev.push({ k: 'sfx', s: 'quake' });
    }
  }
}
function bellWave(S, s) { S.pr.push({ k: 'wave', x: S.p.x, y: S.p.y, r0: 0, rmax: s.r * S.p.area, t: 0, dur: 0.45, dmg: s.dmg, kb: s.kb, slow: s.slow, hit: new Set(), life: 0.45, vx: 0, vy: 0, mag: s.twice }); S.ev.push({ k: 'sfx', s: 'bell' }); }
function beads(S, w, s, dt) {
  const p = S.p; w.tm += dt * s.rot;
  w.pos = w.pos || [];
  w.pos.length = s.n;
  const rad = s.rad * p.area;
  for (let i = 0; i < s.n; i++) {
    const rr = s.big && i % 2 ? rad * 0.65 : rad, a = (s.big && i % 2 ? -w.tm * 1.2 : w.tm) + i / s.n * TAU, x = p.x + Math.cos(a) * rr, y = p.y + Math.sin(a) * rr;
    w.pos[i] = [x, y];
    for (const e of near(S, x, y, s.big ? 12 : 9, TMP)) { const k = 'b'; if ((e.hb[k] || 0) > S.t) continue; e.hb[k] = S.t + s.hitcd; const d = hyp(e.x - p.x, e.y - p.y) || 1; hurtEnemy(S, e, s.dmg, (e.x - p.x) / d * 40, (e.y - p.y) / d * 40); }
  }
}
function projectiles(S, dt) {
  const keep = [], p = S.p;
  for (const q of S.pr) {
    if (q.k === 'soul') {
      if (!q.tgt || q.tgt.dead) { let best = null, bd = 1e9; for (const e of S.en) { if (e.dead || e.seg) continue; const d = hyp(e.x - q.x, e.y - q.y); if (d < bd && d < 300) { bd = d; best = e; } } q.tgt = best; }
      if (q.tgt) { const a = Math.atan2(q.tgt.y - q.y, q.tgt.x - q.x), c = Math.atan2(q.vy, q.vx); let da = Math.atan2(Math.sin(a - c), Math.cos(a - c)); const na = c + Math.max(-5 * dt, Math.min(5 * dt, da)); q.vx = Math.cos(na) * q.spd; q.vy = Math.sin(na) * q.spd; q.a = na; }
    }
    if (q.k === 'wave') { q.x = p.x; q.y = p.y; q.t += dt; q.r0 = q.rmax * Math.min(1, q.t / q.dur); }
    else { q.x += q.vx * dt; q.y += q.vy * dt; }
    q.life -= dt;
    if (q.k === 'tal' || q.k === 'knife') {
      for (const e of near(S, q.x, q.y, q.r, TMP)) { const id = e.seg ? e.par.id : e.id; if (q.hit.has(id)) continue; q.hit.add(id); hurtEnemy(S, e, q.dmg, q.vx * 0.12, q.vy * 0.12); if (--q.pierce <= 0) { q.life = 0; break; } }
    } else if (q.k === 'soul') {
      const hitE = near(S, q.x, q.y, q.r, TMP)[0];
      if (hitE) { for (const o of near(S, q.x, q.y, q.er, TMP2)) hurtEnemy(S, o, q.dmg, 0, 0); S.fx.push({ k: 'boom', x: q.x, y: q.y, r: q.er, t: 0.3, c: '#7fd8ff' }); if (q.burn) S.pz.push({ k: 'burn', x: q.x, y: q.y, r: q.er * 0.9, t: 2.5, tick: 0, dmg: q.dmg * 0.25 }); q.life = 0; }
    } else if (q.k === 'wave') {
      for (const e of near(S, q.x, q.y, q.r0 + 6, TMP)) {
        if (q.hit.has(e.id)) continue; const d = hyp(e.x - q.x, e.y - q.y);
        if (d > q.r0 - 22 - e.r) { q.hit.add(e.id); hurtEnemy(S, e, q.dmg, (e.x - q.x) / (d || 1) * q.kb, (e.y - q.y) / (d || 1) * q.kb); e.slowT = 1.2; e.slow = q.slow; }
      }
      if (q.mag) for (const g of S.gems) if (hyp(g.x - q.x, g.y - q.y) < q.r0) g.fly = true;
    } else if (q.k === 'wind') {
      const sp = hyp(q.vx, q.vy), ux = q.vx / sp, uy = q.vy / sp, nx = -uy, ny = ux;
      for (const e of near(S, q.x, q.y, q.w / 2 + 10, TMP)) {
        const id = e.id; if (q.hit.has(id)) continue;
        const along = (e.x - q.x) * ux + (e.y - q.y) * uy, side = (e.x - q.x) * nx + (e.y - q.y) * ny;
        if (Math.abs(along) < 22 + e.r && Math.abs(side) < q.w / 2 + e.r) { q.hit.add(id); hurtEnemy(S, e, q.dmg, ux * q.kb, uy * q.kb); if (q.stun && !e.boss) e.stun = Math.max(e.stun || 0, q.stun); }
      }
    }
    if (q.life > 0) keep.push(q);
  }
  S.pr = keep;
  // 내 장판(지진·저승불)
  const zk = [];
  for (const z of S.pz) {
    z.t -= dt;
    if (z.k === 'quake') { z.delay -= dt; if (z.delay <= 0 && !z.done) { z.done = true; for (const e of near(S, z.x, z.y, z.r, TMP)) { hurtEnemy(S, e, z.dmg, 0, 0); if (z.stun && !e.boss) e.stun = z.stun; } S.fx.push({ k: 'rock', x: z.x, y: z.y, r: z.r, t: 0.45, evo: z.evo }); } }
    else if (z.k === 'burn') { z.tick -= dt; if (z.tick <= 0) { z.tick = 0.4; for (const e of near(S, z.x, z.y, z.r, TMP)) hurtEnemy(S, e, z.dmg, 0, 0); } }
    if (z.t > 0) zk.push(z);
  }
  S.pz = zk;
}

/* ───── 적 이동·공격 ───── */
function enemies(S, dt) {
  const p = S.p, far = S.viewR * 1.7;
  for (const e of S.en) {
    if (e.dead || e.seg) continue;
    e.flash = Math.max(0, e.flash - dt); e.hitcd -= dt; if (e.bite > 0) e.bite -= dt; if (e.cast > 0) e.cast -= dt;
    if (e.boss) { bossAI(S, e, dt); }
    else {
      let dx = p.x - e.x, dy = p.y - e.y; const d = hyp(dx, dy) || 1; dx /= d; dy /= d;
      if (d > far) { const [x, y] = ringPos(S, S.viewR + 30); e.x = x; e.y = y; continue; }
      let sp = e.spd * (e.slowT > 0 ? 1 - e.slow : 1); e.slowT -= dt;
      if (e.stun > 0) { e.stun -= dt; sp = 0; }
      if (e.ai === 'charge') {
        e.tm -= dt;
        if (e.st === 0) { if (e.tm <= 0 && d < 260) { e.st = 1; e.tm = 0.55; e.dx = dx; e.dy = dy; } }
        else if (e.st === 1) { sp = 0; if (e.tm <= 0) { e.st = 2; e.tm = 0.55; } }
        else { sp = e.stun > 0 ? 0 : e.spd * 3.6; dx = e.dx; dy = e.dy; if (e.tm <= 0) { e.st = 0; e.tm = 3 + S.R() * 2; } }
      } else if (e.ai === 'fly') { e.ph += dt * 5; const w = Math.sin(e.ph) * 0.7, ox = -dy * w, oy = dx * w; dx += ox; dy += oy; }
      else if (e.ai === 'zig') { e.ph += dt * 3.2; const w = Math.sin(e.ph) * 1.1, ox = -dy * w, oy = dx * w; dx += ox; dy += oy; const n = hyp(dx, dy) || 1; dx /= n; dy /= n; }
      e.x += (dx * sp + e.kx) * dt; e.y += (dy * sp + e.ky) * dt;
      if (Math.abs(dx) > 0.1) e.face = dx > 0 ? 1 : -1;
    }
    const kd = Math.exp(-9 * dt); e.kx *= kd; e.ky *= kd;
    if (e.hitcd <= 0 && hyp(p.x - e.x, p.y - e.y) < p.r + e.r - 2) { e.hitcd = 0.6; e.bite = 0.28; e.ba = Math.atan2(p.y - e.y, p.x - e.x); hurtPlayer(S, e.boss && e.st === 'dash' ? e.dmg * 1.3 : e.dmg, e.boss ? 'boss' : 'mob'); }
  }
  // 겹침 밀어내기
  for (const e of S.en) {
    if (e.dead || e.boss || e.seg) continue;
    for (const o of near(S, e.x, e.y, e.r, TMP)) {
      if (o === e || o.boss || o.seg) continue;
      const dx = e.x - o.x, dy = e.y - o.y, d = hyp(dx, dy) || 0.01, ov = e.r + o.r - d;
      if (ov > 0) { const f = ov * 0.5 * o.mass / (e.mass + o.mass); e.x += dx / d * f; e.y += dy / d * f; }
    }
  }
  // 뱀형 보스 몸통
  if (S.boss && S.boss.segs) { for (const s of S.boss.segs) { s.flash = Math.max(0, s.flash - dt); s.hitcd -= dt; if (s.hitcd <= 0 && hyp(p.x - s.x, p.y - s.y) < p.r + s.r - 2) { s.hitcd = 0.6; hurtPlayer(S, s.dmg, 'boss'); } } }
  // 적 탄환
  const keep = [];
  for (const q of S.ep) {
    if (q.home) { const a = Math.atan2(p.y - q.y, p.x - q.x), c = Math.atan2(q.vy, q.vx); let da = Math.atan2(Math.sin(a - c), Math.cos(a - c)); const na = c + Math.max(-q.home * dt, Math.min(q.home * dt, da)), sp = hyp(q.vx, q.vy); q.vx = Math.cos(na) * sp; q.vy = Math.sin(na) * sp; }
    q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
    if (hyp(q.x - p.x, q.y - p.y) < q.r + p.r - 3) { hurtPlayer(S, q.dmg, 'shot', q.k); q.life = 0; }
    if (q.life > 0) keep.push(q);
  }
  S.ep = keep;
  // 예고 후 떨어지는 공격
  const wk = [];
  for (const w of S.warn) { w.t -= dt; if (w.t <= 0) { if (hyp(p.x - w.x, p.y - w.y) < w.r + p.r - 4) hurtPlayer(S, w.dmg, 'rain', w.k); S.fx.push({ k: 'blast', x: w.x, y: w.y, r: w.r, t: 0.35, c: w.k }); } else { wk.push(w); S.tele.push({ k: 'circle', x: w.x, y: w.y, r: w.r, p: 1 - w.t / w.t0 }); } }
  S.warn = wk;
  // 위험 지대(불길)
  p.hzcd -= dt; const hk = [];
  for (const h of S.hz) { h.t -= dt; if (p.hzcd <= 0 && hyp(p.x - h.x, p.y - h.y) < h.r + p.r - 4) { hurtPlayer(S, h.dmg, 'zone', h.k); p.hzcd = 0.5; } if (h.t > 0) hk.push(h); }
  S.hz = hk;
}
function shoot(S, x, y, a, sp, dmg, o = {}) { S.ep.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: o.r || 7, dmg: dmg * S.mod.dmg, life: o.life || 4, home: o.home || 0, k: o.k || 'fire' }); }

/* ───── 보스 패턴 엔진 ───── */
function fire(S, b, a) {
  const p = S.p, toP = Math.atan2(p.y - b.y, p.x - b.x), mul = (b.rage && b.def.rage && b.def.rage.mul) || {};
  const n = Math.round((a.n || 1) * (mul.n || 1));
  if (a.t === 'ring') { const off = S.R() * TAU; for (let i = 0; i < n; i++) shoot(S, b.x, b.y, off + i / n * TAU, a.spd, a.dmg, { k: a.k }); }
  else if (a.t === 'spread') { for (let i = 0; i < n; i++) shoot(S, b.x, b.y, toP + (n > 1 ? (i / (n - 1) - 0.5) * a.ang : 0), a.spd, a.dmg, { k: a.k }); }
  else if (a.t === 'homing') { for (let i = 0; i < n; i++) shoot(S, b.x, b.y, toP + (i - (n - 1) / 2) * 0.6, a.spd, a.dmg, { home: a.turn, life: 4.2, r: 8, k: 'fire' }); }
  else if (a.t === 'rain') { for (let i = 0; i < n; i++) { const ang = S.R() * TAU, d = i === 0 ? 0 : 40 + S.R() * 130; let x = p.x + Math.cos(ang) * d + p.vx * 0.4, y = p.y + Math.sin(ang) * d + p.vy * 0.4; S.warn.push({ x, y, r: a.r, t: a.delay, t0: a.delay, dmg: a.dmg * S.mod.dmg, k: a.k }); } }
  else if (a.t === 'summon') { for (let i = 0; i < n; i++) { const an = i / n * TAU; const e = mkEnemy(S, a.type, b.x + Math.cos(an) * 60, b.y + Math.sin(an) * 60); } }
  b.cast = 0.35; b.ca = toP; S.ev.push({ k: 'sfx', s: 'bossatk' });
}
function bossAI(S, b, dt) {
  const p = S.p, B = b.def, dx = p.x - b.x, dy = p.y - b.y, d = hyp(dx, dy) || 1, toP = Math.atan2(dy, dx);
  if (!b.rage && b.hp < b.max * 0.5) { b.rage = true; S.ev.push({ k: 'rage', name: b.name }); }
  const R = b.rage && B.rage || {}, list = R.atk || B.atk, mul = R.mul || {};
  b.tm -= dt; if (Math.abs(dx) > 1) b.face = dx > 0 ? 1 : -1;
  const mv = (a, sp) => { b.x += Math.cos(a) * sp * dt; b.y += Math.sin(a) * sp * dt; };
  const A = S.arena;
  const lock = b.st === 'aim' || b.st === 'dash' || b.st === 'rest' || b.st === 'stomp' || b.st === 'blink';
  // 이동
  if (B.move === 'snake') {
    const turn = b.st === 'charge' ? 1.1 : 2.2, sp = b.st === 'charge' ? b.cs : b.st === 'aim' ? 0 : b.spd;
    if (b.st !== 'aim') { const da = Math.atan2(Math.sin(toP - b.ang), Math.cos(toP - b.ang)); b.ang += Math.max(-turn * dt, Math.min(turn * dt, da)); }
    mv(b.ang, sp);
  } else if (!lock) {
    if (B.move === 'chase') mv(toP, b.spd);
    else if (B.move === 'keep') { mv(toP, d > 150 ? b.spd : -b.spd * 0.6); mv(toP + Math.PI / 2, b.spd * 0.5); }
    else if (B.move === 'fly') { b.orb += dt * 0.9; const tx = p.x + Math.cos(b.orb) * 170, ty = p.y + Math.sin(b.orb) * 170, ta = Math.atan2(ty - b.y, tx - b.x), td = hyp(tx - b.x, ty - b.y); mv(ta, Math.min(b.spd * 1.4, td * 3)); }
  }
  // 불길 흔적
  const tr = R.trail || B.trail;
  if (tr) { b.trailT -= dt; if (b.trailT <= 0) { b.trailT = 0.22; S.hz.push({ x: b.x, y: b.y, r: tr.r, t: tr.life, t0: tr.life, dmg: tr.dmg * S.mod.dmg, k: 'fire' }); } }
  // 공격 진행
  const after = a => { if (a.after) fire(S, b, a.after); if (R.extra) fire(S, b, R.extra); };
  if (b.st === 'idle') {
    if (b.tm <= 0) {
      const a = list[b.ai++ % list.length]; b.cur = a; const cd = a.cd * (mul.cd || 1);
      if (a.t === 'dash') { b.st = 'aim'; b.tm = a.aim * (mul.cd ? Math.max(0.75, mul.cd) : 1); b.ang = toP; }
      else if (a.t === 'charge') { b.st = 'aim'; b.tm = a.aim; b.cs = a.spd; }
      else if (a.t === 'stomp') { b.st = 'stomp'; b.tm = a.delay; }
      else if (a.t === 'blink') { const an = S.R() * TAU; b.bx = p.x + Math.cos(an) * a.dist; b.by = p.y + Math.sin(an) * a.dist; if (A) { const k = hyp(b.bx - A.x, b.by - A.y); if (k > A.r - 40) { b.bx = A.x + (b.bx - A.x) / k * (A.r - 40); b.by = A.y + (b.by - A.y) / k * (A.r - 40); } } b.st = 'blink'; b.tm = 0.75; }
      else { fire(S, b, a); after(a); b.tm = cd; }
    }
  } else if (b.st === 'aim') {
    if (B.move !== 'snake') b.ang = toP; else b.ang = toP;
    S.tele.push({ k: 'line', x: b.x, y: b.y, a: b.ang, len: b.cur.t === 'charge' ? 320 : b.cur.spd * b.cur.dur + 40, w: b.r * 2 });
    if (b.tm <= 0) { b.st = b.cur.t === 'charge' ? 'charge' : 'dash'; b.tm = b.cur.dur; }
  } else if (b.st === 'dash') { mv(b.ang, b.cur.spd); if (b.tm <= 0) { b.st = 'rest'; b.tm = b.cur.rest; after(b.cur); } }
  else if (b.st === 'charge') { if (b.tm <= 0) { b.st = 'idle'; b.tm = b.cur.cd * (mul.cd || 1); after(b.cur); } }
  else if (b.st === 'rest') { if (b.tm <= 0) { b.st = 'idle'; b.tm = b.cur.cd * (mul.cd || 1); } }
  else if (b.st === 'stomp') {
    S.tele.push({ k: 'circle', x: b.x, y: b.y, r: b.cur.r, p: 1 - b.tm / b.cur.delay });
    if (b.tm <= 0) { if (d < b.cur.r + p.r) hurtPlayer(S, b.cur.dmg * S.mod.dmg, 'stomp'); S.fx.push({ k: 'ring', x: b.x, y: b.y, r: b.cur.r, t: 0.35, c: '#c9b38a' }); after(b.cur); b.st = 'idle'; b.tm = b.cur.cd * (mul.cd || 1); }
  } else if (b.st === 'blink') {
    S.tele.push({ k: 'circle', x: b.bx, y: b.by, r: 40, p: 1 - b.tm / 0.75 });
    if (b.tm <= 0) { b.x = b.bx; b.y = b.by; fire(S, b, { t: 'ring', n: b.cur.n, spd: b.cur.spd, dmg: b.cur.dmg }); after(b.cur); b.st = 'idle'; b.tm = b.cur.cd * (mul.cd || 1); }
  }
  // 몸통 따라오기
  if (b.segs) {
    b.trail.unshift([b.x, b.y]); if (b.trail.length > 500) b.trail.length = 500;
    let acc = 0, ti = 0;
    for (let i = 0; i < b.segs.length; i++) {
      const want = (i + 1) * 17;
      while (ti < b.trail.length - 1 && acc < want) { acc += hyp(b.trail[ti][0] - b.trail[ti + 1][0], b.trail[ti][1] - b.trail[ti + 1][1]); ti++; }
      const s = b.segs[i]; s.x = b.trail[ti][0]; s.y = b.trail[ti][1];
    }
  }
  if (A) { const k = hyp(b.x - A.x, b.y - A.y); if (k > A.r - b.r) { b.x = A.x + (b.x - A.x) / k * (A.r - b.r); b.y = A.y + (b.y - A.y) / k * (A.r - b.r); } }
}

/* ───── 줍기 ───── */
function pickups(S, dt) {
  const p = S.p;
  for (const g of S.gems) {
    const d = hyp(g.x - p.x, g.y - p.y);
    if (!g.fly && d < p.mag) g.fly = true;
    if (g.fly) { g.vs = Math.min(700, g.vs + 900 * dt); const k = Math.min(1, g.vs * dt / (d || 1)); g.x += (p.x - g.x) * k; g.y += (p.y - g.y) * k; }
    if (d < 14) { g.got = true; S.xp += g.v * p.xpMul; }
  }
  S.gems = S.gems.filter(g => !g.got);
  while (S.xp >= S.need) { S.xp -= S.need; S.lv++; S.need = D.xpNeed(S.lv); S.pendingLv++; S.ev.push({ k: 'level' }); }
  for (const o of S.drops) {
    const d = hyp(o.x - p.x, o.y - p.y);
    if (o.k === 'coin' && d < p.mag) { o.x += (p.x - o.x) * Math.min(1, 8 * dt); o.y += (p.y - o.y) * Math.min(1, 8 * dt); }
    if (d < p.r + 12) {
      o.got = true;
      if (o.k === 'heal') { p.hp = Math.min(p.maxhp, p.hp + p.maxhp * 0.3); S.ev.push({ k: 'sfx', s: 'heal' }); }
      else if (o.k === 'magnet') { for (const g of S.gems) g.fly = true; S.ev.push({ k: 'sfx', s: 'magnet' }); }
      else if (o.k === 'coin') { addGold(S, 1); S.ev.push({ k: 'sfx', s: 'coin' }); }
      else if (o.k === 'bag') { addGold(S, 10); S.ev.push({ k: 'sfx', s: 'coin' }); }
      else if (o.k === 'chest') { S.chests += o.n || 1; S.ev.push({ k: 'chest' }); }
    }
  }
  S.drops = S.drops.filter(o => !o.got);
}

/* ───── 한 프레임 ───── */
function step(S, dt, inp) {
  if (paused(S)) return;
  dt = Math.min(dt, 0.05);
  S.t += dt; S.tele.length = 0;
  const p = S.p;
  let mx = inp ? inp.x : 0, my = inp ? inp.y : 0; const m = hyp(mx, my);
  if (m > 1) { mx /= m; my /= m; }
  p.moving = m > 0.05;
  if (p.moving) { const n = hyp(mx, my); p.fx = mx / n; p.fy = my / n; if (Math.abs(mx) > 0.05) p.face = mx > 0 ? 1 : -1; }
  const sp = p.spd * (p.chill > 0 ? 0.7 : 1); p.chill = Math.max(0, p.chill - dt);
  p.vx = mx * sp; p.vy = my * sp;
  p.x += p.vx * dt; p.y += p.vy * dt;
  if (S.arena) { const A = S.arena, k = hyp(p.x - A.x, p.y - A.y); if (k > A.r - p.r) { p.x = A.x + (p.x - A.x) / k * (A.r - p.r); p.y = A.y + (p.y - A.y) / k * (A.r - p.r); } }
  p.hurt = Math.max(0, p.hurt - dt); if (p.atk && (p.atk.t -= dt) <= 0) p.atk = null; p.ifr = Math.max(0, (p.ifr || 0) - dt);
  if (p.regen) p.hp = Math.min(p.maxhp, p.hp + p.regen * dt);
  spawning(S, dt);
  grid(S);
  weapons(S, dt);
  projectiles(S, dt);
  enemies(S, dt);
  if (S.en.length > 60) S.en = S.en.filter(e => !e.dead);
  pickups(S, dt);
  for (const f of S.fx) { f.t -= dt; if (f.k === 'num') f.y -= 30 * dt; }
  S.fx = S.fx.filter(f => f.t > 0);
}

function result(S) {
  const t = Math.floor(Math.min(S.t, 3600)), cleared = S.over === 'clear', bossT = Math.round(S.bossT);
  return { t, kills: S.kills, mid: S.midDone, cleared, bossT, gold: Math.floor(S.gold), lv: S.lv, bosses: S.bosses, evolved: S.evolved.slice(), revived: S.revives > 0, hard: S.hard,
    score: D.score(t, S.kills, S.midDone, cleared, bossT) };
}

const Core = { newRun, step, choices, pick, paused, revive, result, recalc, rng, wst, setInfo };
G.CORE = Core;
if (typeof module !== 'undefined') module.exports = Core;
})(typeof window !== 'undefined' ? window : globalThis);
