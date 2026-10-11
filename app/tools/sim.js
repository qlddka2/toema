/* 자동 플레이 봇으로 클리어율·생존시간을 측정합니다.  node tools/sim.js [판수] [챕터] [메타레벨] */
const D = require('../js/data.js');
global.DATA = D;
const C = require('../js/core.js');
// 보스 바꿔 끼우기 시험: BMID=그슨대id BFIN=강철이id 이면 해당 챕터의 중간/최종 우두머리를 교체
for (const c of D.CHAPTERS) for (const e of c.events) if (e[1] === 'boss') { if (e[0] < 600 && process.env.BMID) e[2] = process.env.BMID; if (e[0] >= 600 && process.env.BFIN) e[2] = process.env.BFIN; }
const hyp = Math.hypot;

function bot(S) {
  const p = S.p; let vx = 0, vy = 0;
  for (const e of S.en) {
    if (e.dead) continue; const dx = p.x - e.x, dy = p.y - e.y, d = hyp(dx, dy) || 1;
    const R = e.boss ? 200 : e.seg ? 80 : (S.heroId === 'daesung' ? 75 : 110); if (d > R) continue;
    const w = (e.boss ? 3 : e.elite ? 2 : 1) * Math.pow((R - d) / R, 2) * 3;
    vx += dx / d * w; vy += dy / d * w;
  }
  for (const q of S.ep) { const dx = p.x - q.x, dy = p.y - q.y, d = hyp(dx, dy) || 1; if (d < 90) { const sp = hyp(q.vx, q.vy) || 1, nx = -q.vy / sp, ny = q.vx / sp, side = Math.sign(dx * nx + dy * ny) || 1; vx += nx * side * 4 * (90 - d) / 90; vy += ny * side * 4 * (90 - d) / 90; } }
  for (const t of S.tele) {
    if (t.k === 'circle') { const dx = p.x - t.x, dy = p.y - t.y, d = hyp(dx, dy) || 1; if (d < t.r + 30) { vx += dx / d * 6; vy += dy / d * 6; } }
    else { const nx = -Math.sin(t.a), ny = Math.cos(t.a), side = (p.x - t.x) * nx + (p.y - t.y) * ny; if (Math.abs(side) < t.w + 40) { const s = Math.sign(side) || 1; vx += nx * s * 6; vy += ny * s * 6; } }
  }
  // 목표물: 회복(체력 낮을 때) > 상자 > 가까운 구슬
  let tgt = null, td = 1e9;
  for (const o of S.drops) { const d = hyp(o.x - p.x, o.y - p.y); const pri = o.k === 'heal' ? (p.hp < p.maxhp * 0.6 ? 0.3 : 3) : o.k === 'chest' ? 0.5 : 1; if (d * pri < td) { td = d * pri; tgt = o; } }
  for (const g of S.gems) { const d = hyp(g.x - p.x, g.y - p.y); if (d < td) { td = d; tgt = g; } }
  if (tgt && td < 260) { const dx = tgt.x - p.x, dy = tgt.y - p.y, d = hyp(dx, dy) || 1; vx += dx / d * 0.9; vy += dy / d * 0.9; }
  else { const a = S.t * 0.25; vx += Math.cos(a) * 0.6; vy += Math.sin(a) * 0.6; }
  // 백귀야행: 포탈로 가기 (STAY초 머문 뒤)
  if (S.portal && wantPortal(S)) { const q = S.portal, dx = q.x - p.x, dy = q.y - p.y, d = hyp(dx, dy) || 1; vx += dx / d * 2.2; vy += dy / d * 2.2; }
  if (S.arena) { const A = S.arena, dx = A.x - p.x, dy = A.y - p.y, d = hyp(dx, dy); if (d > A.r * 0.55) { vx += dx / d * 2.5 * (d / A.r); vy += dy / d * 2.5 * (d / A.r); } }
  const n = hyp(vx, vy); return n > 0.01 ? { x: vx / n, y: vy / n } : { x: 0, y: 0 };
}
const PRI = { w: { talisman: 9, staff: 9, thunder: 8, beads: 7, aura: 6, fan: 5, bell: 7, knives: 8, soulfire: 8, quake: 7, bow: 7, gourd: 7, twin: 7,
  hwando: 7, club: 7, foxbead: 7, sinjang: 6, jeung: 6, chain: 8, frost: 7, hwacha: 7, bomb: 6, feather: 7, water: 6, shield: 6 },
  p: { might: 6, haste: 5, vigor: 5, regen: 3, swift: 3, magnet: 2, armor: 4, luck: 4, farsight: 3, blood: 4, clone: 5, focus: 3, dur: 3, guard: 4, essence: 3, fortune: 2 } };
