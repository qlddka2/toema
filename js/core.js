/* 퇴마 서바이버(가제) — 게임 규칙 코어. 화면(DOM)과 분리되어 있어 자동 시뮬레이션에도 그대로 쓰입니다. */
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
const TMP = [];

/* ───── 새 판 ───── */
function newRun(o) {
  const hero = D.HEROES[o.hero], ch = D.CHAPTERS[o.chapter - 1], meta = o.meta || {};
  const S = {
    t: 0, R: rng(o.seed || (Math.random() * 1e9) | 0), heroId: o.hero, hero, ch, meta, viewR: o.viewR || 420,
    p: { x: 0, y: 0, r: 12, hp: 1, maxhp: 1, fx: 1, fy: 0, face: 1, hurt: 0, moving: false },
    W: [], P: {}, lv: 1, xp: 0, need: D.xpNeed(1), pendingLv: 0, chests: 0,
    rerolls: 1 + (meta.roll || 0), revived: false, over: '', kills: 0, gold: 0,
    en: [], pr: [], ep: [], gems: [], drops: [], fx: [], tele: [], ev: [], grid: new Map(),
    spawnAcc: 0, evIdx: 0, boss: null, arena: null, midDone: false, bossT0: 0, bossT: 0, stashXp: 0, uid: 1, dlog: {},
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
  p.regen = (P.regen || 0) * D.PASSIVES.regen.per;
  p.xpMul = 1 + (m.xp || 0) * D.META.xp.per;
  p.armor = h.armor;
  if (old > 1 && p.maxhp > old) p.hp += p.maxhp - old;
}

function addWeapon(S, id) { S.W.push({ id, lv: 1, cd: 0.4, tm: 0 }); }
const wst = w => D.WEAPONS[w.id].lv[w.lv - 1];

/* ───── 레벨업 선택지 ───── */
function choices(S, n = 3) {
  const R = S.R, pool = [];
  const owned = new Set(S.W.map(w => w.id));
  for (const w of S.W) if (w.lv < D.MAX_LV) pool.push({ kind: 'w', id: w.id, lv: w.lv + 1, wt: 1.2 });
  if (S.W.length < D.MAX_W) for (const id in D.WEAPONS) if (!owned.has(id)) pool.push({ kind: 'w', id, lv: 1, wt: 1 });
  const pc = Object.keys(S.P).length;
  for (const id in S.P) if (S.P[id] < D.MAX_LV) pool.push({ kind: 'p', id, lv: S.P[id] + 1, wt: 0.9 });
  if (pc < D.MAX_P) for (const id in D.PASSIVES) if (!(id in S.P)) pool.push({ kind: 'p', id, lv: 1, wt: 0.8 });
  const out = [];
  const take = filt => { const c = pool.filter(x => filt(x) && !out.includes(x)); if (!c.length) return; let s = 0; for (const x of c) s += x.wt; let r = R() * s; for (const x of c) { r -= x.wt; if (r <= 0) { out.push(x); return; } } out.push(c[c.length - 1]); };
  take(x => x.kind === 'w');               // 공격 수단 최소 1개 보장
  while (out.length < n && out.length < pool.length) take(() => true);
  if (!out.length) { out.push({ kind: 'heal' }, { kind: 'gold' }); }
  for (const o of out) describe(o);
  return out;
}
function describe(o) {
  if (o.kind === 'w') { const W = D.WEAPONS[o.id]; o.name = W.name; o.icon = W.icon; o.desc = o.lv === 1 ? W.desc : W.up[o.lv - 2]; }
  else if (o.kind === 'p') { const P = D.PASSIVES[o.id]; o.name = P.name; o.icon = P.icon; o.desc = P.desc; }
  else if (o.kind === 'heal') { o.name = '인삼'; o.icon = 'heal'; o.desc = '체력 40% 회복'; }
  else { o.name = '엽전 꾸러미'; o.icon = 'gold'; o.desc = '금화 +25'; }
  return o;
}
function pick(S, o) {
  if (o.kind === 'w') { const w = S.W.find(x => x.id === o.id); if (w) w.lv = Math.min(D.MAX_LV, w.lv + 1); else addWeapon(S, o.id); }
  else if (o.kind === 'p') { S.P[o.id] = (S.P[o.id] || 0) + 1; recalc(S); }
  else if (o.kind === 'heal') S.p.hp = Math.min(S.p.maxhp, S.p.hp + S.p.maxhp * 0.4);
  else S.gold += 25;
  if (S.chests > 0) S.chests--; else if (S.pendingLv > 0) S.pendingLv--;
}
const paused = S => S.over || S.pendingLv > 0 || S.chests > 0;

/* ───── 스폰 ───── */
function mkEnemy(S, type, x, y) {
  const b = D.ENEMIES[type], ch = S.ch, t = S.t;
  const hp = Math.round(b.hp * ch.hpMul * D.hpScale(t));
  const e = { id: S.uid++, type, x, y, r: b.r, hp, max: hp, spd: b.spd * (1 + Math.min(t, 600) / 600 * 0.12), dmg: b.dmg * ch.dmgMul * D.dmgScale(t), xp: b.xp, ai: b.ai, mass: b.mass,
    elite: !!b.elite, kx: 0, ky: 0, hitcd: 0, flash: 0, slowT: 0, slow: 0, hb: {}, st: 0, tm: 1 + S.R() * 3, dx: 0, dy: 0, ph: S.R() * TAU, face: 1 };
  S.en.push(e); return e;
}
function ringPos(S, rad) { const a = S.R() * TAU; return [S.p.x + Math.cos(a) * rad, S.p.y + Math.sin(a) * rad]; }
function spawnBoss(S, id) {
  const B = D.BOSSES[id], a = S.R() * TAU;
  const e = { id: S.uid++, type: id, boss: true, kind: B.kind, name: B.name, x: S.p.x + Math.cos(a) * 230, y: S.p.y + Math.sin(a) * 230, r: B.r, hp: B.hp, max: B.hp,
    spd: B.spd, dmg: B.dmg * S.ch.dmgMul, xp: 0, mass: 999, kx: 0, ky: 0, hitcd: 0, flash: 0, slowT: 0, slow: 0, hb: {}, st: 'chase', tm: 2, cyc: 0, face: 1, ang: a + Math.PI, gold: B.gold };
  e.final = S.t >= D.BOSS_TIME - 1; if (e.final) S.bossT0 = S.t;
  S.en.push(e); S.boss = e;
  S.arena = { x: S.p.x, y: S.p.y, r: 280 };
  if (B.kind === 'imugi') { e.segs = []; e.trail = []; for (let i = 0; i < 14; i++) { const s = { id: S.uid++, type: 'seg', seg: true, par: e, x: e.x, y: e.y, r: 15 - i * 0.45, hp: 1, max: 1, mass: 999, kx: 0, ky: 0, hitcd: 0, flash: 0, slowT: 0, slow: 0, hb: {}, dmg: e.dmg * 0.5, face: 1 }; e.segs.push(s); S.en.push(s); } }
  S.ev.push({ k: 'boss', name: B.name, sub: B.sub, final: e.final });
}
function spawning(S, dt) {
  const ch = S.ch;
  while (S.evIdx < ch.events.length && S.t >= ch.events[S.evIdx][0]) {
    const [, k, a, b] = ch.events[S.evIdx++];
    if (k === 'ring') { for (let i = 0; i < b; i++) { const an = i / b * TAU; mkEnemy(S, a, S.p.x + Math.cos(an) * 320, S.p.y + Math.sin(an) * 320); } S.ev.push({ k: 'warn', txt: '포위당했다!' }); }
    else if (k === 'elite') { const [x, y] = ringPos(S, S.viewR + 20); mkEnemy(S, a, x, y); S.ev.push({ k: 'warn', txt: D.ENEMIES[a].name + ' 출현' }); }
    else if (k === 'boss') { if (!S.boss) spawnBoss(S, a); else S.queuedBoss = a; }
  }
  if (S.queuedBoss && !S.boss) { spawnBoss(S, S.queuedBoss); S.queuedBoss = null; }
  let wv = ch.waves[0]; for (const w of ch.waves) if (S.t >= w[0]) wv = w;
  const rate = wv[1] * (S.boss ? 0.45 : 1);
  S.spawnAcc += rate * dt;
  let alive = 0; for (const e of S.en) if (!e.dead && !e.seg) alive++;
  while (S.spawnAcc >= 1) { S.spawnAcc -= 1; if (alive >= D.ENEMY_CAP) continue; const [x, y] = ringPos(S, S.viewR + 30); mkEnemy(S, wpick(S.R, wv[2]), x, y); alive++; }
}

/* ───── 피해 ───── */
function hurtEnemy(S, e, dmg, kx, ky, src) {
  if (e.dead) return;
  if (e.seg) { e.flash = 0.1; e = e.par; if (e.dead) return; dmg *= 0.2; }
  dmg = Math.round(dmg * S.p.might * (0.9 + S.R() * 0.2));
  e.hp -= dmg; e.flash = 0.12;
  if (kx || ky) { const m = 1 / Math.max(1, e.mass); e.kx += kx * m; e.ky += ky * m; }
  if (S.fx.length < 140) S.fx.push({ k: 'num', x: e.x + (S.R() - 0.5) * 10, y: e.y - e.r, v: dmg, t: 0.6, big: e.boss });
  if (e.hp <= 0) kill(S, e);
}
function kill(S, e) {
  e.dead = true; S.kills += e.boss ? 0 : 1;
  S.fx.push({ k: 'pop', x: e.x, y: e.y, r: e.r, t: 0.3, c: e.elite || e.boss ? '#ffd36b' : '#b9ff9a' });
  if (e.boss) {
    if (e.segs) for (const s of e.segs) { s.dead = true; S.fx.push({ k: 'pop', x: s.x, y: s.y, r: s.r, t: 0.4, c: '#ffd36b' }); }
    S.boss = null; S.arena = null; S.gold += e.gold;
    S.drops.push({ k: 'chest', x: e.x, y: e.y });
    S.drops.push({ k: 'heal', x: e.x + 30, y: e.y });
    if (e.final) { S.bossT = S.t - S.bossT0; S.over = 'clear'; S.gold += S.ch.clearGold; S.ev.push({ k: 'clear' }); }
    else { S.midDone = true; S.ev.push({ k: 'bossdown', name: e.name }); }
    return;
  }
  if (e.elite) { S.drops.push({ k: 'chest', x: e.x, y: e.y }); S.drops.push({ k: 'bag', x: e.x + 14, y: e.y }); }
  let v = e.xp + S.stashXp; S.stashXp = 0;
  S.gems.push({ x: e.x, y: e.y, v, fly: false, vs: 0 });
  if (S.gems.length > 360) { let fi = 0, fd = -1; for (let i = 0; i < S.gems.length; i++) { const g = S.gems[i], d = hyp(g.x - S.p.x, g.y - S.p.y); if (d > fd && !g.fly) { fd = d; fi = i; } } S.stashXp += S.gems[fi].v; S.gems.splice(fi, 1); }
  const r = S.R();
  if (r < 0.008) S.drops.push({ k: 'heal', x: e.x, y: e.y });
  else if (r < 0.011) S.drops.push({ k: 'magnet', x: e.x, y: e.y });
  else if (r < 0.061) S.drops.push({ k: 'coin', x: e.x, y: e.y });
}
function hurtPlayer(S, dmg, src) {
  const p = S.p; if (S.over) return;
  const d = Math.max(1, Math.round(dmg - p.armor));
  S.dlog[src || 'mob'] = (S.dlog[src || 'mob'] || 0) + d;
  p.hp -= d; p.hurt = 0.18; S.ev.push({ k: 'hurt' });
  if (p.hp <= 0) { p.hp = 0; S.over = 'dead'; S.ev.push({ k: 'dead' }); }
}
function revive(S) {
  const p = S.p; S.over = ''; S.revived = true; p.hp = Math.round(p.maxhp * 0.6);
  for (const e of S.en) { if (e.dead || e.boss || e.seg) continue; const d = hyp(e.x - p.x, e.y - p.y); if (d < 220) { const k = 600 / Math.max(20, d); e.kx += (e.x - p.x) * k / Math.max(1, e.mass); e.ky += (e.y - p.y) * k / Math.max(1, e.mass); e.hp -= 60; if (e.hp <= 0) kill(S, e); } }
  S.ep.length = 0; S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 220, t: 0.5, c: '#ffe08a' });
}

