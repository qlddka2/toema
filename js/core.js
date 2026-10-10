/* 퇴마 서바이벌 — 게임 규칙 코어. 화면(DOM)과 분리되어 있어 자동 시뮬레이션에도 그대로 쓰입니다. */
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
  const hero = D.HEROES[o.hero], ch = o.chapter === 6 ? Object.assign({}, D.ENDLESS) : D.CHAPTERS[o.chapter - 1], meta = o.meta || {}, hard = !!o.hard, H = D.HARD, hlv = Math.max(1, Math.min(D.HERO_LV.max, o.hlv || 1)), hm = D.heroMods(o.hero, hlv);
  const S = {
    t: 0, R: rng(o.seed || (Math.random() * 1e9) | 0), heroId: o.hero, hero, ch, meta, hard, endless: !!ch.endless, week: ch.endless ? D.weekNo() : 0, wk: ch.endless ? (o.weekly || D.weekly().id) : '', seg: -1, viewR: o.viewR || 420,
    mod: { hp: D.TIER.hp[D.tierOf(ch.endless ? 1 : ch.id, hard)], dmg: D.TIER.dmg[D.tierOf(ch.endless ? 1 : ch.id, hard)], spawn: hard ? H.spawnMul : 1, bossHp: D.TIER.boss[D.tierOf(ch.endless ? 1 : ch.id, hard)] },
    goldBase: (hard ? H.goldMul : 1) * (hero.goldMul || 1) * (1 + (meta.greed || 0) * D.META.greed.per) * (1 + (hm.gold || 0)), goldMul: 1, hlv, hm,
    p: { x: 0, y: 0, vx: 0, vy: 0, r: 12, hp: 1, maxhp: 1, fx: 1, fy: 0, face: 1, hurt: 0, moving: false, chill: 0, hzcd: 0 },
    W: [], P: {}, lv: 1, xp: 0, need: D.xpNeed(1), pendingLv: 0, chests: 0, chestN: [],
    rerolls: 1 + (meta.roll || 0), freeRev: meta.rev || 0, revived: false, revives: 0, over: '', kills: 0, gold: 0,
    en: [], pr: [], ep: [], pz: [], hz: [], warn: [], gems: [], drops: [], fx: [], tele: [], ev: [], grid: new Map(),
    spawnAcc: 0, evIdx: 0, boss: null, arena: null, midDone: false, bossT0: 0, bossT: 0, stashXp: 0, uid: 1, dlog: {},
    bosses: 0, evolved: [], unions: [], mn: [], cursed: [], maxRelic: D.MAX_RELIC, drainB: 0,
  };
  const W = S.wk;   // 주간 조건
  if (W === 'rush') S.mod.espd = 1.25;
  if (W === 'hunger') S.goldBase *= 1.3;
  if (W === 'fog') S.goldBase *= 1.4;
  if (W === 'blood') S.maxRelic = 5;
  if (W === 'giant') { S.mod.hp *= 1.6; S.mod.espd = 0.8; }
  if (W === 'feast') S.mod.spawn *= 1.3;
  const WL = Object.keys(D.WEAPONS).filter(k => !D.isUnion(k)), sw = W === 'random' ? WL[(D.weekNo() * 7 + o.hero.length) % WL.length] : hero.weapon;
  addWeapon(S, sw); if (hm.startLv) S.W[0].lv += hm.startLv;
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
  p.xpMul = (1 + (m.xp || 0) * D.META.xp.per) * (h.xpMul || 1) * (1 + (P.essence || 0) * D.PASSIVES.essence.per);
  p.armor = h.armor + (P.armor || 0) * D.PASSIVES.armor.per + (m.arm || 0);
  p.crit = D.CRIT_BASE + (P.luck || 0) * D.PASSIVES.luck.per + (m.luck || 0) * D.META.luck.per + (h.crit || 0);
  p.area = h.areaMul || 1; p.kbMul = 1; p.critMul = D.CRIT_MUL;
  // 주인공 성장 (레벨·특성)
  const hl = (S.hlv || 1) - 1, hm = S.hm || {};
  p.might += hl * D.HERO_LV.might + (hm.might || 0); p.maxhp = Math.round(p.maxhp * (1 + hl * D.HERO_LV.hp + (hm.hp || 0)));
  p.area *= 1 + (hm.area || 0); p.cdMul *= 1 - (hm.cd || 0); p.armor += hm.armor || 0; p.regen += hm.regen || 0;
  p.xpMul *= 1 + (hm.xp || 0); p.crit += hm.crit || 0; p.spd *= 1 + (hm.spd || 0);
  p.critMul += (hm.critDmg || 0) + (P.focus || 0) * D.PASSIVES.focus.per;
  p.rangeMul = 1 + (P.farsight || 0) * D.PASSIVES.farsight.per + (hm.range || 0) + (h.range || 0);
  // v3.0: 튕김·폭발·빙결·회복·지속·분신·수호령
  p.bounce = (h.bounce || 0) + (hm.bounce || 0); p.boomMul = 1 + (h.boom || 0) + (hm.boom || 0); p.frzMul = 1 + (h.frz || 0) + (hm.frz || 0);
  p.healMul = 1 + (h.heal || 0) + (hm.heal || 0); p.durMul = 1 + (P.dur || 0) * D.PASSIVES.dur.per;
  p.extraN = P.clone ? (P.clone >= 4 ? 2 : 1) : 0; p.might += (P.clone || 0) * D.PASSIVES.clone.per;
  p.guardCd = P.guard ? D.GUARD_CD(P.guard) : 0; p.onKill = 0; p.dmgCut = 0;
  S.goldMul = S.goldBase * (1 + (P.fortune || 0) * D.PASSIVES.fortune.per);
  // 유물
  const RL = S.relics || [], has = k => RL.includes(k);
  p.dmgTaken = has('coin') ? 1.1 : 1; p.bossMul = has('scale') ? 1.3 : 1;
  if (has('mirror')) { p.crit += 0.10; p.critMul += 0.3; }
  if (has('shoes')) { p.spd *= 1.15; p.mag *= 1.4; }
  if (has('coin')) S.goldMul *= 1.4;
  if (has('ginseng')) { p.maxhp = Math.round(p.maxhp * 1.2); p.healMul += 0.3; }
  if (S.wk === 'mirror') p.xpMul *= 1.3;
  if (S.wk === 'glass') { p.might += 0.5; p.maxhp = Math.round(p.maxhp * 0.6); }
  if (S.wk === 'feast') p.xpMul *= 1.4;
  // 보옥
  const ob = S.orbs || {}, OV = k => (ob[k] || 0) * D.ORBS[k].v;
  p.might += OV('might'); p.maxhp = Math.round(p.maxhp * (1 + OV('vigor'))); p.cdMul *= Math.pow(1 - D.ORBS.haste.v, ob.haste || 0);
  p.crit += OV('luck'); p.spd *= 1 + OV('swift'); p.regen += OV('regen');
  // 세트 효과
  const sc = {}; for (const w of S.W) for (const id of (D.WEAPONS[w.id].union || [w.id])) { const k = D.SET_OF[id]; if (k) sc[k] = (sc[k] || 0) + 1; }
  S.sets = sc;
  for (const k in sc) for (const b of D.SETS[k].b) if (sc[k] >= b.n) {
    if (b.cd) p.cdMul *= 1 - b.cd; if (b.crit) p.crit += b.crit; if (b.might) p.might += b.might;
    if (b.kb) p.kbMul += b.kb; if (b.critDmg) p.critMul += b.critDmg; if (b.area) p.area *= 1 + b.area; if (b.regen) p.regen += b.regen;
    if (b.xp) p.xpMul *= 1 + b.xp; if (b.onKill) p.onKill += b.onKill; if (b.boom) p.boomMul += b.boom; if (b.guardDmg) p.dmgCut += b.guardDmg;
  }
  S.khAura = S.W.some(w => w.id === 'aura' && w.evo) ? D.WEAPONS.aura.evo.s.heal : S.W.some(w => w.id === 'u_bell') ? D.UNIONS.u_bell.s.heal : 0;
  if (old > 1 && p.maxhp > old) p.hp += p.maxhp - old;
}

function addWeapon(S, id) { S.W.push({ id, lv: 1, cd: 0.4, tm: 0, evo: false }); }
const JINC = {};
function jinStats(id) {   // 진 각성 능력치: 진화 능력치를 한 번 더 강화
  if (JINC[id]) return JINC[id];
  const b = D.WEAPONS[id].evo.s, J = D.JIN, o = Object.assign({}, b);
  o.dmg = b.dmg * J.dmg; if (b.cd) o.cd = b.cd * J.cd; if (b.tick) o.tick = b.tick * J.cd; if (b.n) o.n = b.n + (b.n >= 6 ? 2 : 1);
  for (const k of ['r', 'range', 'area', 'w', 'len', 'rad']) if (b[k]) o[k] = b[k] * J.scale;
  return (JINC[id] = o);
}
const wst = w => w.jin ? jinStats(w.id) : w.evo ? D.WEAPONS[w.id].evo.s : D.WEAPONS[w.id].lv[w.lv - 1];