if (process.env.ONLYNEW === '1') for (const k of ['talisman','staff','thunder','beads','aura','fan','bell','knives','soulfire','quake','bow','gourd','twin']) PRI.w[k] = 1;
function choose(S) { const cs = C.choices(S, C.optCount(S)); if (cs[0].kind === 'evo' || cs[0].kind === 'jin' || cs[0].kind === 'union') return C.pick(S, cs[0]); const sv = o => o.kind === 'w' ? PRI.w[o.id] + 1 + (SETS && o.set && o.lv === 1 && o.set.have >= 2 ? 3 : 0) : PRI.p[o.id] || 0; cs.sort((a, b) => sv(b) - sv(a)); C.pick(S, cs[0]); }

const STAY = +(process.env.STAY || 0), HOMEF = +(process.env.HOMEF || 0), GEAR = (process.env.GEAR || '').split(',').filter(Boolean).map(x => { const [id, g] = x.split(':'); return { id, g: +g }; });
function wantPortal(S) { const ft = S.t - S.fT0; if (S.portal.kind === 'home') return HOMEF > 0 && S.floor >= HOMEF; if (HOMEF && S.floor >= HOMEF) return ft >= D.PORTAL.at + STAY; return ft >= D.PORTAL.at + STAY; }
function run(hero, ch, meta, seed, revive) {
  const S = C.newRun({ hero, chapter: ch, meta, seed, viewR: 420, hard: HARD, hlv: +(process.env.HLV || 1), weekly: process.env.WK, gear: GEAR });
  const dt = 1 / 30; let it = 0, cur = { x: 0, y: 0 }; const rnd = C.rng(seed * 7 + 1);
  while (it++ < 30 * 60 * 60) {
    if (S.relicAsk) C.relicPick(S, S.relicOpts[0]);
    if (S.otAsk) { if (OT) C.overtime(S); else C.retire(S); }
    if (S.portalAsk) { if (!wantPortal(S)) C.portalChoose(S, null); else C.portalChoose(S, S.portalAsk === 'home' || (HOMEF && S.floor >= HOMEF) ? 'home' : 'down'); }
    while (S.pendingLv > 0 || S.chests > 0) choose(S);
    if (S.over === 'dead' && revive && !S.revived) C.revive(S);
    if (S.over) break;
    if (!HUMAN || it % HUMAN.every === 0) { cur = bot(S); if (HUMAN) { const a = Math.atan2(cur.y, cur.x) + (rnd() - 0.5) * HUMAN.err; const m = Math.hypot(cur.x, cur.y); cur = { x: Math.cos(a) * m, y: Math.sin(a) * m }; } }
    const hp0 = S.p.hp, dl0 = Object.assign({}, S.dlog), hadB = S.boss;
    C.step(S, dt, cur);
    if (process.env.BLOG) {
      if (S.boss && S.boss !== hadB) S.bl = { id: S.boss.type, t: S.t, hp: Math.round(hp0 / S.p.maxhp * 100), d0: Math.round(Math.hypot(S.boss.x - S.p.x, S.boss.y - S.p.y)), lost: 0, src: {}, minD: 1e9 };
      if (S.bl && S.t - S.bl.t < 3 && S.boss) { const L = S.bl; L.minD = Math.min(L.minD, Math.round(Math.hypot(S.boss.x - S.p.x, S.boss.y - S.p.y) - S.boss.r - S.p.r)); for (const k in S.dlog) { const v = S.dlog[k] - (dl0[k] || 0); if (v > 0) { L.src[k] = (L.src[k] || 0) + v; L.lost += v; } } }
      if (S.bl && S.t - S.bl.t >= 3) { const L = S.bl; console.log(`  [${Math.round(L.t)}s] ${L.id} 등장 hp${L.hp}% 거리${L.d0} 최소간격${L.minD} 3초간 피해 ${Math.round(L.lost / S.p.maxhp * 100)}% ${JSON.stringify(Object.fromEntries(Object.entries(L.src).map(([k, v]) => [k, Math.round(v)])))}${S.over ? ' 사망' : ''}`); S.bl = null; }
      if (S.over === 'dead' && S.bl) { const L = S.bl; console.log(`  [${Math.round(L.t)}s] ${L.id} 등장 hp${L.hp}% 거리${L.d0} 최소간격${L.minD} → ${Math.round(S.t - L.t)}초 만에 사망 ${JSON.stringify(Object.fromEntries(Object.entries(L.src).map(([k, v]) => [k, Math.round(v)])))}`); S.bl = null; }
    }
  }
  return { ...C.result(S), over: S.over, fl: S.floor, lootN: (S.loot || []).length, lootG: (S.loot || []).map(x => x.g), hp: S.p.hp, w: S.W.map(w => w.id + (w.jin ? '眞' : w.evo ? '★' : w.lv)).join(',') + (S.relics ? ' [' + S.relics.join(',') + ']' : ''), dlog: S.dlog, bossHp: S.boss ? Math.round(S.boss.hp / S.boss.max * 100) : null, ot: S.ot ? Math.round(S.t - S.ot.t0) : 0, score: C.result(S).score };
}