/* ───── 무기 ───── */
function weapons(S, dt) {
  const p = S.p;
  for (const w of S.W) {
    const s = wst(w);
    if (w.id === 'beads') { beads(S, w, s, dt); continue; }
    if (w.id === 'aura') { w.tm -= dt; if (w.tm <= 0) { w.tm = s.tick * p.cdMul; for (const e of near(S, p.x, p.y, s.r, TMP)) { hurtEnemy(S, e, s.dmg, 0, 0); e.slowT = 0.6; e.slow = s.slow; } } continue; }
    w.cd -= dt; if (w.cd > 0) continue;
    w.cd = s.cd * p.cdMul;
    if (w.id === 'staff') {
      const tn = nearestN(S, 1, s.range + 40)[0], dirs = [tn ? Math.atan2(tn.y - p.y, tn.x - p.x) : Math.atan2(p.fy, p.fx)]; if (s.back) dirs.push(dirs[0] + Math.PI);
      const half = s.arc / 2 * Math.PI / 180, rr = s.range;
      for (const an of dirs) {
        S.fx.push({ k: 'swing', x: p.x, y: p.y, a: an, arc: half * 2, r: rr, t: 0.2, t0: 0.2 });
        for (const e of near(S, p.x, p.y, rr, TMP)) { let da = Math.atan2(e.y - p.y, e.x - p.x) - an; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= half + 0.25) { const d = hyp(e.x - p.x, e.y - p.y) || 1; hurtEnemy(S, e, s.dmg * (S.heroId === 'daesung' ? 1.1 : 1), (e.x - p.x) / d * s.kb, (e.y - p.y) / d * s.kb); } }
      }
      S.ev.push({ k: 'sfx', s: 'swing' });
    } else if (w.id === 'talisman') {
      const tg = nearestN(S, s.n, 340);
      if (!tg.length) { w.cd = 0.15; continue; }
      for (let i = 0; i < s.n; i++) { const e = tg[i % tg.length]; let a = Math.atan2(e.y - p.y, e.x - p.x) + (i >= tg.length ? (i - tg.length + 1) * 0.18 : 0); S.pr.push({ k: 'tal', x: p.x, y: p.y, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, dmg: s.dmg, pierce: s.pierce, life: 1.3, r: 7, hit: new Set(), a }); }
      S.ev.push({ k: 'sfx', s: 'throw' });
    } else if (w.id === 'thunder') {
      const cand = []; for (const e of S.en) if (!e.dead && !e.seg && hyp(e.x - p.x, e.y - p.y) < 330) cand.push(e);
      if (!cand.length) { w.cd = 0.3; continue; }
      for (let i = 0; i < s.n; i++) {
        const e = (S.boss && i === 0 && S.R() < 0.5) ? S.boss : cand[(S.R() * cand.length) | 0];
        S.fx.push({ k: 'bolt', x: e.x, y: e.y, r: s.r, t: 0.25, seed: S.R() });
        for (const o of near(S, e.x, e.y, s.r, TMP)) hurtEnemy(S, o, s.dmg, 0, 0);
      }
      S.ev.push({ k: 'sfx', s: 'thunder' });
    } else if (w.id === 'fan') {
      const tf = nearestN(S, 1, 260)[0], a0 = tf ? Math.atan2(tf.y - p.y, tf.x - p.x) : Math.atan2(p.fy, p.fx), as = s.back ? [a0, a0 + Math.PI] : [a0];
      for (const a of as) S.pr.push({ k: 'wind', x: p.x, y: p.y, vx: Math.cos(a) * 260, vy: Math.sin(a) * 260, dmg: s.dmg, w: s.w, life: s.range / 260, kb: s.kb, hit: new Set(), a, pierce: 999, r: 12 });
      S.ev.push({ k: 'sfx', s: 'wind' });
    }
  }
}
function beads(S, w, s, dt) {
  const p = S.p; w.tm += dt * s.rot;
  w.pos = w.pos || [];
  w.pos.length = s.n;
  for (let i = 0; i < s.n; i++) {
    const a = w.tm + i / s.n * TAU, x = p.x + Math.cos(a) * s.rad, y = p.y + Math.sin(a) * s.rad;
    w.pos[i] = [x, y];
    for (const e of near(S, x, y, 9, TMP)) { const k = 'b'; if ((e.hb[k] || 0) > S.t) continue; e.hb[k] = S.t + s.hitcd; const d = hyp(e.x - p.x, e.y - p.y) || 1; hurtEnemy(S, e, s.dmg, (e.x - p.x) / d * 40, (e.y - p.y) / d * 40); }
  }
}
function nearestN(S, n, maxd) {
  const p = S.p, a = [];
  for (const e of S.en) { if (e.dead) continue; const d = hyp(e.x - p.x, e.y - p.y); if (d < maxd) a.push([d, e]); }
  a.sort((x, y) => x[0] - y[0]); return a.slice(0, n).map(x => x[1]);
}
function projectiles(S, dt) {
  const keep = [];
  for (const q of S.pr) {
    q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
    if (q.k === 'tal') {
      for (const e of near(S, q.x, q.y, q.r, TMP)) { const id = e.seg ? e.par.id : e.id; if (q.hit.has(id)) continue; q.hit.add(id); hurtEnemy(S, e, q.dmg, q.vx * 0.12, q.vy * 0.12); if (--q.pierce <= 0) { q.life = 0; break; } }
    } else if (q.k === 'wind') {
      const nx = -q.vy / 260, ny = q.vx / 260;
      for (const e of near(S, q.x, q.y, q.w / 2 + 10, TMP)) {
        const id = e.id; if (q.hit.has(id)) continue;
        const along = (e.x - q.x) * q.vx / 260 + (e.y - q.y) * q.vy / 260, side = (e.x - q.x) * nx + (e.y - q.y) * ny;
        if (Math.abs(along) < 22 + e.r && Math.abs(side) < q.w / 2 + e.r) { q.hit.add(id); hurtEnemy(S, e, q.dmg, q.vx / 260 * q.kb, q.vy / 260 * q.kb); }
      }
    }
    if (q.life > 0) keep.push(q);
  }
  S.pr = keep;
}