/* ───── 레벨업·상자 선택지 ───── */
function evoReady(S) { return S.W.filter(w => !w.evo && w.lv >= D.MAX_LV && (S.P[D.WEAPONS[w.id].evo.with] || 0) > 0); }
// 합격기: 두 재료 무기가 모두 진화한 상태
function unionReady(S) { for (const k in D.UNIONS) { const u = D.UNIONS[k], a = S.W.find(w => w.id === u.a), b = S.W.find(w => w.id === u.b); if (a && b && a.evo && b.evo) return k; } return null; }
// 선택지 개수: 복주머니(상자 +1), 도깨비 장터(레벨업 -1)
const optCount = S => S.chests > 0 ? 3 + ((S.relics || []).includes('pouch') ? 1 : 0) : (S.wk === 'market' ? 2 : 3);
function choices(S, n = 3, ex = []) {   // ex: 다시 뽑기 때 방금 보여준 선택지 (가능하면 제외)
  if (S.chests > 0) { const ev = evoReady(S); if (ev.length) return [describe({ kind: 'evo', id: ev[0].id })];
    const un = unionReady(S); if (un) return [describe({ kind: 'union', id: un })];
    const jw = S.W.find(w => w.id === S.hero.weapon && w.evo && !w.jin); if (jw && S.lv >= D.JIN.minLv) return [describe({ kind: 'jin', id: jw.id })]; }
  const R = S.R, pool = [];
  const owned = new Set(S.W.flatMap(w => [w.id, ...(D.WEAPONS[w.id].union || [])]));
  for (const w of S.W) if (w.lv < D.MAX_LV && !w.union) pool.push({ kind: 'w', id: w.id, lv: w.lv + 1, wt: 1.6 });   // v3.0: 무기가 많아진 만큼 가진 무기 강화가 더 잘 나오게
  if (S.W.length < D.MAX_W) for (const id in D.WEAPONS) if (!owned.has(id) && !D.isUnion(id)) pool.push({ kind: 'w', id, lv: 1, wt: (S.sets && S.sets[D.SET_OF[id]]) ? 1.35 : 1 });   // 세트를 맞출 수 있는 무기는 조금 더 잘 나옴
  const pc = Object.keys(S.P).length;
  for (const id in S.P) if (S.P[id] < D.MAX_LV) pool.push({ kind: 'p', id, lv: S.P[id] + 1, wt: 1.0 });
  if (pc < D.MAX_P) for (const id in D.PASSIVES) if (!(id in S.P)) {
    // 가진 무기의 진화 짝 패시브는 조금 더 잘 나오게
    const pair = S.W.some(w => D.WEAPONS[w.id].evo.with === id);
    pool.push({ kind: 'p', id, lv: 1, wt: pair ? 2.0 : 0.6 });
  }
  const out = [], key = o => o.kind + ':' + o.id;
  if (ex.length) for (let i = pool.length - 1; i >= 0; i--) if (ex.includes(key(pool[i]))) pool.splice(i, 1);
  const take = filt => { const c = pool.filter(x => filt(x) && !out.includes(x)); if (!c.length) return; let s = 0; for (const x of c) s += x.wt; let r = R() * s; for (const x of c) { r -= x.wt; if (r <= 0) { out.push(x); return; } } out.push(c[c.length - 1]); };
  take(x => x.kind === 'w');               // 공격 수단 최소 1개 보장
  while (out.length < n && out.length < pool.length) take(() => true);
  // 더 올릴 게 없으면 보옥(끝없는 작은 능력치)으로 채움
  if (out.length < n) { let ks = Object.keys(D.ORBS).filter(k => !out.some(o => o.id === k) && !ex.includes('orb:' + k)); if (ks.length < n - out.length) ks = Object.keys(D.ORBS).filter(k => !out.some(o => o.id === k)); while (out.length < n && ks.length) out.push({ kind: 'orb', id: ks.splice((R() * ks.length) | 0, 1)[0] }); }
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
  else if (o.kind === 'jin') { const W = D.WEAPONS[o.id]; o.name = '진·' + W.evo.name; o.icon = W.icon; o.desc = D.JIN.desc; o.from = W.evo.name; }
  else if (o.kind === 'union') { const U = D.UNIONS[o.id]; o.name = U.name; o.icon = o.id; o.desc = U.desc; o.from = D.WEAPONS[U.a].evo.name + ' + ' + D.WEAPONS[U.b].evo.name; }
  else if (o.kind === 'orb') { const O = D.ORBS[o.id]; o.name = O.name; o.icon = O.icon; o.desc = O.desc + ' (중첩)'; }
  else if (o.kind === 'heal') { o.name = '인삼'; o.icon = 'heal'; o.desc = '체력 40% 회복'; }
  else { o.name = '엽전 꾸러미'; o.icon = 'gold'; o.desc = '금화 +25'; }
  return o;
}
function pick(S, o) {
  if (o.kind === 'w') { const w = S.W.find(x => x.id === o.id); if (w) w.lv = Math.min(D.MAX_LV, w.lv + 1); else { addWeapon(S, o.id); recalc(S); } }
  else if (o.kind === 'p') { S.P[o.id] = (S.P[o.id] || 0) + 1; recalc(S); }
  else if (o.kind === 'evo') { const w = S.W.find(x => x.id === o.id); if (w) { w.evo = true; S.evolved.push(o.id); S.ev.push({ k: 'evo', id: o.id }); recalc(S); } }
  else if (o.kind === 'jin') { const w = S.W.find(x => x.id === o.id); if (w) { w.jin = true; S.jin = o.id; S.ev.push({ k: 'evo', id: o.id, jin: true }); } }
  else if (o.kind === 'union') { const U = D.UNIONS[o.id], i = S.W.findIndex(x => x.id === U.a); S.W = S.W.filter(x => x.id !== U.a && x.id !== U.b); S.W.splice(Math.max(0, Math.min(i, S.W.length)), 0, { id: o.id, lv: D.MAX_LV, cd: 0.3, tm: 0, evo: true, union: true }); S.unions.push(o.id); S.ev.push({ k: 'union', id: o.id }); recalc(S); }
  else if (o.kind === 'orb') { S.orbs = S.orbs || {}; S.orbs[o.id] = (S.orbs[o.id] || 0) + 1; recalc(S); }
  else if (o.kind === 'heal') S.p.hp = Math.min(S.p.maxhp, S.p.hp + S.p.maxhp * 0.4);
  else addGold(S, 25);
  if (S.chests > 0) S.chests--; else if (S.pendingLv > 0) S.pendingLv--;
}
const paused = S => S.over || S.pendingLv > 0 || S.chests > 0 || S.otAsk || S.relicAsk;
const sfx = (S, k, gap) => { const T = S.sfxT || (S.sfxT = {}); if ((T[k] || -1) > S.t) return; T[k] = S.t + (gap || 0.06); S.ev.push({ k: 'sfx', s: k }); };   // 같은 소리가 한 프레임에 몰리지 않게
const heal = (S, v) => { const p = S.p; p.hp = Math.min(p.maxhp, p.hp + v * (p.healMul || 1)); };
const addGold = (S, v) => { S.gold += v * S.goldMul; };

/* ───── 스폰 ───── */
function mkEnemy(S, type, x, y) {
  const b = D.ENEMIES[type], t = S.t;
  const om = S.ot ? S.ot.f : 0, hp = Math.round(b.hp * S.mod.hp * D.hpScale(t) * (om ? D.OT.hp(om) : 1) * (b.elite && S.wk === 'blood' ? 1.6 : 1));
  const e = { id: S.uid++, type, spr: b.spr, tint: b.tint, x, y, r: b.r, hp, max: hp, spd: b.spd * (1 + Math.min(t, 600) / 600 * 0.12) * (om ? D.OT.spd(om) : 1) * (S.mod.espd || 1), dmg: b.dmg * S.mod.dmg * D.dmgScale(t) * (om ? D.OT.dmg(om) : 1), xp: b.xp, ai: b.ai, mass: b.mass,
    elite: !!b.elite, sres: om ? Math.min(0.9, 0.06 * om) : 0, kx: 0, ky: 0, hitcd: 0, flash: 0, slowT: 0, slow: 0, stun: 0, hb: {}, st: 0, tm: 1 + S.R() * 3, dx: 0, dy: 0, ph: S.R() * TAU, face: 1 };
  const sk = D.SKINS[type]; if (sk) { const k = sk[(S.R() * sk.length) | 0]; e.spr = k[0]; e.tint = k[2]; e.skin = k[1]; }   // 겉모습만 바꿈
  S.en.push(e); return e;
}
function ringPos(S, rad) { const a = S.R() * TAU; return [S.p.x + Math.cos(a) * rad, S.p.y + Math.sin(a) * rad]; }
function spawnBoss(S, id) {
  const B = D.BOSSES[id], a = S.R() * TAU;
  const hp = Math.round(B.hp * S.mod.bossHp * (S.otBoss ? D.OT.bossHp(S.ot.bosses++) : 1));
  const e = { id: S.uid++, type: id, boss: true, def: B, spr: B.spr, name: B.name, x: S.p.x + Math.cos(a) * 230, y: S.p.y + Math.sin(a) * 230, r: B.r, hp, max: hp,
    spd: B.spd, dmg: B.dmg * S.mod.dmg, xp: 0, mass: 999, kx: 0, ky: 0, hitcd: 0, flash: 0, slowT: 0, slow: 0, stun: 0, hb: {}, face: 1, ang: a + Math.PI, gold: B.gold,
    st: 'idle', tm: 1.6, ai: 0, orb: a, trailT: 0, rage: false };
  e.final = !S.cleared && !S.endless && S.t >= D.BOSS_TIME - 1; if (S.wk === 'rage') e.rage = true; if (e.final) S.bossT0 = S.t;
  S.en.push(e); S.boss = e;
  S.arena = { x: S.p.x, y: S.p.y, r: 280 };
  if (B.segs) { e.segs = []; e.trail = []; for (let i = 0; i < B.segs; i++) { const s = { id: S.uid++, type: 'seg', seg: true, si: i, segSpr: B.segSpr, par: e, x: e.x, y: e.y, r: Math.max(9, 15 - i * 0.4), hp: 1, max: 1, mass: 999, kx: 0, ky: 0, hitcd: 0, flash: 0, slowT: 0, slow: 0, stun: 0, hb: {}, dmg: e.dmg * 0.5, face: 1 }; e.segs.push(s); S.en.push(s); }
    // 처음부터 몸 전체가 보이게: 머리 뒤로 물결치는 몸통 자리를 미리 깔아 둠
    const bx = Math.cos(a), by = Math.sin(a), L = (B.segs + 2) * 17;
    for (let d = 0; d <= L; d += 3) { const w = Math.sin(d / 40) * 18; e.trail.push([e.x + bx * d - by * w, e.y + by * d + bx * w]); }
  }
  S.ev.push({ k: 'boss', id, name: B.name, sub: B.sub, final: e.final, spr: B.spr });
}
function spawning(S, dt) {
  const ch = S.ch;
  while (S.evIdx < ch.events.length && S.t >= ch.events[S.evIdx][0]) {
    const [, k, a, b] = ch.events[S.evIdx++];
    if (k === 'ring') { const n = Math.round(b * S.mod.spawn); for (let i = 0; i < n; i++) { const an = i / n * TAU; mkEnemy(S, a, S.p.x + Math.cos(an) * 320, S.p.y + Math.sin(an) * 320); } S.ev.push({ k: 'warn', txt: '포위당했다!' }); }
    else if (k === 'elite') { let e0; for (let i = 0; i < (S.wk === 'elite' ? 2 : 1); i++) { const [x, y] = ringPos(S, S.viewR + 20); e0 = mkEnemy(S, a, x, y); } S.ev.push({ k: 'warn', txt: ((e0 && e0.skin) || D.ENEMIES[a].name) + ' 출현' }); }
    else if (k === 'boss') { if (!S.boss) spawnBoss(S, a); else S.queuedBoss = a; }
  }
  if (S.queuedBoss && !S.boss) { spawnBoss(S, S.queuedBoss); S.queuedBoss = null; }
  let wv = ch.waves[0]; for (const w of ch.waves) if (S.t >= w[0]) wv = w;
  // 연장전: 1분마다 단계 상승, 정예·우두머리 재등장
  if (S.endless) {
    const sg = Math.min(D.CHAPTERS.length - 1, Math.floor(S.t / D.ENDLESS_SEG));
    if (sg !== S.seg) { S.seg = sg; const c = D.CHAPTERS[sg], ti = D.tierOf(sg + 1, S.hard); S.mod.hp = D.TIER.hp[ti] * (S.wk === 'giant' ? 1.6 : 1); S.mod.dmg = D.TIER.dmg[ti]; S.mod.bossHp = D.TIER.boss[ti]; if (sg > 0) S.ev.push({ k: 'stage', name: c.name }); }
    if (!S.ot && S.t >= 600) S.ot = { t0: 600, k: S.hard ? 0.7 : 0.5, lv: 0, f: 0, elite: S.t + 30, boss: D.ENDLESS_SEG * D.CHAPTERS.length + D.OT.bossEvery, bi: 0, bosses: 0, endless: true };
  }
  const O = S.ot;
  if (O) {
    O.f = (O.start || 0) + (S.t - O.t0) / (O.step || 60) * (O.k || 1); const lv = Math.floor(O.f);
    if (lv > O.lv) { O.lv = lv; const g = D.OT.gold(lv); addGold(S, g); S.ev.push({ k: 'otlv', lv, gold: Math.round(g * S.goldMul) }); }
    if (S.t >= O.elite && !(O.endless && S.t < D.ENDLESS_SEG * D.CHAPTERS.length)) { O.elite = S.t + D.OT.eliteEvery; const el = ch.events.filter(v => v[1] === 'elite'); if (el.length) { const a = el[(S.R() * el.length) | 0][2]; for (let i = 0; i < 1 + (O.lv >> 1); i++) { const [x, y] = ringPos(S, S.viewR + 20); mkEnemy(S, a, x, y); } S.ev.push({ k: 'warn', txt: D.ENEMIES[a].name + ' 무리 출현' }); } }
    if (S.t >= O.boss && !S.boss) { O.boss = S.t + D.OT.bossEvery; const bs = ch.otBosses || ch.events.filter(v => v[1] === 'boss').map(v => v[2]); S.otBoss = true; spawnBoss(S, bs[O.bi++ % bs.length]); S.otBoss = false; }
  }
  const rate = wv[1] * S.mod.spawn * (S.boss ? 0.45 : 1) * (O ? D.OT.rate(O.lv) : 1);
  S.spawnAcc += rate * dt;
  let alive = 0; for (const e of S.en) if (!e.dead && !e.seg) alive++;
  while (S.spawnAcc >= 1) { S.spawnAcc -= 1; if (alive >= D.ENEMY_CAP) continue; const [x, y] = ringPos(S, S.viewR + 30); mkEnemy(S, wpick(S.R, wv[2]), x, y); alive++; }
}