const HUMAN = process.env.HUMAN ? { every: +process.env.HUMAN, err: +(process.env.ERR || 1.2) } : null;
const N = +process.argv[2] || 10, CH = +process.argv[3] || 1, ML = +process.argv[4] || 0, REV = process.argv[5] === 'rev';
const HARD = process.env.HARD === '1';
const OT = process.env.OT === '1';   // 클리어 후 연장전까지 계속
const SETS = process.env.SETS !== '0';   // 봇이 세트를 맞추려 하는지
const meta = {}; for (const k in D.META) if (k !== 'roll' && k !== 'rev') meta[k] = Math.min(ML, D.META[k].max);
if (process.env.BUDGET) { for (const k in meta) delete meta[k]; Object.assign(meta, D.metaPlan(+process.env.BUDGET)); }   // 금화 예산만큼 고루 강화
const HEROES = process.env.HEROES ? process.env.HEROES.split(',') : Object.keys(D.HEROES);
for (const hero of HEROES) {
  const rs = []; const t0 = Date.now();
  for (let i = 0; i < N; i++) rs.push(run(hero, CH, meta, 1000 + i, REV));
  const clr = rs.filter(r => r.cleared).length, avgT = rs.reduce((a, r) => a + r.t, 0) / N;
  const mid = rs.filter(r => r.mid).length;
  console.log(`${hero} ch${CH}${HARD?'H':''} meta${ML}${REV ? ' +부활' : ''}: 클리어 ${clr}/${N}, 중보 처치 ${mid}/${N}, 보스 ${Math.round(rs.reduce((a, r) => a + r.bosses, 0) / N * 10) / 10}, 평균 생존 ${Math.round(avgT)}s, 평균 레벨 ${Math.round(rs.reduce((a, r) => a + r.lv, 0) / N)}, 평균 금화 ${Math.round(rs.reduce((a, r) => a + r.gold, 0) / N)}, 킬 ${Math.round(rs.reduce((a, r) => a + r.kills, 0) / N)}${OT || CH === 6 ? `, 연장전 평균 ${Math.round(rs.reduce((a, r) => a + r.ot, 0) / N)}s (최소 ${Math.min(...rs.map(r => r.ot))}·최대 ${Math.max(...rs.map(r => r.ot))}), 점수 ${Math.round(rs.reduce((a, r) => a + r.score, 0) / N)}` : ''} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  if (CH === 6) { const ts = rs.map(r => r.t / 60).sort((a, b) => a - b), q = f => ts[Math.min(ts.length - 1, Math.floor(f * ts.length))].toFixed(1);
    const b = [0, 20, 25, 30, 35, 40, 99], hist = b.slice(0, -1).map((x, i) => `${x}~${b[i + 1]}분:${ts.filter(t => t >= x && t < b[i + 1]).length}`).join(' ');
    const fl = [1, 2, 3, 4].map(n => rs.filter(r => r.fl === n).length).join('/'), esc = rs.filter(r => r.escaped).length;
    const lg = [0, 0, 0, 0]; for (const r of rs) for (const g of r.lootG) lg[g]++;
    console.log(`    층 분포 1/2/3/4: ${fl} · 귀환 ${esc} · 생존 중앙 ${q(0.5)}분 (10% ${q(0.1)} · 90% ${q(0.9)}) · ${hist} · 판당 장비 ${(rs.reduce((a, r) => a + r.lootN, 0) / N).toFixed(1)}개 등급별 ${lg.join('/')}`); }
  const dl={};for(const r of rs)for(const k in r.dlog)dl[k]=(dl[k]||0)+r.dlog[k];console.log('    피해원:',JSON.stringify(Object.fromEntries(Object.entries(dl).map(([k,v])=>[k,Math.round(v/N)]))));
  console.log('   ', rs.slice(0, 6).map(r => `${r.t}s${r.cleared ? '✔' : ''}${r.bossHp != null ? '(보스' + r.bossHp + '%)' : ''} ${r.w}`).join(' | '));
}