/* ───── 적 이동·공격 ───── */
function enemies(S, dt) {
  const p = S.p, far = S.viewR * 1.7;
  for (const e of S.en) {
    if (e.dead || e.seg) continue;
    e.flash = Math.max(0, e.flash - dt); e.hitcd -= dt;
    if (e.boss) { bossAI(S, e, dt); }
    else {
      let dx = p.x - e.x, dy = p.y - e.y; const d = hyp(dx, dy) || 1; dx /= d; dy /= d;
      if (d > far) { const [x, y] = ringPos(S, S.viewR + 30); e.x = x; e.y = y; continue; }
      let sp = e.spd * (e.slowT > 0 ? 1 - e.slow : 1); e.slowT -= dt;
      if (e.ai === 'charge') {
        e.tm -= dt;
        if (e.st === 0) { if (e.tm <= 0 && d < 260) { e.st = 1; e.tm = 0.55; e.dx = dx; e.dy = dy; } }
        else if (e.st === 1) { sp = 0; if (e.tm <= 0) { e.st = 2; e.tm = 0.55; } }
        else { sp = e.spd * 3.6; dx = e.dx; dy = e.dy; if (e.tm <= 0) { e.st = 0; e.tm = 3 + S.R() * 2; } }
      } else if (e.ai === 'fly') { e.ph += dt * 5; const w = Math.sin(e.ph) * 0.7, ox = -dy * w, oy = dx * w; dx += ox; dy += oy; }
      else if (e.ai === 'zig') { e.ph += dt * 3.2; const w = Math.sin(e.ph) * 1.1, ox = -dy * w, oy = dx * w; dx += ox; dy += oy; const n = hyp(dx, dy) || 1; dx /= n; dy /= n; }
      e.x += (dx * sp + e.kx) * dt; e.y += (dy * sp + e.ky) * dt;
      if (Math.abs(dx) > 0.1) e.face = dx > 0 ? 1 : -1;
    }
    const kd = Math.exp(-9 * dt); e.kx *= kd; e.ky *= kd;
    if (e.hitcd <= 0 && hyp(p.x - e.x, p.y - e.y) < p.r + e.r - 2) { e.hitcd = 0.6; hurtPlayer(S, e.boss && e.st === 'dash' ? e.dmg * 1.3 : e.dmg, e.boss ? 'boss' : 'mob'); }
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
  // 이무기 몸통
  if (S.boss && S.boss.segs) { const b = S.boss; for (const s of b.segs) { s.flash = Math.max(0, s.flash - dt); s.hitcd -= dt; if (s.hitcd <= 0 && hyp(p.x - s.x, p.y - s.y) < p.r + s.r - 2) { s.hitcd = 0.6; hurtPlayer(S, s.dmg, 'boss'); } } }
  // 적 탄환
  const keep = [];
  for (const q of S.ep) {
    if (q.home) { const a = Math.atan2(p.y - q.y, p.x - q.x), c = Math.atan2(q.vy, q.vx); let da = Math.atan2(Math.sin(a - c), Math.cos(a - c)); const na = c + Math.max(-q.home * dt, Math.min(q.home * dt, da)), sp = hyp(q.vx, q.vy); q.vx = Math.cos(na) * sp; q.vy = Math.sin(na) * sp; }
    q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
    if (hyp(q.x - p.x, q.y - p.y) < q.r + p.r - 3) { hurtPlayer(S, q.dmg, 'shot'); q.life = 0; }
    if (q.life > 0) keep.push(q);
  }
  S.ep = keep;
}
function shoot(S, x, y, a, sp, dmg, o = {}) { S.ep.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: o.r || 7, dmg: dmg * S.ch.dmgMul, life: o.life || 4, home: o.home || 0, k: o.k || 'fire' }); }
function ring(S, x, y, n, sp, dmg, off = 0, o) { for (let i = 0; i < n; i++) shoot(S, x, y, off + i / n * TAU, sp, dmg, o); }