/* ───── 피해 ───── */
function hurtEnemy(S, e, dmg, kx, ky) {
  if (e.dead) return;
  if (e.seg) { e.flash = 0.1; e = e.par; if (e.dead) return; dmg *= 0.2; }
  if (e.boss && S.p.bossMul > 1) dmg *= S.p.bossMul;
  if (e.curse && e.curse.t > 0) dmg *= 1 + e.curse.amp;   // 제웅 저주 표식
  if (S.ledger) dmg *= 1 + Math.min(0.4, Math.floor(S.kills / 1000) * 0.04);   // 염라 장부
  const crit = S.R() < S.p.crit + (S.xcrit || 0);
  dmg = Math.round(dmg * S.p.might * (0.9 + S.R() * 0.2) * (crit ? (S.p.critMul || D.CRIT_MUL) : 1));
  e.hp -= dmg; e.flash = 0.12; S.dmgSum = (S.dmgSum || 0) + Math.min(dmg, e.hp + dmg);
  if (kx || ky) { const m = (S.p.kbMul || 1) / Math.max(1, e.mass); e.kx += kx * m; e.ky += ky * m; }
  sfx(S, 'hit', 0.055);
  if (S.fx.length < 140) S.fx.push({ k: 'num', x: e.x + (S.R() - 0.5) * 10, y: e.y - e.r, v: dmg, t: 0.6, big: e.boss, crit });
  if (crit && S.r7 && !(S.swcd > 0) && S.R() < 0.15) {   // 칠성검: 치명타 → 벼락
    S.swcd = 0.15; S.fx.push({ k: 'bolt', x: e.x, y: e.y, r: 44, t: 0.25, seed: S.R() });
    for (const o of near(S, e.x, e.y, 44, [])) if (o !== e) hurtEnemy(S, o, 24 + S.lv * 2, 0, 0);
    e.hp -= 24 + S.lv * 2;
  }
  if (e.hp <= 0) kill(S, e);
}
function kill(S, e) {
  e.dead = true;
  S.fx.push({ k: 'pop', x: e.x, y: e.y, r: e.r, t: 0.3, c: e.elite || e.boss ? '#ffd36b' : '#b9ff9a' });
  if (e.clone) { addGold(S, 10); S.drops.push({ k: 'bag', x: e.x, y: e.y }); return; }   // 어둑시니 분신
  if (e.boss) {
    for (const o of S.en) if (o.clone && !o.dead) { o.dead = true; S.fx.push({ k: 'pop', x: o.x, y: o.y, r: o.r, t: 0.4, c: '#ffd36b' }); }
    if (e.segs) for (const s of e.segs) { s.dead = true; S.fx.push({ k: 'pop', x: s.x, y: s.y, r: s.r, t: 0.4, c: '#ffd36b' }); }
    S.boss = null; S.arena = null; S.bosses++; addGold(S, e.gold); S.hz.length = 0; S.warn.length = 0; S.hornUsed = false;
    S.drops.push({ k: 'chest', x: e.x, y: e.y, n: e.final ? 1 : 2 });
    if (S.wk !== 'hunger') S.drops.push({ k: 'heal', x: e.x + 30, y: e.y });
    if (e.final) { S.bossT = S.t - S.bossT0; S.cleared = true; S.clearT = S.t; addGold(S, S.ch.clearGold); S.otAsk = !S.noOt; if (S.noOt) S.over = 'clear'; S.ev.push({ k: 'clear' }); }
    else if (S.ot || S.endless) { S.ev.push({ k: 'bossdown', name: e.name, ot: true }); relicOffer(S); }
    else { S.midDone = true; S.ev.push({ k: 'bossdown', name: e.name }); relicOffer(S); }
    return;
  }
  S.kills++; sfx(S, 'kill', 0.07);
  const kh = (S.P.blood ? S.P.blood * D.PASSIVES.blood.per : 0) + (S.p.onKill || 0) + (S.khAura || 0); if (kh) heal(S, kh);
  if (e.curse && e.curse.t > 0) curseSpread(S, e);
  if (e.elite) { S.drops.push({ k: 'chest', x: e.x, y: e.y, n: S.wk === 'market' ? 2 : 1 }); S.drops.push({ k: 'bag', x: e.x + 14, y: e.y }); }
  else if (S.P.fortune && S.R() < S.P.fortune * 0.0002) S.drops.push({ k: 'chest', x: e.x, y: e.y, n: 1 });
  let v = e.xp + S.stashXp; S.stashXp = 0;
  S.gems.push({ x: e.x, y: e.y, v, fly: false, vs: 0 });
  if (S.gems.length > 360) { let fi = 0, fd = -1; for (let i = 0; i < S.gems.length; i++) { const g = S.gems[i], d = hyp(g.x - S.p.x, g.y - S.p.y); if (d > fd && !g.fly) { fd = d; fi = i; } } S.stashXp += S.gems[fi].v; S.gems.splice(fi, 1); }
  const r = S.R();
  if (r < 0.008 && S.wk !== 'hunger') S.drops.push({ k: 'heal', x: e.x, y: e.y });
  else if (r < 0.011) S.drops.push({ k: 'magnet', x: e.x, y: e.y });
  else if (r < 0.061) S.drops.push({ k: 'coin', x: e.x, y: e.y });
}
function hurtPlayer(S, dmg, src, k) {
  const p = S.p; if (S.over) return;
  // 탄환·장판류는 맞은 직후 잠깐 무적 (한 프레임에 몰아서 맞는 것 방지)
  if (src && src !== 'mob' && src !== 'boss') { if (p.ifr > 0) return; p.ifr = 0.35; }
  if (p.ifr2 > 0) return;   // 도깨비 감투
  const RL0 = S.relics || [];
  if (p.guard) { p.guard = false; p.guardT = p.guardCd; p.ifr = Math.max(p.ifr || 0, 0.3); S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 40, t: 0.4, c: '#9fe6ff' }); S.ev.push({ k: 'sfx', s: 'bell' }); return; }   // 수호령
  const arm = p.armor + (RL0.includes('jangseung') && !p.moving ? 3 : 0);
  const d = Math.max(1, Math.round(dmg * (p.dmgTaken || 1) * (1 - (p.dmgCut || 0)) - arm));
  if (RL0.includes('horn') && !S.hornUsed && d >= p.maxhp * 0.12) { S.hornUsed = true; p.ifr = 0.5; S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 60, t: 0.5, c: '#d8d0b0' }); S.ev.push({ k: 'relicfx', id: 'horn' }); return; }   // 해태 뿔
  S.dlog[src || 'mob'] = (S.dlog[src || 'mob'] || 0) + d;
  p.hp -= d; p.hurt = 0.18; S.ev.push({ k: 'hurt' });
  if (k === 'ice') p.chill = 1.2;
  const RL = S.relics || [];
  if (RL.includes('hat')) p.ifr2 = 0.8;
  if (RL.includes('thunder') && !(p.rtcd > 0)) { p.rtcd = 0.5; const c = []; for (const e of S.en) if (!e.dead && !e.seg && hyp(e.x - p.x, e.y - p.y) < 260) c.push(e); for (let i = 0; i < 3 && c.length; i++) { const e = c[(S.R() * c.length) | 0]; S.fx.push({ k: 'bolt', x: e.x, y: e.y, r: 40, t: 0.25, seed: S.R() }); for (const o of near(S, e.x, e.y, 40, TMP2)) hurtEnemy(S, o, 30 + S.lv * 3, 0, 0); } S.ev.push({ k: 'sfx', s: 'thunder' }); }
  if (p.hp <= 0 && RL.includes('herb') && !S.herbUsed) { S.herbUsed = true; p.hp = Math.round(p.maxhp * 0.4); threadFx(S); S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 220, t: 0.5, c: '#6ee7a0' }); for (const e of S.en) { if (e.dead || e.boss || e.seg) continue; const dd = hyp(e.x - p.x, e.y - p.y); if (dd < 200) { e.kx += (e.x - p.x) / (dd || 1) * 500; e.ky += (e.y - p.y) / (dd || 1) * 500; } } S.ev.push({ k: 'relicfx', id: 'herb' }); return; }
  if (p.hp <= 0) { p.hp = 0; S.over = 'dead'; S.ev.push({ k: 'dead' }); }
}
function relicTick(S, dt) {
  const p = S.p; if (p.ifr2 > 0) p.ifr2 -= dt; if (p.rtcd > 0) p.rtcd -= dt;
  if (!(S.relics || []).includes('bell')) return;
  S.rbell = (S.rbell == null ? 20 : S.rbell) - dt;
  if (S.rbell <= 0) { S.rbell = 20; for (const e of near(S, p.x, p.y, 220, TMP)) if (!e.boss && !e.seg) e.stun = Math.max(e.stun || 0, 2 * (1 - (e.sres || 0))); S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 220, t: 0.5, c: '#f2c14e' }); S.ev.push({ k: 'sfx', s: 'bell' }); }
}
/* 유물 고르기 */
function relicOffer(S) {
  const own = S.relics || []; if (own.length >= (S.maxRelic || D.MAX_RELIC)) return;
  const ks = Object.keys(D.RELICS).filter(k => !own.includes(k)), o = [];
  while (o.length < 3 && ks.length) o.push(ks.splice((S.R() * ks.length) | 0, 1)[0]);
  S.relicOpts = o; S.relicAsk = true;
}
function relicPick(S, id) { S.relicAsk = false; S.relics = (S.relics || []).concat(id ? [id] : []); S.r7 = S.relics.includes('sword'); S.ledger = S.relics.includes('ledger'); S.bronze = S.relics.includes('bronze'); recalc(S); }
// 삼신할미 실: 다시 일어설 때 3초 무적 + 폭발
function threadFx(S) {
  if (!(S.relics || []).includes('thread')) return; const p = S.p; p.ifr2 = 3;
  for (const e of near(S, p.x, p.y, 240, [])) hurtEnemy(S, e, 150 + S.lv * 6, 0, 0);
  S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 240, t: 0.6, c: '#ffd36b' }); S.fx.push({ k: 'blast', x: p.x, y: p.y, r: 200, t: 0.4, c: 'fire2' });
}
/* 제웅: 표식이 붙은 적이 쓰러지면 터지고 옆 적에게 옮아감 */
function curseSpread(S, e) {
  const c = e.curse; e.curse = null;
  S.fx.push({ k: 'blast', x: e.x, y: e.y, r: 56, t: 0.3, c: 'curse' });
  const around = near(S, e.x, e.y, 56, []); for (const o of around) if (o !== e) hurtEnemy(S, o, c.burst, 0, 0);
  const cand = near(S, e.x, e.y, 170, []).filter(o => !o.dead && !o.seg && !(o.curse && o.curse.t > 0)).sort((a, b) => hyp(a.x - e.x, a.y - e.y) - hyp(b.x - e.x, b.y - e.y));
  for (let i = 0; i < (c.spread || 1) && i < cand.length; i++) { cand[i].curse = { ...c, t: Math.max(c.t, 2), tick: 0.5 }; S.cursed.push(cand[i]); S.fx.push({ k: 'link', x: e.x, y: e.y, x2: cand[i].x, y2: cand[i].y, t: 0.3 }); }
}
function revive(S) {
  const p = S.p; S.over = ''; S.revived = true; S.revives++; p.hp = Math.round(p.maxhp * 0.6);
  for (const e of S.en) { if (e.dead || e.boss || e.seg) continue; const d = hyp(e.x - p.x, e.y - p.y); if (d < 220) { const k = 600 / Math.max(20, d); e.kx += (e.x - p.x) * k / Math.max(1, e.mass); e.ky += (e.y - p.y) * k / Math.max(1, e.mass); e.hp -= 60; if (e.hp <= 0) kill(S, e); } }
  S.ep.length = 0; S.warn.length = 0; S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 220, t: 0.5, c: '#ffe08a' }); threadFx(S);
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
    let s = wst(w); if (p.extraN && s.n) s = Object.assign({}, s, { n: s.n + p.extraN });   // 분신술
    if (w.id === 'beads') { beads(S, w, s, dt); continue; }
    if (w.id === 'shield') { shields(S, w, s, dt); continue; }
    if (w.id === 'u_bell') {   // 천상결계: 넓은 결계 + 쉬지 않는 방울
      w.tm -= dt; if (w.tm <= 0) { w.tm = s.tick * p.cdMul; for (const e of near(S, p.x, p.y, s.r * A, TMP)) { hurtEnemy(S, e, s.dmg, 0, 0); e.slowT = 0.6; e.slow = s.slow; } }
      w.cd -= dt; if (w.cd <= 0) { w.cd = s.wcd * p.cdMul; bellWave(S, { dmg: s.wdmg, r: s.wr, kb: s.kb, slow: s.slow, twice: true }); anim(S, 'cast'); }
      continue;
    }
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
    } else if (w.id === 'twin') {
      const tn = nearestN(S, 1, s.range * A + 50)[0], a0 = tn ? Math.atan2(tn.y - p.y, tn.x - p.x) : Math.atan2(p.fy, p.fx);
      const half = s.arc / 2 * Math.PI / 180, rr = s.range * A, mul = S.hero.meleeMul || 1; S.xcrit = s.crit || 0;
      for (let i = 0; i < s.n; i++) {
        const an = a0 + (s.back && i % 2 ? Math.PI : 0) + (i % 2 ? 0.3 : -0.3) * (i % 4 < 2 ? 1 : -1);   // 좌우로 엇갈려 베기 (진화: 앞뒤로)
        S.fx.push({ k: 'swing', x: p.x, y: p.y, a: an, arc: half * 2, r: rr * (0.85 + 0.15 * (i % 2)), t: 0.16 + i * 0.03, t0: 0.16 + i * 0.03, evo: w.evo, c: 'twin' });
        for (const e of near(S, p.x, p.y, rr, TMP)) { let da = Math.atan2(e.y - p.y, e.x - p.x) - an; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) <= half + 0.2) hurtEnemy(S, e, s.dmg * mul, 0, 0); }
      }
      S.xcrit = 0; anim(S, 'swing', a0); S.ev.push({ k: 'sfx', s: 'swing' });
    } else if (w.id === 'bow') {
      const cand = []; for (const e of S.en) if (!e.dead && !e.seg && hyp(e.x - p.x, e.y - p.y) < 420) cand.push(e);
      if (!cand.length) { w.cd = 0.3; continue; }
      // 첫 화살은 가장 가까운 적, 나머지는 가장 단단한 적부터
      let ni = 0, nd = 1e9; cand.forEach((e, i) => { const d = hyp(e.x - p.x, e.y - p.y); if (d < nd) { nd = d; ni = i; } });
      const near0 = cand.splice(ni, 1)[0]; cand.sort((a, b) => b.hp - a.hp); cand.unshift(near0);
      const bn = s.n + (S.hero.bowN || 0) + ((S.hm && S.hm.bowN) || 0);
      for (let i = 0; i < bn; i++) { const e = cand[i % cand.length], a = Math.atan2(e.y - p.y, e.x - p.x) + (i >= cand.length ? (i - cand.length + 1) * 0.12 : 0); S.pr.push({ k: 'arrow', x: p.x, y: p.y, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, dmg: s.dmg, pierce: s.pierce, life: 0.75, r: 8, hit: new Set(), a, evo: w.evo }); }
      anim(S, 'throw', Math.atan2(cand[0].y - p.y, cand[0].x - p.x)); S.ev.push({ k: 'sfx', s: 'throw' });
    } else if (w.id === 'gourd') {
      let best = null, bc = -1;
      for (let i = 0; i < 12; i++) { const e = S.en[(S.R() * S.en.length) | 0]; if (!e || e.dead || e.seg || hyp(e.x - p.x, e.y - p.y) > 300) continue; const c = near(S, e.x, e.y, s.r * A, TMP).length; if (c > bc) { bc = c; best = e; } }
      if (!best) { w.cd = 0.4; continue; }
      S.pz.push({ k: 'vortex', x: best.x, y: best.y, r: s.r * A, t: s.dur * p.durMul, t0: s.dur * p.durMul, tick: 0, dmg: s.dmg, pull: s.pull, burst: s.burst || 0, evo: w.evo });
      anim(S, 'cast'); S.ev.push({ k: 'sfx', s: 'wind' });
    } else if (w.id === 'hwando' || w.id === 'u_sword') {   // 부메랑
      const tn = nearestN(S, 1, 320)[0], a0 = tn ? Math.atan2(tn.y - p.y, tn.x - p.x) : Math.atan2(p.fy, p.fx), all = w.id === 'u_sword' || s.n >= 4;
      for (let i = 0; i < s.n; i++) { const a = all ? a0 + i * TAU / s.n : a0 + (i - (s.n - 1) / 2) * 0.4; S.pr.push({ k: 'boom', x: p.x, y: p.y, a, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, spd: s.spd, dmg: s.dmg, range: s.range * p.rangeMul, d: 0, life: 6, r: (s.big ? 17 : 12) * Math.sqrt(A), hit: new Set(), rm: 1, img: w.id === 'u_sword' ? 'r_sword' : 'hwando', big: s.big, evo: w.evo }); }
      anim(S, 'throw', a0); S.ev.push({ k: 'sfx', s: 'swing' });
    } else if (w.id === 'club') {   // 튕김
      const tg = nearestN(S, s.n, 320); if (!tg.length) { w.cd = 0.2; continue; }
      for (let i = 0; i < s.n; i++) { const e = tg[i % tg.length]; S.pr.push({ k: 'club', x: p.x, y: p.y, a: 0, vx: 0, vy: 0, spd: s.spd, tgt: e, dmg: s.dmg, bounce: s.bounce + (p.bounce || 0), coin: s.coin || 0, life: 4, r: 11, hit: new Set(), evo: w.evo }); }
      anim(S, 'throw', Math.atan2(tg[0].y - p.y, tg[0].x - p.x)); S.ev.push({ k: 'sfx', s: 'throw' });
    } else if (w.id === 'foxbead') {   // 흡수
      const tg = nearestN(S, s.n, 320); if (!tg.length) { w.cd = 0.2; continue; }
      for (let i = 0; i < s.n; i++) { const e = tg[i % tg.length], a = Math.atan2(e.y - p.y, e.x - p.x) + (i - (s.n - 1) / 2) * 0.5; S.pr.push({ k: 'fox', x: p.x, y: p.y, a, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, spd: s.spd, tgt: e, dmg: s.dmg, pierce: s.pierce, heal: s.heal, life: 3, r: 9, hit: new Set(), evo: w.evo }); }
      anim(S, 'cast'); S.ev.push({ k: 'sfx', s: 'soul' });
    } else if (w.id === 'sinjang') {   // 소환
      for (let i = 0; i < s.n; i++) { if (S.mn.length >= 12) S.mn.shift(); const a = i / s.n * TAU + S.R(); S.mn.push({ x: p.x + Math.cos(a) * 30, y: p.y + Math.sin(a) * 30, t: s.dur * p.durMul, t0: s.dur * p.durMul, dmg: s.dmg, r: s.r * A, big: s.big, atk: 0.3, tgt: null, tt: 0, face: 1, sw: 0 }); }
      S.fx.push({ k: 'ring', x: p.x, y: p.y, r: 50, t: 0.4, c: '#ffd36b' }); anim(S, 'cast'); S.ev.push({ k: 'sfx', s: 'summon' });
    } else if (w.id === 'jeung') {   // 저주 표식
      const cand = []; for (const e of S.en) if (!e.dead && !e.seg && !(e.curse && e.curse.t > 0) && hyp(e.x - p.x, e.y - p.y) < 320) cand.push(e);
      if (!cand.length) { w.cd = 0.3; continue; }
      cand.sort((a, b) => b.hp - a.hp);
      for (let i = 0; i < s.n && i < cand.length; i++) { const e = cand[i]; e.curse = { t: s.dur * p.durMul, amp: s.amp, dmg: s.dmg, burst: s.burst, spread: s.spread || 1, tick: 0.5 }; S.cursed.push(e); S.fx.push({ k: 'link', x: p.x, y: p.y, x2: e.x, y2: e.y, t: 0.25 }); }
      anim(S, 'cast'); S.ev.push({ k: 'sfx', s: 'curse' });
    } else if (w.id === 'chain') {   // 연쇄 번개
      const starts = nearestN(S, s.n, 300); if (!starts.length) { w.cd = 0.2; continue; }
      for (const st of starts) {
        const pts = [[p.x, p.y]], hit = new Set(); let cur = st, dmg = s.dmg;
        for (let j = 0; j <= s.chain && cur; j++) {
          pts.push([cur.x, cur.y]); hit.add(cur.id); hurtEnemy(S, cur, dmg, 0, 0); if (s.stun && !cur.boss) cur.stun = Math.max(cur.stun || 0, s.stun * (1 - (cur.sres || 0)));
          dmg *= 0.9; let nx = null, nd = 140; for (const o of near(S, cur.x, cur.y, 140, TMP)) { if (hit.has(o.id) || o.seg) continue; const d = hyp(o.x - cur.x, o.y - cur.y); if (d < nd) { nd = d; nx = o; } } cur = nx;
        }
        S.fx.push({ k: 'chain', pts, t: 0.25, evo: w.evo });
      }
      anim(S, 'cast'); S.ev.push({ k: 'sfx', s: 'zap' });
    } else if (w.id === 'frost') {   // 빙결 폭발
      const rr = s.r * A, fz = s.frz * p.frzMul * p.durMul;
      for (const e of near(S, p.x, p.y, rr, TMP)) { hurtEnemy(S, e, s.dmg, 0, 0); if (e.boss || e.seg) { e.slowT = fz; e.slow = 0.5; } else { const f = fz * (1 - (e.sres || 0)); e.stun = Math.max(e.stun || 0, f); e.frz = Math.max(e.frz || 0, f); } }
      if (s.shards) for (let i = 0; i < s.shards; i++) { const a = i / s.shards * TAU + S.R() * 0.3; S.pr.push({ k: 'knife', ice: true, x: p.x, y: p.y, vx: Math.cos(a) * 420, vy: Math.sin(a) * 420, dmg: s.dmg * 0.5, pierce: 3, life: 0.7, r: 7, hit: new Set(), a, evo: true }); }
      S.fx.push({ k: 'nova', x: p.x, y: p.y, r: rr, t: 0.45, evo: w.evo }); anim(S, 'cast'); S.ev.push({ k: 'sfx', s: 'frost' });
    } else if (w.id === 'hwacha' || w.id === 'u_hwacha') {   // 일제 사격
      const tn = nearestN(S, 1, 400)[0]; if (!tn) { w.cd = 0.2; continue; }
      const a0 = Math.atan2(tn.y - p.y, tn.x - p.x), sp = Math.min(0.11, 1.3 / s.n), er = s.r * A * p.boomMul;
      for (let i = 0; i < s.n; i++) { const a = a0 + (i - (s.n - 1) / 2) * sp + (S.R() - 0.5) * 0.06, v = s.spd * (0.9 + S.R() * 0.2); S.pr.push({ k: 'rocket', x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, a, dmg: s.dmg, er, pierce: s.pierce || 1, life: 0.95 + S.R() * 0.15, r: 6, hit: new Set(), fire: w.id === 'u_hwacha', evo: w.evo }); }
      anim(S, 'throw', a0); S.ev.push({ k: 'sfx', s: 'rocket' });
    } else if (w.id === 'bomb') {   // 시한폭탄
      let made = 0;
      for (let k = 0; k < s.n; k++) {
        let best = null, bc = -1; for (let i = 0; i < 10; i++) { const e = S.en[(S.R() * S.en.length) | 0]; if (!e || e.dead || e.seg || hyp(e.x - p.x, e.y - p.y) > 260) continue; const c = near(S, e.x, e.y, 80, TMP).length - hyp(e.x - p.x, e.y - p.y) / 120; if (c > bc) { bc = c; best = e; } }
        if (!best) continue; made++;
        S.pz.push({ k: 'bomb', x: best.x + (S.R() - 0.5) * 20, y: best.y + (S.R() - 0.5) * 20, sx: p.x, sy: p.y, t: s.fuse, t0: s.fuse, dmg: s.dmg, r: s.r * A * p.boomMul, chain: s.chain || 0, evo: w.evo });
      }
      if (!made) { w.cd = 0.3; continue; }
      anim(S, 'throw'); S.ev.push({ k: 'sfx', s: 'throw' });
    } else if (w.id === 'feather') {   // 광선
      const tn = nearestN(S, 1, 420)[0]; if (!tn) { w.cd = 0.2; continue; }
      const a0 = Math.atan2(tn.y - p.y, tn.x - p.x), len = s.len * p.rangeMul, bw = s.w * A;
      for (let i = 0; i < s.n; i++) {
        const a = a0 + (i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 0.32), ux = Math.cos(a), uy = Math.sin(a);
        for (const e of S.en) { if (e.dead) continue; const dx = e.x - p.x, dy = e.y - p.y, al = dx * ux + dy * uy; if (al < -e.r || al > len + e.r) continue; if (Math.abs(dx * -uy + dy * ux) < bw / 2 + e.r) hurtEnemy(S, e, s.dmg, ux * 60, uy * 60); }
        S.fx.push({ k: 'beam', x: p.x, y: p.y, a, len, w: bw, t: 0.32, t0: 0.32, evo: w.evo });
      }
      anim(S, 'cast', a0); S.ev.push({ k: 'sfx', s: 'beam' });
    } else if (w.id === 'water') {   // 이동 장판
      w.cd = s.cd;   // 공격 속도와 무관하게 일정 간격
      if (S.pz.some(z => z.k === 'water' && hyp(z.x - p.x, z.y - p.y) < z.r * 0.6)) continue;
      S.pz.push({ k: 'water', x: p.x, y: p.y + 6, r: s.r * A, t: s.life * p.durMul, t0: s.life * p.durMul, tick: 0, dmg: s.dmg, slow: s.slow, heal: s.heal || 0, evo: w.evo });
    } else if (w.id === 'u_thunder') {   // 뇌정부
      const tg = nearestN(S, s.n, 360); if (!tg.length) { w.cd = 0.15; continue; }
      for (let i = 0; i < s.n; i++) { const e = tg[i % tg.length]; const a = Math.atan2(e.y - p.y, e.x - p.x) + (i >= tg.length ? (i - tg.length + 1) * 0.18 : 0); S.pr.push({ k: 'tal', x: p.x, y: p.y, vx: Math.cos(a) * s.spd, vy: Math.sin(a) * s.spd, dmg: s.dmg, pierce: s.pierce, life: 1.3, r: 8, hit: new Set(), a, evo: true, bolt: s.bolt, br: s.br * A, boltN: 3 }); }
      anim(S, 'throw', Math.atan2(tg[0].y - p.y, tg[0].x - p.x)); S.ev.push({ k: 'sfx', s: 'throw' });
    } else if (w.id === 'u_soul') {   // 백귀흡혼
      let best = null, bc = -1;
      for (let i = 0; i < 14; i++) { const e = S.en[(S.R() * S.en.length) | 0]; if (!e || e.dead || e.seg || hyp(e.x - p.x, e.y - p.y) > 320) continue; const c = near(S, e.x, e.y, s.r * A, TMP).length; if (c > bc) { bc = c; best = e; } }
      if (!best) { w.cd = 0.4; continue; }
      const du = s.dur * p.durMul; S.pz.push({ k: 'vortex', x: best.x, y: best.y, r: s.r * A, t: du, t0: du, tick: 0, dmg: s.dmg, pull: s.pull, burst: s.burst, evo: true, soul: s.soul, sr: s.sr * A, st: 0 });
      anim(S, 'cast'); S.ev.push({ k: 'sfx', s: 'wind' });
    } else if (w.id === 'u_quake') {   // 천근추
      const rr = s.range * A, mul = S.hero.meleeMul || 1;
      S.fx.push({ k: 'swing', x: p.x, y: p.y, a: 0, arc: TAU, r: rr, t: 0.25, t0: 0.25, evo: true });
      for (const e of near(S, p.x, p.y, rr, TMP)) { const d = hyp(e.x - p.x, e.y - p.y) || 1; hurtEnemy(S, e, s.dmg * mul, (e.x - p.x) / d * s.kb, (e.y - p.y) / d * s.kb); }
      for (let i = 0; i < s.n; i++) { const a = i / s.n * TAU + S.R() * 0.2, d = 70 + (i % 2) * 90 + S.R() * 40; S.pz.push({ k: 'quake', x: p.x + Math.cos(a) * d * A, y: p.y + Math.sin(a) * d * A, r: s.r * A, delay: 0.15 + (i % 2) * 0.15, dmg: s.rock, stun: s.stun, t: 0.7, evo: true }); }
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
function shields(S, w, s, dt) {   // 등패: 도는 방패, 적 탄 막기
  const p = S.p; w.tm += dt * s.rot; w.pos = w.pos || []; w.pos.length = s.n;
  const rad = s.rad * p.area, hr = s.big ? 26 : 20;
  for (let i = 0; i < s.n; i++) {
    const a = w.tm + i / s.n * TAU, x = p.x + Math.cos(a) * rad, y = p.y + Math.sin(a) * rad; w.pos[i] = [x, y, a];
    for (const e of near(S, x, y, hr, TMP)) { if ((e.hb.s || 0) > S.t) continue; e.hb.s = S.t + s.hitcd; const d = hyp(e.x - p.x, e.y - p.y) || 1; hurtEnemy(S, e, s.dmg, (e.x - p.x) / d * s.kb, (e.y - p.y) / d * s.kb); }
    for (const q of S.ep) { if (q.life <= 0 || hyp(q.x - x, q.y - y) > hr + q.r) continue; q.life = 0; S.fx.push({ k: 'pop', x: q.x, y: q.y, r: 8, t: 0.25, c: '#ffd36b' }); sfx(S, 'clang', 0.09);
      if (s.reflect) { const t = S.boss || nearestN(S, 1, 400)[0], an = t ? Math.atan2(t.y - q.y, t.x - q.x) : Math.atan2(-q.vy, -q.vx); S.pr.push({ k: 'refl', x: q.x, y: q.y, vx: Math.cos(an) * 420, vy: Math.sin(an) * 420, a: an, dmg: s.dmg * 1.5, pierce: 2, life: 1.2, r: 8, hit: new Set(), col: q.k }); } }
  }
}
function minions(S, dt) {   // 신장
  const keep = [];
  for (const m of S.mn) {
    m.t -= dt; if (m.t <= 0) { S.fx.push({ k: 'pop', x: m.x, y: m.y, r: 16, t: 0.3, c: '#ffd36b' }); continue; }
    m.tt -= dt; if (m.tt <= 0 || !m.tgt || m.tgt.dead) { m.tt = 0.3; let b = null, bd = 260; for (const e of S.en) { if (e.dead || e.seg) continue; const d = hyp(e.x - m.x, e.y - m.y); if (d < bd) { bd = d; b = e; } } m.tgt = b; }
    const tx = m.tgt ? m.tgt.x : S.p.x + 40, ty = m.tgt ? m.tgt.y : S.p.y, dx = tx - m.x, dy = ty - m.y, d = hyp(dx, dy) || 1;
    if (d > (m.tgt ? m.r * 0.6 : 50)) { const v = Math.min(d, 175 * dt); m.x += dx / d * v; m.y += dy / d * v; }
    if (Math.abs(dx) > 2) m.face = dx > 0 ? 1 : -1;
    m.atk -= dt; m.sw = Math.max(0, m.sw - dt);
    if (m.atk <= 0 && m.tgt && d < m.r + m.tgt.r) { m.atk = 0.5; m.sw = 0.2; for (const e of near(S, m.x, m.y, m.r, TMP2)) hurtEnemy(S, e, m.dmg, dx / d * 60, dy / d * 60); S.fx.push({ k: 'swing', x: m.x, y: m.y, a: Math.atan2(dy, dx), arc: 2.4, r: m.r, t: 0.16, t0: 0.16, evo: m.big, c: 'twin' }); }
    keep.push(m);
  }
  S.mn = keep;
}
function curses(S, dt) {   // 제웅 저주 피해
  if (!S.cursed.length) return;
  const keep = [];
  for (const e of S.cursed) { const c = e.curse; if (e.dead || !c || c.t <= 0) { if (c && !e.dead) e.curse = null; continue; } c.t -= dt; c.tick -= dt; if (c.tick <= 0) { c.tick = 0.5; hurtEnemy(S, e, c.dmg * 0.5, 0, 0); } if (!e.dead && e.curse) keep.push(e); }
  S.cursed = keep;
}
function retarget(S, q, x, y, r) { let b = null, bd = r; for (const o of near(S, x, y, r, TMP2)) { if (o.seg || q.hit.has(o.id)) continue; const d = hyp(o.x - x, o.y - y); if (d < bd) { bd = d; b = o; } } return b; }
function explode(S, x, y, r, dmg, c) { for (const e of near(S, x, y, r, TMP2)) hurtEnemy(S, e, dmg, 0, 0); S.fx.push({ k: 'blast', x, y, r, t: 0.3, c: c || 'fire2' }); sfx(S, 'boom', 0.12); }
function projectiles(S, dt) {
  const keep = [], p = S.p;
  for (const q of S.pr) {
    if (q.k === 'soul') {
      if (!q.tgt || q.tgt.dead) { let best = null, bd = 1e9; for (const e of S.en) { if (e.dead || e.seg) continue; const d = hyp(e.x - q.x, e.y - q.y); if (d < bd && d < 300) { bd = d; best = e; } } q.tgt = best; }
      if (q.tgt) { const a = Math.atan2(q.tgt.y - q.y, q.tgt.x - q.x), c = Math.atan2(q.vy, q.vx); let da = Math.atan2(Math.sin(a - c), Math.cos(a - c)); const na = c + Math.max(-5 * dt, Math.min(5 * dt, da)); q.vx = Math.cos(na) * q.spd; q.vy = Math.sin(na) * q.spd; q.a = na; }
    }
    if (q.k === 'boom') {   // 환도: 사거리까지 갔다가 주인에게 되돌아옴
      q.rot = (q.rot || 0) + dt * 16;
      if (!q.back) { q.d += q.spd * dt; if (q.d >= q.range) { q.back = true; q.hit.clear(); } }
      else { const dx = p.x - q.x, dy = p.y - q.y, d = hyp(dx, dy) || 1; q.vx = dx / d * q.spd * 1.15; q.vy = dy / d * q.spd * 1.15; if (d < 18) q.life = 0; }
    }
    if ((q.k === 'club' || q.k === 'fox') && q.tgt) {
      if (q.tgt.dead) q.tgt = retarget(S, q, q.x, q.y, 220);
      if (q.tgt) { const dx = q.tgt.x - q.x, dy = q.tgt.y - q.y, d = hyp(dx, dy) || 1;
        if (q.k === 'club') { q.vx = dx / d * q.spd; q.vy = dy / d * q.spd; q.a += dt * 14; }
        else { const a = Math.atan2(dy, dx), c = Math.atan2(q.vy, q.vx), da = Math.atan2(Math.sin(a - c), Math.cos(a - c)), na = c + Math.max(-7 * dt, Math.min(7 * dt, da)); q.vx = Math.cos(na) * q.spd; q.vy = Math.sin(na) * q.spd; q.a = na; } }
    }
    if (q.k === 'wave') { q.x = p.x; q.y = p.y; q.t += dt; q.r0 = q.rmax * Math.min(1, q.t / q.dur); }
    else { q.x += q.vx * dt; q.y += q.vy * dt; }
    q.life -= dt;
    if (q.k === 'tal' || q.k === 'knife' || q.k === 'arrow' || q.k === 'refl') {
      for (const e of near(S, q.x, q.y, q.r, TMP)) { const id = e.seg ? e.par.id : e.id; if (q.hit.has(id)) continue; q.hit.add(id); const ex = e.x, ey = e.y; hurtEnemy(S, e, q.dmg, q.vx * 0.12, q.vy * 0.12);
        if (q.bolt && q.boltN > 0) { q.boltN--; S.fx.push({ k: 'bolt', x: ex, y: ey, r: q.br, t: 0.25, seed: S.R(), evo: true }); for (const o of near(S, ex, ey, q.br, TMP2)) hurtEnemy(S, o, q.bolt, 0, 0); }
        if (--q.pierce <= 0) { q.life = 0; break; } }
    } else if (q.k === 'boom') {
      for (const e of near(S, q.x, q.y, q.r, TMP)) { const id = e.seg ? e.par.id : e.id; if (q.hit.has(id)) continue; q.hit.add(id); hurtEnemy(S, e, q.dmg, q.vx * 0.1, q.vy * 0.1); }
    } else if (q.k === 'club') {
      if (!q.tgt) q.life = 0;
      else if (hyp(q.tgt.x - q.x, q.tgt.y - q.y) < q.r + q.tgt.r) { const e = q.tgt, id = e.seg ? e.par.id : e.id; q.hit.add(id); hurtEnemy(S, e, q.dmg, q.vx * 0.15, q.vy * 0.15);
        if (q.coin && e.dead && !e.boss && S.R() < q.coin * 3) S.drops.push({ k: 'coin', x: e.x, y: e.y });
        S.fx.push({ k: 'pop', x: q.x, y: q.y, r: 10, t: 0.2, c: '#f2c14e' }); sfx(S, 'bonk', 0.05);
        if (--q.bounce < 0) q.life = 0; else { q.tgt = retarget(S, q, q.x, q.y, 190); if (!q.tgt) q.life = 0; } }
    } else if (q.k === 'fox') {
      for (const e of near(S, q.x, q.y, q.r, TMP)) { const id = e.seg ? e.par.id : e.id; if (q.hit.has(id)) continue; q.hit.add(id); hurtEnemy(S, e, q.dmg, 0, 0);
        const v = Math.min(q.heal * (p.healMul || 1), S.drainB); if (v > 0) { S.drainB -= v; p.hp = Math.min(p.maxhp, p.hp + v); }
        if (--q.pierce <= 0) { q.life = 0; break; } q.tgt = retarget(S, q, q.x, q.y, 220); }
    } else if (q.k === 'rocket') {
      for (const e of near(S, q.x, q.y, q.r, TMP)) { const id = e.seg ? e.par.id : e.id; if (q.hit.has(id)) continue; q.hit.add(id); explode(S, q.x, q.y, q.er, q.dmg, 'fire2'); if (--q.pierce <= 0) { q.life = 0; q.done = true; break; } }
      if (q.life <= 0 && !q.done) { q.done = true; explode(S, q.x, q.y, q.er, q.dmg * 0.6, 'fire2'); }
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
        if (Math.abs(along) < 22 + e.r && Math.abs(side) < q.w / 2 + e.r) { q.hit.add(id); hurtEnemy(S, e, q.dmg, ux * q.kb, uy * q.kb); if (q.stun && !e.boss) e.stun = Math.max(e.stun || 0, q.stun * (1 - (e.sres || 0))); }
      }
    }
    if (q.life > 0) keep.push(q);
  }
  S.pr = keep;
  // 내 장판(지진·저승불)
  const zk = []; S.inWater = 0;
  for (const z of S.pz) {
    z.t -= dt;
    if (z.k === 'quake') { z.delay -= dt; if (z.delay <= 0 && !z.done) { z.done = true; for (const e of near(S, z.x, z.y, z.r, TMP)) { hurtEnemy(S, e, z.dmg, 0, 0); if (z.stun && !e.boss) e.stun = z.stun * (1 - (e.sres || 0)); } S.fx.push({ k: 'rock', x: z.x, y: z.y, r: z.r, t: 0.45, evo: z.evo }); } }
    else if (z.k === 'vortex') {   // 호리병: 빨아들이며 피해, 진화하면 끝에 폭발
      for (const e of near(S, z.x, z.y, z.r, TMP)) { if (e.boss || e.seg) continue; const dx = z.x - e.x, dy = z.y - e.y, d = hyp(dx, dy); if (d > 4) { const m = Math.min(d, z.pull * dt / Math.sqrt(Math.max(1, e.mass))); e.x += dx / d * m; e.y += dy / d * m; } }
      z.tick -= dt; if (z.tick <= 0) { z.tick = 0.3; for (const e of near(S, z.x, z.y, z.r, TMP)) hurtEnemy(S, e, z.dmg, 0, 0); }
      if (z.t <= 0 && z.burst) { for (const e of near(S, z.x, z.y, z.r, TMP)) hurtEnemy(S, e, z.burst, 0, 0); S.fx.push({ k: 'boom', x: z.x, y: z.y, r: z.r, t: 0.4, c: '#c58bff' }); }
      if (z.soul) { z.st -= dt; if (z.st <= 0) { z.st = 0.35; const c = near(S, z.x, z.y, z.r * 2.2, TMP); const e = c.length ? c[(S.R() * c.length) | 0] : null; if (e && !e.seg) { const a = S.R() * TAU; S.pr.push({ k: 'soul', x: z.x, y: z.y, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, spd: 220, tgt: e, dmg: z.soul, er: z.sr, life: 2.5, r: 8, hit: new Set(), a, evo: true, rm: 1 }); } } }
    }
    else if (z.k === 'bomb') { if (z.t <= 0) { explode(S, z.x, z.y, z.r, z.dmg, 'fire2'); S.ev.push({ k: 'sfx', s: 'boom' }); for (let i = 0; i < z.chain; i++) { const a = i / z.chain * TAU + S.R(); zk.push({ k: 'bomb', x: z.x + Math.cos(a) * z.r * 0.8, y: z.y + Math.sin(a) * z.r * 0.8, sx: z.x, sy: z.y, t: 0.35 + i * 0.15, t0: 0.35 + i * 0.15, dmg: z.dmg * 0.5, r: z.r * 0.6, chain: 0, small: true }); } } }
    else if (z.k === 'water') { z.tick -= dt; if (z.tick <= 0) { z.tick = 0.5; for (const e of near(S, z.x, z.y, z.r, TMP)) { hurtEnemy(S, e, z.dmg, 0, 0); e.slowT = 0.6; e.slow = Math.max(e.slowT > 0 ? e.slow || 0 : 0, z.slow); } } if (z.heal && hyp(p.x - z.x, p.y - z.y) < z.r) S.inWater = z.heal; }
    else if (z.k === 'burn') { z.tick -= dt; if (z.tick <= 0) { z.tick = 0.4; for (const e of near(S, z.x, z.y, z.r, TMP)) hurtEnemy(S, e, z.dmg, 0, 0); } }
    if (z.t > 0) zk.push(z);
  }
  S.pz = zk;
  if (S.inWater) heal(S, S.inWater * dt);
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
      if (e.stun > 0) { e.stun -= dt; sp = 0; } if (e.frz > 0) e.frz -= dt;
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
    if (e.hitcd <= 0 && !e.vanish && hyp(p.x - e.x, p.y - e.y) < p.r + e.r - 2) { e.hitcd = 0.6; e.bite = 0.28; e.ba = Math.atan2(p.y - e.y, p.x - e.x); hurtPlayer(S, e.boss && e.st === 'dash' ? e.dmg * 1.3 : e.dmg, e.boss ? 'boss' : 'mob'); }
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
    if (q.life > 0 && hyp(q.x - p.x, q.y - p.y) < q.r + p.r - 3) {
      q.life = 0;
      if (S.bronze && S.R() < 0.3) { const t = S.boss || nearestN(S, 1, 400)[0], an = t ? Math.atan2(t.y - q.y, t.x - q.x) : Math.atan2(-q.vy, -q.vx); S.pr.push({ k: 'refl', x: q.x, y: q.y, vx: Math.cos(an) * 420, vy: Math.sin(an) * 420, a: an, dmg: 40 + S.lv * 3, pierce: 2, life: 1.2, r: 8, hit: new Set(), col: q.k }); S.fx.push({ k: 'pop', x: q.x, y: q.y, r: 12, t: 0.3, c: '#c9e6ff' }); }
      else hurtPlayer(S, q.dmg, 'shot', q.k);
    }
    if (q.life > 0) keep.push(q);
  }
  S.ep = keep;
  // 예고 후 떨어지는 공격
  const wk = [];
  for (const w of S.warn) { if (w.hold > 0) { w.hold -= dt; wk.push(w); continue; } w.t -= dt; if (w.t <= 0) { if (hyp(p.x - w.x, p.y - w.y) < w.r + p.r - 4) hurtPlayer(S, w.dmg, 'rain', w.k); S.fx.push({ k: 'blast', x: w.x, y: w.y, r: w.r, t: 0.35, c: w.k }); if (w.pool) S.hz.push({ x: w.x, y: w.y, r: w.r * 0.85, t: w.pool.life, t0: w.pool.life, dmg: w.pool.dmg * S.mod.dmg, k: w.k }); } else { wk.push(w); S.tele.push({ k: 'circle', x: w.x, y: w.y, r: w.r, p: 1 - w.t / w.t0 }); } }
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
  else if (a.t === 'rain') { for (let i = 0; i < n; i++) { const ang = S.R() * TAU, d = i === 0 ? 0 : 40 + S.R() * 130; let x = p.x + Math.cos(ang) * d + p.vx * 0.4, y = p.y + Math.sin(ang) * d + p.vy * 0.4; S.warn.push({ x, y, r: a.r, t: a.delay, t0: a.delay, dmg: a.dmg * S.mod.dmg, k: a.k, pool: a.pool }); } }
  else if (a.t === 'wall') {
    // 탄막 벽: 플레이어 쪽으로 밀려오는 한 줄, 한 군데만 빈틈
    const walls = a.cross ? [toP, toP + Math.PI / 2] : [toP];
    for (const wa of walls) {
      const ux = Math.cos(wa), uy = Math.sin(wa), cx = p.x - ux * 300, cy = p.y - uy * 300, gap = (S.R() - 0.5) * a.w * 0.6, step = 26;
      for (let o = -a.w / 2; o <= a.w / 2; o += step) { if (Math.abs(o - gap) < a.gap / 2) continue; S.ep.push({ x: cx - uy * o, y: cy + ux * o, vx: ux * a.spd, vy: uy * a.spd, r: 8, dmg: a.dmg * S.mod.dmg, life: 5.5, home: 0, k: a.k }); }
    }
  }
  else if (a.t === 'tri') {
    // 세 머리가 세 방향으로
    for (let h = 0; h < 3; h++) { const base = toP + (h - 1) * 2.1; for (let i = 0; i < n; i++) shoot(S, b.x, b.y, base + (n > 1 ? (i / (n - 1) - 0.5) * a.ang : 0), a.spd, a.dmg, { k: a.k }); }
  }
  else if (a.t === 'judge') {
    // 심판의 원: 1차로 안쪽 큰 원이 터지고, 바로 이어서 그 바깥 고리가 터짐 → 밖으로 피했다가 다시 안으로
    const cx = p.x, cy = p.y, rot = S.R() * TAU, inv = b.rage && S.R() < 0.5;   // 분노 시 절반 확률로 순서 반대
    const inner = [[cx, cy, a.r]], outer = [];
    for (let i = 0; i < 10; i++) { const an = rot + i / 10 * TAU; outer.push([cx + Math.cos(an) * a.r * 1.6, cy + Math.sin(an) * a.r * 1.6, a.r * 0.56]); }
    const [w1, w2] = inv ? [outer, inner] : [inner, outer];
    for (const [x, y, r] of w1) S.warn.push({ x, y, r, t: a.delay, t0: a.delay, dmg: a.dmg * S.mod.dmg, k: a.k });
    for (const [x, y, r] of w2) S.warn.push({ x, y, r, t: a.gap, t0: a.gap, hold: a.delay, dmg: a.dmg * S.mod.dmg, k: a.k });
  }
  else if (a.t === 'summon') { for (let i = 0; i < n; i++) { const an = i / n * TAU; const e = mkEnemy(S, a.type, b.x + Math.cos(an) * 60, b.y + Math.sin(an) * 60); } }
  b.cast = 0.35; b.ca = toP; S.ev.push({ k: 'sfx', s: 'bossatk' });
}
/* 어둑시니: 체력 절반에서 분신이 갈라져 나옴 (분신은 체력 25%, 공격 방식 동일, 처치 시 금화) */
function splitBoss(S, b, n) {
  for (let i = 0; i < n; i++) {
    const an = S.R() * TAU, hp = Math.round(b.max * 0.25);
    const c = Object.assign({}, b, { id: S.uid++, clone: true, boss: true, spr: b.spr + '_s', r: b.r * 0.7, hp, max: hp, x: b.x + Math.cos(an) * 50, y: b.y + Math.sin(an) * 50, hb: {}, st: 'idle', tm: 0.8 + i * 0.6, ai: i + 1, rage: true, segs: null, gold: 0, final: false, spd: b.spd * 1.15, dmg: b.dmg * 0.7 });
    S.en.push(c); S.fx.push({ k: 'ring', x: c.x, y: c.y, r: 60, t: 0.4, c: '#9a7ad8' });
  }
  S.ev.push({ k: 'warn', txt: b.name + ' 분열!' });
}
function bossAI(S, b, dt) {
  const p = S.p, B = b.def, dx = p.x - b.x, dy = p.y - b.y, d = hyp(dx, dy) || 1, toP = Math.atan2(dy, dx);
  if (!b.rage && b.hp < b.max * 0.5) { b.rage = true; S.ev.push({ k: 'rage', name: b.name }); if (B.rage && B.rage.split && !b.clone) splitBoss(S, b, B.rage.split); }
  const R = b.rage && B.rage || {}, list = R.atk || B.atk, mul = R.mul || {};
  b.tm -= dt; if (Math.abs(dx) > 1) b.face = dx > 0 ? 1 : -1;
  const mv = (a, sp) => { b.x += Math.cos(a) * sp * dt; b.y += Math.sin(a) * sp * dt; };
  const A = S.arena;
  const lock = b.st === 'aim' || b.st === 'dash' || b.st === 'rest' || b.st === 'stomp' || b.st === 'blink' || b.st === 'ambush' || b.st === 'breath' || b.st === 'slam' || b.st === 'sweep';
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
      else if (a.t === 'ambush') {
        // 등 뒤(움직이는 방향의 반대)가 진짜, 나머지는 가짜 예고
        const mvA = hyp(p.vx, p.vy) > 10 ? Math.atan2(p.vy, p.vx) : toP, nf = Math.round(a.fake * (mul.n || 1));
        b.spots = [[p.x - Math.cos(mvA) * 70, p.y - Math.sin(mvA) * 70]];
        for (let i = 0; i < nf; i++) { const an = mvA + (i + 1) / (nf + 1) * TAU; b.spots.push([p.x - Math.cos(an) * 90, p.y - Math.sin(an) * 90]); }
        b.st = 'ambush'; b.tm = 0.8; b.vanish = true;
      }
      else if (a.t === 'breath') { b.st = 'aim'; b.tm = 0.75; b.ang = toP; b.wv = 0; }
      else if (a.t === 'slam') { b.st = 'slam'; b.tm = a.delay; b.ang = toP; }
      else if (a.t === 'sweep') { b.st = 'sweep'; b.tm = a.dur; b.sw = S.R() * TAU; b.swT = 0; b.swDir = S.R() < 0.5 ? 1 : -1; }
      else { fire(S, b, a); after(a); b.tm = cd; }
    }
  } else if (b.st === 'aim' && b.cur.t === 'breath') {
    b.ang += Math.max(-1.5 * dt, Math.min(1.5 * dt, Math.atan2(Math.sin(toP - b.ang), Math.cos(toP - b.ang))));
    S.tele.push({ k: 'cone', x: b.x, y: b.y, a: b.ang, len: 260, ang: b.cur.ang, w: 150 });
    if (b.tm <= 0) { b.st = 'breath'; b.tm = 0; }
  } else if (b.st === 'breath') {
    // 부채꼴 불길: 짧은 간격으로 여러 번 내뿜음
    if (b.tm <= 0) { const a = b.cur, n = Math.round(a.n * (mul.n || 1)); for (let i = 0; i < n; i++) shoot(S, b.x, b.y, b.ang + (i / (n - 1) - 0.5) * a.ang + (S.R() - 0.5) * 0.08, a.spd * (0.9 + S.R() * 0.2), a.dmg, { k: a.k, life: 1.6 }); b.cast = 0.3; b.ca = b.ang; S.ev.push({ k: 'sfx', s: 'bossatk' }); b.tm = 0.16; if (++b.wv >= a.waves) { b.st = 'idle'; b.tm = a.cd * (mul.cd || 1); after(a); } }
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
  } else if (b.st === 'ambush') {
    for (const [x, y] of b.spots) S.tele.push({ k: 'circle', x, y, r: b.cur.r, p: 1 - b.tm / 0.8 });
    if (b.tm <= 0) { const [x, y] = b.spots[0]; b.x = x; b.y = y; b.vanish = false; b.st = 'stomp'; b.cur = { r: b.cur.r, delay: 0.3, dmg: b.cur.dmg, cd: b.cur.cd }; b.tm = 0.3; }
  } else if (b.st === 'slam') {
    S.tele.push({ k: 'line', x: b.x, y: b.y, a: b.ang, len: b.cur.len, w: b.cur.w, p: 1 - b.tm / b.cur.delay });
    if (b.tm <= 0) {
      const ux = Math.cos(b.ang), uy = Math.sin(b.ang), rx = p.x - b.x, ry = p.y - b.y, al = rx * ux + ry * uy, sd = Math.abs(-rx * uy + ry * ux);
      if (al > -20 && al < b.cur.len && sd < b.cur.w / 2 + p.r) hurtPlayer(S, b.cur.dmg * S.mod.dmg, 'stomp');
      for (let d0 = 30; d0 < b.cur.len; d0 += 40) S.fx.push({ k: 'ring', x: b.x + ux * d0, y: b.y + uy * d0, r: b.cur.w * 0.6, t: 0.3, c: '#c9b38a' });
      S.ev.push({ k: 'sfx', s: 'bossatk' }); after(b.cur); b.st = 'idle'; b.tm = b.cur.cd * (mul.cd || 1);
    }
  } else if (b.st === 'sweep') {
    // 꼬리 휘두르기: 회전하는 탄 줄기
    b.swT -= dt; b.sw += dt * 1.7 * b.swDir;
    if (b.swT <= 0) { b.swT = b.cur.rate; const arms = Math.round(b.cur.arms * (mul.n || 1)); for (let i = 0; i < arms; i++) shoot(S, b.x, b.y, b.sw + i / arms * TAU, b.cur.spd, b.cur.dmg, { k: b.cur.k, life: 3 }); }
    if (b.tm <= 0) { b.st = 'idle'; b.tm = b.cur.cd * (mul.cd || 1); after(b.cur); }
  } else if (b.st === 'blink') {
    S.tele.push({ k: 'circle', x: b.bx, y: b.by, r: 40, p: 1 - b.tm / 0.75 });
    if (b.tm <= 0) { b.x = b.bx; b.y = b.by; fire(S, b, { t: 'ring', n: b.cur.n, spd: b.cur.spd, dmg: b.cur.dmg, k: b.cur.k }); after(b.cur); b.st = 'idle'; b.tm = b.cur.cd * (mul.cd || 1); }
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
    if (d < 14) { g.got = true; S.xp += g.v * p.xpMul; sfx(S, 'xp', 0.04); }
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
  if (S.wk === 'mirror') mx = -mx;   // 거울 세계
  if (m > 1) { mx /= m; my /= m; }
  p.moving = m > 0.05;
  if (p.moving) { const n = hyp(mx, my); p.fx = mx / n; p.fy = my / n; if (Math.abs(mx) > 0.05) p.face = mx > 0 ? 1 : -1; }
  const sp = p.spd * (p.chill > 0 ? 0.7 : 1); p.chill = Math.max(0, p.chill - dt);
  p.vx = mx * sp; p.vy = my * sp;
  p.x += p.vx * dt; p.y += p.vy * dt;
  if (S.arena) { const A = S.arena, k = hyp(p.x - A.x, p.y - A.y); if (k > A.r - p.r) { p.x = A.x + (p.x - A.x) / k * (A.r - p.r); p.y = A.y + (p.y - A.y) / k * (A.r - p.r); } }
  p.hurt = Math.max(0, p.hurt - dt); if (p.atk && (p.atk.t -= dt) <= 0) p.atk = null; p.ifr = Math.max(0, (p.ifr || 0) - dt);
  if (p.regen) p.hp = Math.min(p.maxhp, p.hp + p.regen * dt);
  if (p.guardCd && !p.guard) { p.guardT = (p.guardT == null ? 0 : p.guardT) - dt; if (p.guardT <= 0) p.guard = true; }   // 수호령 재충전
  S.drainB = Math.min((S.W.some(w => w.id === 'foxbead' && w.evo) ? 8 : 5) * (p.healMul || 1), S.drainB + (S.W.some(w => w.id === 'foxbead' && w.evo) ? 8 : 5) * (p.healMul || 1) * dt); if (S.swcd > 0) S.swcd -= dt;
  spawning(S, dt);
  grid(S);
  weapons(S, dt);
  if (p.rangeMul > 1) for (const q of S.pr) if (!q.rm && q.k !== 'wave') { q.rm = 1; q.vx *= p.rangeMul; q.vy *= p.rangeMul; if (q.spd) q.spd *= p.rangeMul; }
  relicTick(S, dt);
  minions(S, dt); curses(S, dt);
  projectiles(S, dt);
  enemies(S, dt);
  if (S.en.length > 60) S.en = S.en.filter(e => !e.dead);
  pickups(S, dt);
  for (const f of S.fx) { f.t -= dt; if (f.k === 'num') f.y -= 30 * dt; }
  S.fx = S.fx.filter(f => f.t > 0);
}