function bossAI(S, b, dt) {
  const p = S.p, dx = p.x - b.x, dy = p.y - b.y, d = hyp(dx, dy) || 1, toP = Math.atan2(dy, dx), rage = b.hp < b.max * 0.5;
  b.tm -= dt; if (Math.abs(dx) > 1) b.face = dx > 0 ? 1 : -1;
  const mv = (a, sp) => { b.x += Math.cos(a) * sp * dt; b.y += Math.sin(a) * sp * dt; };
  const A = S.arena;
  if (b.kind === 'tiger') {
    if (b.st === 'chase') { mv(toP, b.spd); if (b.tm <= 0) { b.st = 'aim'; b.tm = rage ? 0.7 : 0.9; b.ang = toP; } }
    else if (b.st === 'aim') { b.ang = toP; if (b.tm <= 0) { b.st = 'dash'; b.tm = 0.5; } }
    else if (b.st === 'dash') { mv(b.ang, 440); if (b.tm <= 0) { b.st = 'rest'; b.tm = 0.8; b.cyc++; if (rage) ring(S, b.x, b.y, 8, 140, 12, S.R(), { k: 'shard', r: 6 }); } }
    else if (b.st === 'rest') { if (b.tm <= 0) { if (rage && b.cyc % 2 === 1) { b.st = 'aim'; b.tm = 0.6; } else { b.st = 'chase'; b.tm = rage ? 2.2 : 3.0; } } }
    if (b.st === 'aim') S.tele.push({ k: 'line', x: b.x, y: b.y, a: b.ang, len: 440 * 0.5 + 40, w: b.r * 2 });
  } else if (b.kind === 'fox') {
    const want = 150; mv(toP, d > want ? b.spd : -b.spd * 0.6); mv(toP + Math.PI / 2, b.spd * 0.5);
    if (b.st === 'blink') { S.tele.push({ k: 'circle', x: b.bx, y: b.by, r: 40 }); if (b.tm <= 0) { b.x = b.bx; b.y = b.by; ring(S, b.x, b.y, rage ? 12 : 8, 130, 14, S.R()); b.st = 'chase'; b.tm = rage ? 1.6 : 2.2; } }
    else if (b.tm <= 0) {
      const c = b.cyc++ % 3;
      if (c === 0) { ring(S, b.x, b.y, rage ? 16 : 12, rage ? 135 : 115, 14, S.R()); b.tm = rage ? 1.9 : 2.5; }
      else if (c === 1) { for (let i = 0; i < (rage ? 5 : 3); i++) shoot(S, b.x, b.y, toP + (i - 1) * 0.6, 95, 15, { home: 1.6, life: 4.2, r: 8 }); b.tm = rage ? 1.9 : 2.5; }
      else { const a = S.R() * TAU; b.bx = p.x + Math.cos(a) * 130; b.by = p.y + Math.sin(a) * 130; if (A) { const k = hyp(b.bx - A.x, b.by - A.y); if (k > A.r - 40) { b.bx = A.x + (b.bx - A.x) / k * (A.r - 40); b.by = A.y + (b.by - A.y) / k * (A.r - 40); } } b.st = 'blink'; b.tm = 0.75; }
    }
  } else if (b.kind === 'bulga') {
    if (b.st === 'chase') { mv(toP, b.spd); if (b.tm <= 0) { b.st = 'stomp'; b.tm = 1.0; } }
    else if (b.st === 'stomp') { S.tele.push({ k: 'circle', x: b.x, y: b.y, r: 125 }); if (b.tm <= 0) { if (d < 125 + p.r) hurtPlayer(S, 28 * S.ch.dmgMul, 'stomp'); S.fx.push({ k: 'ring', x: b.x, y: b.y, r: 125, t: 0.35, c: '#c9b38a' });
        for (let i = 0; i < 5; i++) shoot(S, b.x, b.y, toP + (i - 2) * 0.2, 190, 12, { k: 'spike', r: 6 }); if (rage) ring(S, b.x, b.y, 10, 120, 10, S.R(), { k: 'spike', r: 6 });
        b.st = 'chase'; b.tm = rage ? 2.2 : 3.0; } }
  } else if (b.kind === 'imugi') {
    const turn = b.st === 'charge' ? 1.1 : 2.2, sp = b.st === 'charge' ? 270 : b.st === 'coil' ? 0 : b.spd;
    let da = Math.atan2(Math.sin(toP - b.ang), Math.cos(toP - b.ang)); b.ang += Math.max(-turn * dt, Math.min(turn * dt, da));
    mv(b.ang, sp);
    if (b.st === 'coil') { S.tele.push({ k: 'line', x: b.x, y: b.y, a: toP, len: 300, w: 30 }); if (b.tm <= 0) { b.st = 'charge'; b.tm = 1.2; b.ang = toP; } }
    else if (b.st === 'charge') { if (b.tm <= 0) { b.st = 'chase'; b.tm = 2.4; } }
    else if (b.tm <= 0) { const c = b.cyc++ % 3; if (c === 2) { b.st = 'coil'; b.tm = 0.7; } else { const n = rage ? 7 : 5; for (let i = 0; i < n; i++) shoot(S, b.x, b.y, toP + (i - (n - 1) / 2) * 0.2, 150, 11, { k: 'poison', r: 7 }); b.tm = rage ? 2.2 : 2.8; } }
    b.trail.unshift([b.x, b.y]); if (b.trail.length > 400) b.trail.length = 400;
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
      else if (o.k === 'coin') { S.gold += 1; S.ev.push({ k: 'sfx', s: 'coin' }); }
      else if (o.k === 'bag') { S.gold += 10; S.ev.push({ k: 'sfx', s: 'coin' }); }
      else if (o.k === 'chest') { S.chests++; S.ev.push({ k: 'chest' }); }
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
  p.x += mx * p.spd * dt; p.y += my * p.spd * dt;
  if (S.arena) { const A = S.arena, k = hyp(p.x - A.x, p.y - A.y); if (k > A.r - p.r) { p.x = A.x + (p.x - A.x) / k * (A.r - p.r); p.y = A.y + (p.y - A.y) / k * (A.r - p.r); } }
  p.hurt = Math.max(0, p.hurt - dt);
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
  return { t, kills: S.kills, mid: S.midDone, cleared, bossT, gold: S.gold, lv: S.lv, score: D.score(t, S.kills, S.midDone, cleared, bossT) };
}

const Core = { newRun, step, choices, pick, paused, revive, result, recalc, rng };
G.CORE = Core;
if (typeof module !== 'undefined') module.exports = Core;
})(typeof window !== 'undefined' ? window : globalThis);