function result(S) {
  const t = Math.floor(Math.min(S.t, 7200)), cleared = !!S.cleared, bossT = Math.round(S.bossT), ot = S.ot && !S.endless ? Math.floor(S.t - S.ot.t0) : 0;
  return { t, kills: S.kills, mid: S.midDone, cleared, bossT, gold: Math.floor(S.gold), lv: S.lv, bosses: S.bosses, evolved: S.evolved.slice(), revived: S.revives > 0, hard: S.hard,
    ot, endless: S.endless, wk: S.wk, jin: S.jin || '', relics: (S.relics || []).slice(), unions: S.unions.slice(), score: S.endless ? D.escore(t, S.kills, S.bosses) : D.score(t, S.kills, S.midDone, cleared, bossT, ot) };
}

/* 연장전 시작 / 귀환 */
function overtime(S) {
  const T = D.OT; S.otAsk = false;
  S.ot = { t0: S.t, start: T.start, step: T.step, lv: T.start, f: T.start, elite: S.t + T.firstElite, boss: S.t + T.firstBoss, bi: 0, bosses: 0 };
  // 시작 신호: 사방에서 포위
  let wv = S.ch.waves[0]; for (const w of S.ch.waves) if (w[0] <= 600) wv = w;
  const last = S.ch.waves.filter(w => w[0] < 600).pop() || wv, n = Math.round(T.ring * S.mod.spawn);
  for (let i = 0; i < n; i++) { const an = i / n * TAU; mkEnemy(S, wpick(S.R, last[2]), S.p.x + Math.cos(an) * 300, S.p.y + Math.sin(an) * 300); }
  S.ev.push({ k: 'ot' }); S.ev.push({ k: 'warn', txt: '포위당했다!' });
}
function retire(S) { S.otAsk = false; S.over = 'clear'; }
const Core = { _spawnBoss: spawnBoss, relicPick, overtime, retire, newRun, step, choices, pick, paused, revive, result, recalc, rng, wst, setInfo, optCount };
G.CORE = Core;
if (typeof module !== 'undefined') module.exports = Core;
})(typeof window !== 'undefined' ? window : globalThis);
