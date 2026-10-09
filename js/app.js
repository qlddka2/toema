/* 퇴마 서바이버(가제) — 화면·조작·흐름·보상 */
(function () {
'use strict';
const D = window.DATA, C = window.CORE, A = window.ART, RK = window.RANK;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const TAU = Math.PI * 2, hyp = Math.hypot;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = t => { t = Math.floor(t); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };

/* ───── 저장 ───── */
const SKEY = 'toema_save_v2';
function blank() {
  return { gold: 0, meta: {}, clear: {}, hclear: {}, best: {}, hero: 'daesung', ch: 1, hard: false, snd: true, vib: true, nums: true, adfree: false,
    stats: { kills: 0, bosses: 0, maxLv: 0, noRevClear: 0, goldTotal: 0, runs: 0 }, heroClear: {}, evo: {}, ach: {}, daily: null, attend: { last: '', day: 0 }, tut: false, firstClear: {}, hlv: {} };
}
let SV = blank();
try {
  const s = JSON.parse(localStorage.getItem(SKEY));
  if (s) SV = Object.assign(blank(), s, { stats: Object.assign(blank().stats, s.stats || {}) });
  else { const o = JSON.parse(localStorage.getItem('toema_save_v1') || 'null'); if (o) { SV.gold = o.gold || 0; SV.meta = o.meta || {}; SV.clear = o.clear || {}; for (const k in (o.best || {})) SV.best[k] = o.best[k]; SV.snd = o.snd !== false; } }
} catch (e) {}
const persist = () => { try { localStorage.setItem(SKEY, JSON.stringify(SV)); } catch (e) {} };
const save = () => { persist(); if (typeof scheduleSync === 'function') scheduleSync(); };

/* ───── 소리 (js/audio.js) ───── */
const SND = window.AUDIO;
SND.setOpts({ sfx: SV.snd, bgm: SV.bgm !== false });
SND.loadFiles('snd/');
const vib = ms => { if (SV.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} };

/* ───── 해금·업적·임무 ───── */
function heroUnlocked(id) {
  const u = D.HEROES[id].unlock; if (!u) return true;
  if (u.k === 'clear') return !!SV.clear[u.ch];
  if (u.k === 'kills') return SV.stats.kills >= u.n;
  if (u.k === 'bosses') return SV.stats.bosses >= u.n;
  return false;
}
function heroUnlockProgress(id) {
  const u = D.HEROES[id].unlock; if (!u) return '';
  if (u.k === 'kills') return ` (${Math.min(SV.stats.kills, u.n).toLocaleString()}/${u.n.toLocaleString()})`;
  if (u.k === 'bosses') return ` (${Math.min(SV.stats.bosses, u.n)}/${u.n})`;
  return '';
}
const achReady = () => D.ACH.filter(a => !SV.ach[a.id] && a.test(SV));
function dailyToday() {
  const d = today();
  if (!SV.daily || SV.daily.date !== d) {
    const R = C.rng([...d].reduce((a, c) => a * 31 + c.charCodeAt(0) | 0, 7)), pool = D.DAILY.slice(), ids = [];
    while (ids.length < 3) { const i = (R() * pool.length) | 0; const m = pool.splice(i, 1)[0]; const lv = (R() * m.n.length) | 0; ids.push({ id: m.id, n: m.n[lv], gold: m.gold[lv] }); }
    SV.daily = { date: d, ids, prog: {}, done: {}, bonus: false }; save();
  }
  return SV.daily;
}
function dailyApply(r, heroId) {
  const dl = dailyToday();
  for (const m of dl.ids) {
    let v = dl.prog[m.id] || 0;
    if (m.id === 'kill') v += r.kills; else if (m.id === 'surv') v = Math.max(v, r.t); else if (m.id === 'boss') v += r.bosses;
    else if (m.id === 'clear') v += r.cleared ? 1 : 0; else if (m.id === 'gold') v += r.gold; else if (m.id === 'lvl') v = Math.max(v, r.lv);
    else if (m.id === 'runs') v += 1; else if (m.id === 'evo') v += r.evolved.length;
    dl.prog[m.id] = v;
  }
}
const dailyClaimable = () => { const dl = dailyToday(); return dl.ids.filter(m => !dl.done[m.id] && (dl.prog[m.id] || 0) >= m.n).length + (!dl.bonus && dl.ids.every(m => dl.done[m.id]) ? 1 : 0); };
const attendReady = () => SV.attend.last !== today();
function badges() {
  const a = achReady().length, m = dailyClaimable() + (attendReady() ? 1 : 0);
  $('#bdg-ach').textContent = a || ''; $('#bdg-ach').classList.toggle('hide', !a);
  $('#bdg-mis').textContent = m || ''; $('#bdg-mis').classList.toggle('hide', !m);
}

/* ───── 화면 전환 ───── */
const SCR = ['menu', 'select', 'shop', 'rank', 'settings', 'mission', 'ach', 'codex'];
function go(name) {
  SND.play('click'); SND.music('menu');
  for (const s of SCR) $('#s-' + s).classList.toggle('hide', s !== name);
  $$('.goldv').forEach(e => e.textContent = Math.floor(SV.gold).toLocaleString());
  ({ select: renderSelect, shop: renderShop, rank: renderRank, settings: renderSettings, mission: renderMission, ach: renderAch, codex: renderCodex, menu: renderMenu }[name] || (() => {}))();
}
$$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

function renderMenu() {
  const c = $('#menuart'), dpr = Math.min(2, window.devicePixelRatio || 1); c.width = 320 * dpr; c.height = 140 * dpr;
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, 320, 140);
  const put = (cv, cx, cy, s) => x.drawImage(cv, cx - s / 2, cy - s / 2, s, s);
  put(A.bossPortrait('fox', 140), 160, 62, 140);
  put(A.portrait('daesung', 92), 66, 88, 92); put(A.portrait('uchi', 92), 254, 88, 92);
  badges(); loginHint(); if (RK.state().user) pullCloud();
  if (attendReady()) setTimeout(() => { if (!$('#s-menu').classList.contains('hide')) openAttend(); }, 400);
}

/* ───── 출석 ───── */
function openAttend() {
  const day = SV.attend.day % 7;
  $('#attgrid').innerHTML = D.ATTEND.map((g, i) => `<div class="att ${i < day ? 'got' : i === day ? 'now' : ''}"><small>${i + 1}일</small><b><span class="coins"><i></i>${g}</span></b>${i < day ? '<em>✔</em>' : ''}</div>`).join('');
  $('#m-att').classList.remove('hide');
}
$('#attclaim').onclick = () => {
  if (!attendReady()) { $('#m-att').classList.add('hide'); return; }
  const g = D.ATTEND[SV.attend.day % 7]; SV.gold += g; SV.attend.day++; SV.attend.last = today(); save();
  SND.play('chest'); toast(`출석 보상 금화 +${g}`); $('#m-att').classList.add('hide'); go('menu');
};
$('#attclose').onclick = () => $('#m-att').classList.add('hide');

/* ───── 출전 준비 ───── */
function renderSelect() {
  const H = $('#heroes'); H.innerHTML = '';
  if (!heroUnlocked(SV.hero)) SV.hero = 'daesung';
  for (const id in D.HEROES) {
    const h = D.HEROES[id], ok = heroUnlocked(id), d = document.createElement('button'); d.className = 'hero' + (SV.hero === id ? ' on' : '') + (ok ? '' : ' lock');
    d.innerHTML = `<div class="cls">${h.cls}${ok ? ` · Lv ${(SV.hlv || {})[id] || 1}` : ''}</div><b>${h.name}</b><div class="trait">${ok ? h.trait : '🔒 ' + h.unlock.txt + heroUnlockProgress(id)}</div>`;
    const cv = A.portrait(id, 72); cv.className = 'pt'; d.insertBefore(cv, d.children[1]);
    d.onclick = () => { if (!ok) { toast('해금 조건: ' + h.unlock.txt); return; } SV.hero = id; save(); SND.play('click'); renderSelect(); };
    H.appendChild(d);
  }
  const h = D.HEROES[SV.hero];
  $('#herodesc').innerHTML = `<b>${h.name}</b> · ${h.title}<br>${h.desc}<br><span class="small">체력 ${h.hp} · 방어 ${h.armor} · 속도 ${h.speed} · 시작 무기 ${D.WEAPONS[h.weapon].name}</span>` + heroGrowHTML(SV.hero);
  const gb = $('#hgrowbtn'); if (gb) gb.onclick = () => heroLevelUp(SV.hero);
  $$('#difftabs button').forEach(b => { const hd = b.dataset.d === 'h'; b.classList.toggle('on', SV.hard === hd); const hardOk = Object.keys(SV.clear).length > 0; if (hd) b.classList.toggle('lockd', !hardOk); b.textContent = hd ? (hardOk ? '어려움' : '🔒 어려움') : '보통'; b.onclick = () => { if (hd && !hardOk) { toast('보통 난이도에서 챕터를 클리어하면 열려요 (10분 최종 보스 처치)'); return; } SV.hard = hd; save(); renderSelect(); }; });
  const CH = $('#chs'); CH.innerHTML = '';
  for (const ch of D.CHAPTERS) {
    const locked = SV.hard ? !SV.clear[ch.id] : (ch.id > 1 && !SV.clear[ch.id - 1]);
    const key = ch.id + (SV.hard ? 10 : 0), b = SV.best[key], cl = SV.hard ? SV.hclear[ch.id] : SV.clear[ch.id];
    const d = document.createElement('button'); d.className = 'ch' + (SV.ch === ch.id ? ' on' : '') + (SV.hard ? ' hard' : ''); if (locked) d.disabled = true;
    const lockTxt = SV.hard ? `보통 ${ch.id}장을 클리어하면 열려요` : `${ch.id - 1}장을 클리어하면 열려요`;
    d.innerHTML = `<div class="n">${ch.id}</div><div><b>${ch.name}</b><small>${locked ? '🔒 ' + lockTxt : ch.sub}</small>${!locked && !cl ? `<small class="cond">클리어: 10분 생존 후 최종 우두머리 처치</small>` : ''}</div><div class="best">${cl ? '클리어 ✔<br>' : (!locked && !SV.firstClear[key] ? `첫 클리어<br>+${Math.round(ch.firstGold * (SV.hard ? D.HARD.firstGold : 1))}` : '')}${b ? '<br>최고 ' + b.score.toLocaleString() : ''}</div>`;
    d.onclick = () => { if (locked) return; SV.ch = ch.id; save(); SND.play('click'); renderSelect(); };
    CH.appendChild(d);
  }
  if (!SV.hard) {   // 무한 모드
    const ok = !!SV.clear[5], wk = D.weekly(), eb = SV.best[1000 + D.weekNo()], d = document.createElement('button');
    d.className = 'ch endless' + (SV.ch === 6 ? ' on' : ''); if (!ok) d.disabled = true;
    d.innerHTML = `<div class="n">∞</div><div><b>백귀야행</b><small>${ok ? `이번 주 조건: <b>${wk.name}</b> · ${wk.desc}` : '🔒 보통 5장을 클리어하면 열려요'}</small>${ok ? '<small class="cond">끝없는 요괴 행렬 · 주간 랭킹</small>' : ''}</div><div class="best">${eb ? '이번 주 최고<br>' + eb.score.toLocaleString() : ''}</div>`;
    d.onclick = () => { if (!ok) return; SV.ch = 6; save(); SND.play('click'); renderSelect(); };
    CH.appendChild(d);
  }
  const chOk = c => c === 6 ? !SV.hard && !!SV.clear[5] : SV.hard ? !!SV.clear[c] : (c === 1 || !!SV.clear[c - 1]);
  if (!chOk(SV.ch)) { SV.ch = 1; if (!chOk(1)) { SV.hard = false; } renderSelect(); }
}
$('#gobtn').onclick = () => startRun();
/* 주인공 성장: 금화로 레벨업 (레벨마다 피해·체력 증가, 5·10레벨 특성) */
function heroGrowHTML(id) {
  if (!heroUnlocked(id)) return '';
  const L = (SV.hlv || {})[id] || 1, HL = D.HERO_LV, max = L >= HL.max, cost = max ? 0 : HL.cost[L - 1];
  const tal = (D.TALENT[id] || []).map(t => `<div class="tal ${L >= t.lv ? 'on' : ''}"><i>Lv${t.lv}</i><b>${t.name}</b> ${t.desc}</div>`).join('');
  return `<div class="hgrow"><div class="hgtop"><b>성장 Lv ${L}/${HL.max}</b><span class="small">피해 +${Math.round((L - 1) * HL.might * 100)}% · 체력 +${Math.round((L - 1) * HL.hp * 100)}%</span>
    <button class="btn ${max ? '' : 'gold'}" id="hgrowbtn" ${max || SV.gold < cost ? 'disabled' : ''}>${max ? '최대' : `레벨업 <span class="coins" style="color:inherit"><i></i>${cost.toLocaleString()}</span>`}</button></div>${tal}</div>`;
}
function heroLevelUp(id) {
  const L = (SV.hlv || {})[id] || 1, HL = D.HERO_LV; if (L >= HL.max) return; const cost = HL.cost[L - 1]; if (SV.gold < cost) return;
  SV.gold -= cost; SV.hlv = SV.hlv || {}; SV.hlv[id] = L + 1; save(); SND.play('chest');
  const t = (D.TALENT[id] || []).find(x => x.lv === L + 1); toast(t ? `특성 해금: ${t.name}!` : `${D.HEROES[id].name} Lv ${L + 1}`);
  $$('.goldv').forEach(e => e.textContent = Math.floor(SV.gold).toLocaleString()); renderSelect();
}

/* ───── 강화 ───── */
function renderShop() {
  const box = $('#shop'); box.innerHTML = '';
  for (const id in D.META) {
    const m = D.META[id], lv = SV.meta[id] || 0, max = lv >= m.max, cost = max ? 0 : m.cost[lv];
    const d = document.createElement('div'); d.className = 'up';
    d.innerHTML = `<div class="nm"><b>${m.name}</b><small>${m.desc} · ${lv}/${m.max}</small><div class="pips">${Array.from({ length: m.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>`;
    const b = document.createElement('button'); b.className = 'btn ' + (max ? '' : 'gold'); b.disabled = max || SV.gold < cost;
    b.innerHTML = max ? '최대' : `<span class="coins" style="color:inherit"><i></i>${cost.toLocaleString()}</span>`;
    b.onclick = () => { if (SV.gold < cost || max) return; SV.gold -= cost; SV.meta[id] = lv + 1; save(); SND.play('chest'); renderShop(); $$('.goldv').forEach(e => e.textContent = Math.floor(SV.gold).toLocaleString()); };
    d.appendChild(b); box.appendChild(d);
  }
}

/* ───── 임무·출석 ───── */
function renderMission() {
  const dl = dailyToday(), box = $('#mlist');
  box.innerHTML = dl.ids.map(m => {
    const def = D.DAILY.find(x => x.id === m.id), v = Math.min(dl.prog[m.id] || 0, m.n), done = dl.done[m.id], ok = v >= m.n;
    return `<div class="up"><div class="nm"><b>${def.txt(m.n)}</b><small>${m.id === 'surv' ? fmt(v) + ' / ' + fmt(m.n) : v.toLocaleString() + ' / ' + m.n.toLocaleString()}</small><div class="bar"><i style="width:${v / m.n * 100}%"></i></div></div>
      <button class="btn ${done ? '' : ok ? 'gold' : ''}" data-m="${m.id}" ${done || !ok ? 'disabled' : ''}>${done ? '완료' : `<span class="coins" style="color:inherit"><i></i>${m.gold}</span>`}</button></div>`;
  }).join('') + `<div class="up"><div class="nm"><b>오늘의 임무 모두 완료</b><small>보너스</small></div><button class="btn ${dl.bonus ? '' : 'gold'}" id="mbonus" ${dl.bonus || !dl.ids.every(m => dl.done[m.id]) ? 'disabled' : ''}>${dl.bonus ? '완료' : `<span class="coins" style="color:inherit"><i></i>${D.DAILY_BONUS}</span>`}</button></div>`;
  $$('#mlist [data-m]').forEach(b => b.onclick = () => { const m = dl.ids.find(x => x.id === b.dataset.m); dl.done[m.id] = true; SV.gold += m.gold; save(); SND.play('coin'); renderMission(); badges(); $$('.goldv').forEach(e => e.textContent = Math.floor(SV.gold).toLocaleString()); });
  const mb = $('#mbonus'); if (mb) mb.onclick = () => { dl.bonus = true; SV.gold += D.DAILY_BONUS; save(); SND.play('chest'); renderMission(); badges(); $$('.goldv').forEach(e => e.textContent = Math.floor(SV.gold).toLocaleString()); };
  const day = SV.attend.day % 7;
  $('#attrow').innerHTML = D.ATTEND.map((g, i) => `<div class="att ${i < day ? 'got' : i === day && attendReady() ? 'now' : ''}"><small>${i + 1}일</small><b>${g}</b></div>`).join('');
  $('#attbtn').disabled = !attendReady(); $('#attbtn').textContent = attendReady() ? '오늘 출석 보상 받기' : '내일 다시 와요';
}
$('#attbtn').onclick = () => { if (!attendReady()) return; const g = D.ATTEND[SV.attend.day % 7]; SV.gold += g; SV.attend.day++; SV.attend.last = today(); save(); SND.play('chest'); toast(`출석 보상 금화 +${g}`); renderMission(); badges(); $$('.goldv').forEach(e => e.textContent = Math.floor(SV.gold).toLocaleString()); };

/* ───── 업적 ───── */
function renderAch() {
  const box = $('#alist'), ready = new Set(achReady().map(a => a.id));
  const done = D.ACH.filter(a => SV.ach[a.id]).length;
  $('#achcount').textContent = `${done} / ${D.ACH.length}`;
  const order = [...D.ACH].sort((a, b) => (ready.has(b.id) - ready.has(a.id)) || (!!SV.ach[a.id] - !!SV.ach[b.id]));
  box.innerHTML = order.map(a => `<div class="up ${SV.ach[a.id] ? 'dim' : ''}"><div class="nm"><b>${a.name}</b><small>${a.desc}</small></div>
    <button class="btn ${ready.has(a.id) ? 'gold' : ''}" data-a="${a.id}" ${ready.has(a.id) ? '' : 'disabled'}>${SV.ach[a.id] ? '받음' : `<span class="coins" style="color:inherit"><i></i>${a.gold.toLocaleString()}</span>`}</button></div>`).join('');
  $$('#alist [data-a]').forEach(b => b.onclick = () => { const a = D.ACH.find(x => x.id === b.dataset.a); SV.ach[a.id] = true; SV.gold += a.gold; save(); SND.play('chest'); renderAch(); badges(); $$('.goldv').forEach(e => e.textContent = Math.floor(SV.gold).toLocaleString()); });
}

/* 세트 효과 표 (일시정지·도감) */
function setsHTML(sc) {
  return `<div class="sets"><h4>세트 효과</h4>` + Object.entries(D.SETS).map(([k, st]) => {
    const n = sc[k] || 0;
    return `<div class="setrow"><span class="setc" style="--c:${st.color}">${st.name} ${n}/${st.b[st.b.length - 1].n}</span><small>${st.ws.map(w => D.WEAPONS[w].name).join('·')}</small>`
      + st.b.map(b => `<em class="${n >= b.n ? 'on' : ''}" style="--c:${st.color}">${b.n}개: ${b.desc}</em>`).join('') + `</div>`;
  }).join('') + `</div>`;
}
/* ───── 비급(진화 도감) ───── */
function renderCodex() {
  $('#clist').innerHTML = Object.entries(D.WEAPONS).map(([id, w]) => {
    const got = SV.evo[id];
    return `<div class="up"><img src="${A.iconURL(w.icon, 44, got)}" style="width:44px;height:44px"><div class="nm"><b>${w.name} → ${got ? w.evo.name : '???'}</b><small>${w.name} 5레벨 + ${D.PASSIVES[w.evo.with].name} 보유 → 보물 상자</small>${got ? `<small style="color:var(--gold)">${w.evo.desc}</small>` : ''}</div></div>`;
  }).join('');
  $('#clist').insertAdjacentHTML('afterbegin', setsHTML({}));
  $('#clist').insertAdjacentHTML('beforeend', `<div class="sets"><h4>진(眞) 각성 · 주인공 전용</h4>` + Object.entries(D.HEROES).map(([h, H]) => { const W = D.WEAPONS[H.weapon], got = (SV.jin || {})[h]; return `<div class="setrow"><span class="setc" style="--c:#ff6a3d">${H.name}</span><small>${W.name} → ${SV.evo[H.weapon] ? W.evo.name : '???'} → ${got ? '진·' + W.evo.name + ' ✔' : '???'}</small></div>`; }).join('') + `<div class="small" style="margin:4px 2px 10px">${D.JIN.desc}. 시작 무기를 진화시킨 뒤 ${D.JIN.minLv}레벨 이상에서 보물 상자를 열면 나와요.</div>`
    + `<h4>유물 · 우두머리 처치 보상 (한 판 최대 ${D.MAX_RELIC}개)</h4>` + Object.values(D.RELICS).map(R => `<div class="bi" style="margin-bottom:5px"><img src="${A.iconURL(R.icon, 32)}"><span>${R.name}</span><em>${R.desc}</em></div>`).join('') + `</div>`);
  $('#codexcount').textContent = `${Object.keys(SV.evo).length} / ${Object.keys(D.WEAPONS).length}`;
}

const LOC = () => ({ ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN' })[window.I18N ? I18N.lang : 'ko'];
const fieldMusic = () => S && S.endless ? 'night' : S && S.ot ? 'boss' : (S.ch.id % 2 ? 'battle' : 'battle2');   // 전투 중 기본 배경음
/* ───── 클라우드 저장 ─────
   로그인하면 진행 데이터(금화·강화·해금·기록 등)를 계정에 올리고, 다른 기기에서 내려받음.
   기기별 설정(소리·진동 등)은 올리지 않음. 서로 다르면 진행도를 보여주고 고르게 함 */
// 기기마다 따로 두는 값(설정·마지막 선택 화면 등)은 올리지 않음 → 이런 값만 바뀐 걸 '진행이 바뀌었다'로 착각하지 않게
const LOCAL_ONLY = ['snd', 'bgm', 'vib', 'nums', 'tut', 'syncAt', 'dirty', 'cloudUser', 'hintOff', 'syncHash', 'hero', 'ch', 'hard'];
const hashStr = t => { let h = 5381; for (let i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0; return String(h); };
const dataHash = () => { const d = syncData(); delete d.daily; return hashStr(JSON.stringify(d)); };   // 일일 임무 목록 갱신은 진행 변화로 안 봄
// 마지막 동기화 이후 진행이 바뀌었나
const isDirty = () => SV.cloudUser ? dataHash() !== SV.syncHash : !isFresh();
const syncData = () => { const d = {}; for (const k in SV) if (!LOCAL_ONLY.includes(k)) d[k] = SV[k]; return d; };
const progressOf = d => Math.floor(((d && d.stats) || {}).goldTotal || 0);
const isFresh = () => !SV.stats.runs && !SV.gold && !Object.keys(SV.meta || {}).length;
let syncTimer = 0, syncBusy = false, cloudUid = null, pendingPull = false, syncMsg = '';
function scheduleSync() { if (!RK.state().user || SV.cloudUser !== RK.state().user.id || !isDirty()) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => pushCloud(), 2500); }
async function pushCloud(force) {
  const u = RK.state().user; if (!u || syncBusy) return;
  syncBusy = true; const r = await RK.cloudPut(syncData(), progressOf(SV), SV.syncAt || null, force); syncBusy = false;
  if (!r) { syncMsg = '저장 실패 (네트워크 확인)'; refreshSync(); return; }
  if (r.conflict) { askSync(r); return; }
  SV.syncAt = r.updated_at; SV.cloudUser = u.id; SV.syncHash = dataHash(); persist(); syncMsg = '저장됨 ' + new Date().toLocaleTimeString(LOC(), { hour: '2-digit', minute: '2-digit' }); refreshSync();
}
let lastPull = 0;
async function pullCloud(force) {
  const u = RK.state().user; if (!u) return;
  if (running) { pendingPull = true; return; }   // 판 도중에는 끝난 뒤에
  if (!force && Date.now() - lastPull < 4000) return; lastPull = Date.now();
  if (!$('#m-sync').classList.contains('hide')) return;
  const c = await RK.cloudGet();
  if (c === undefined) { syncMsg = '불러오기 실패'; refreshSync(); return; }
  if (!c) { SV.cloudUser = u.id; return pushCloud(true); }                 // 서버에 아직 없음 → 이 기기 데이터를 올림
  const mine = SV.cloudUser === u.id;
  if (mine && c.updated_at === SV.syncAt) { if (isDirty()) pushCloud(); else { syncMsg = '최신 상태'; refreshSync(); } return; }
  if (isFresh() || (mine && !isDirty())) return adoptCloud(c, true);          // 이 기기가 새것이거나 바뀐 게 없으면 그냥 받음
  askSync(c);
}
function adoptCloud(c, quiet) {
  const keep = {}; for (const k of ['snd', 'bgm', 'vib', 'nums', 'tut', 'hero', 'ch', 'hard', 'hintOff']) keep[k] = SV[k];
  SV = Object.assign(blank(), c.data, keep, { stats: Object.assign(blank().stats, (c.data || {}).stats || {}) });
  SV.syncAt = c.updated_at; SV.cloudUser = RK.state().user.id; SV.syncHash = dataHash(); persist();
  syncMsg = '서버 데이터를 불러왔어요'; if (!quiet || !isFresh()) toast('클라우드 저장 데이터를 불러왔어요');
  if (!running) { const cur = SCR.find(n => !$('#s-' + n).classList.contains('hide')) || 'menu'; go(cur); }
}
const sumTxt = d => { d = d || {}; const st = d.stats || {}; return `금화 ${Math.floor(d.gold || 0).toLocaleString()} · 클리어 ${Object.keys(d.clear || {}).length + Object.keys(d.hclear || {}).length}개 · ${(st.runs || 0).toLocaleString()}판 · 누적 금화 ${Math.floor(st.goldTotal || 0).toLocaleString()}`; };
function askSync(c) {
  if (running) { pendingPull = true; return; }
  $('#synclocal').textContent = sumTxt(SV); $('#syncserver').textContent = sumTxt(c.data) + ' · ' + new Date(c.updated_at).toLocaleString(LOC());
  const rec = progressOf(c.data) >= progressOf(SV) ? 'server' : 'local';
  $('#syncuse-s').className = 'btn ' + (rec === 'server' ? 'gold' : ''); $('#syncuse-l').className = 'btn ' + (rec === 'local' ? 'gold' : '');
  $('#syncuse-s').onclick = () => { $('#m-sync').classList.add('hide'); adoptCloud(c); };
  $('#syncuse-l').onclick = () => { $('#m-sync').classList.add('hide'); SV.syncAt = c.updated_at; SV.cloudUser = RK.state().user.id; pushCloud(true); toast('이 기기 데이터로 서버를 덮었어요'); };
  $('#m-sync').classList.remove('hide');
}
// 다시 돌아왔을 때(탭 전환·앱 복귀·뒤로가기 캐시) 서버를 다시 확인, 나갈 때 못 올린 진행은 바로 올림
document.addEventListener('visibilitychange', () => { if (!RK.state().user) return; if (document.hidden) { if (isDirty() && SV.cloudUser === RK.state().user.id) pushCloud(); } else pullCloud(); });
window.addEventListener('pageshow', e => { if (e.persisted && RK.state().user) pullCloud(true); });
window.addEventListener('focus', () => { if (RK.state().user) pullCloud(); });
function cloudOnAuth() {
  const u = RK.state().user, id = u ? u.id : null;
  if (id === cloudUid) return; cloudUid = id;
  if (id) pullCloud(); else { syncMsg = ''; refreshSync(); }
}
/* 메인 화면 안내: 로그인 안 했으면 '다른 기기 기록 이어하기' 안내 (새 브라우저면 눈에 띄게) */
function loginHint() {
  const el = $('#loginhint'), st = RK.state(), fresh = isFresh();
  if (!st.avail || st.user || (!fresh && SV.hintOff)) { el.classList.add('hide'); return; }
  el.className = 'lhint' + (fresh ? ' fresh' : '');
  el.innerHTML = `<div style="flex:1">${fresh ? '<b>다른 기기에서 하던 기록이 있나요?</b><br>로그인하면 이어서 할 수 있어요.' : '<b>클라우드 저장</b><br>로그인해 두면 기기를 바꿔도 기록이 이어져요.'}</div><button class="btn gold" id="lhlogin">Google 로그인</button>${fresh ? '' : '<button class="x" id="lhx" aria-label="닫기">×</button>'}`;
  $('#lhlogin').onclick = () => RK.login();
  const x = $('#lhx'); if (x) x.onclick = () => { SV.hintOff = true; persist(); el.classList.add('hide'); };
}
function refreshSync() {
  if (!$('#s-menu').classList.contains('hide')) loginHint(); if (!$('#s-settings').classList.contains('hide')) renderSettings(); }

/* ───── 설정 ───── */
function renderSettings() {
  $$('#langrow button').forEach(b => b.classList.toggle('on', b.dataset.l === I18N.lang));
  $('#sndbtn').textContent = '효과음: ' + (SV.snd ? '켜짐' : '꺼짐'); $('#bgmbtn').textContent = '배경음: ' + (SV.bgm !== false ? '켜짐' : '꺼짐'); $('#vibbtn').textContent = '진동: ' + (SV.vib ? '켜짐' : '꺼짐');
  $('#numbtn').textContent = '피해 숫자: ' + (SV.nums ? '켜짐' : '꺼짐'); $('#qbtn').textContent = '화질: ' + (lowQ ? '낮음' : '자동');
  const st = RK.state(), cb = $('#cloudbtn'), ci = $('#cloudinfo');
  if (!st.avail) { cb.textContent = '클라우드 저장 (연결 중…)'; cb.disabled = true; ci.textContent = st.err || ''; }
  else if (!st.user) { cb.textContent = 'Google 로그인 · 클라우드 저장'; cb.disabled = false; cb.onclick = () => RK.login(); ci.textContent = '로그인하면 다른 기기에서도 이어서 할 수 있어요 (랭킹과 같은 계정)'; }
  else { cb.textContent = '지금 클라우드에 저장'; cb.disabled = syncBusy; cb.onclick = () => { syncMsg = '저장 중…'; renderSettings(); SV.cloudUser === st.user.id ? pushCloud() : pullCloud(); }; ci.textContent = `${st.nick || '로그인됨'}${st.user.email ? ' (' + st.user.email + ')' : ''} · ${syncMsg || (SV.syncAt ? '마지막 저장 ' + new Date(SV.syncAt).toLocaleString(LOC()) : '아직 저장 안 됨')}`; }
}
$$('#langrow button').forEach(b => b.onclick = () => { I18N.set(b.dataset.l); SND.play('click'); renderSettings(); });
window.onLangChange = () => { const cur = SCR.find(n => !$('#s-' + n).classList.contains('hide')); if (cur && !running) go(cur); };
$('#sndbtn').onclick = () => { SV.snd = !SV.snd; save(); SND.setOpts({ sfx: SV.snd }); renderSettings(); };
$('#bgmbtn').onclick = () => { SV.bgm = SV.bgm === false; save(); SND.setOpts({ bgm: SV.bgm }); renderSettings(); };
$('#vibbtn').onclick = () => { SV.vib = !SV.vib; save(); renderSettings(); };
$('#numbtn').onclick = () => { SV.nums = !SV.nums; save(); renderSettings(); };
$('#qbtn').onclick = () => { lowQ = !lowQ; resize(); renderSettings(); };
$('#adfree').onclick = () => toast('스토어 출시 후 구매할 수 있어요');
$('#resetbtn').onclick = () => { if (confirm(I18N.t('이 기기의 금화·강화·기록·업적이 모두 지워져요. (클라우드에 저장된 데이터는 남아 있어요) 초기화할까요?'))) { SV = blank(); persist(); cloudUid = null; go('menu'); } };

/* ───── 랭킹 화면 ───── */
let rkCh = 1, rkHard = false;
const rkKey = () => rkCh === 6 ? 1000 + D.weekNo() : rkCh + (rkHard ? 10 : 0);
$$('#rktabs button').forEach(b => b.onclick = () => { rkCh = +b.dataset.ch; renderRank(); });
$$('#rkdiff button').forEach(b => b.onclick = () => { rkHard = b.dataset.d === 'h'; renderRank(); });
async function renderRank() {
  $$('#rktabs button').forEach(x => x.classList.toggle('on', +x.dataset.ch === rkCh));
  $$('#rkdiff button').forEach(x => x.classList.toggle('on', (x.dataset.d === 'h') === rkHard));
  const me = $('#rkme'), list = $('#rklist'), st = RK.state(), key = rkKey();
  $('#rkdiff').classList.toggle('hide', rkCh === 6); $('#rknote').textContent = rkCh === 6 ? `이번 주 조건: ${D.weekly().name} (${D.weekly().desc}) · 점수 = 생존 초×10 + 처치 수 + 우두머리 처치×2,000 · 매주 월요일 초기화` : '점수 = 생존 초×10 + 처치 수 + 중간보스 1,500 + 클리어 5,000 + 빠른 보스 처치 보너스 + 연장전 1초당 40';
  const local = SV.best[key];
  $('#rkuser').textContent = st.user ? st.nick : '';
  let meHtml = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><div class="small">${rkCh === 6 ? '백귀야행 · 이번 주' : D.CHAPTERS[rkCh - 1].name + (rkHard ? ' · 어려움' : '')} · 내 최고 (이 기기)</div><b style="font-size:20px">${local ? local.score.toLocaleString() : '-'}</b></div>`;
  if (!st.avail) meHtml += `<div class="small" style="text-align:right">${st.err || '온라인 랭킹 연결 중…'}</div>`;
  else if (!st.user) meHtml += `<button class="btn gold" id="rklogin" style="padding:10px 14px;font-size:14px">Google 로그인</button>`;
  else meHtml += `<div style="text-align:right"><button class="btn" id="rknick" style="padding:8px 12px;font-size:13px">닉네임 변경</button><button class="btn ghost" id="rklogout" style="padding:6px;font-size:12px">로그아웃</button></div>`;
  meHtml += '</div>';
  if (st.user) meHtml += `<div class="note" id="rkmine">서버 기록 불러오는 중…</div>`;
  else if (st.avail) meHtml += `<div class="note">로그인하면 기록이 온라인 랭킹에 올라가요. 맞수와 같은 계정을 써요.</div>`;
  me.innerHTML = meHtml;
  const lb = $('#rklogin'); if (lb) lb.onclick = () => RK.login();
  const lo = $('#rklogout'); if (lo) lo.onclick = async () => { await RK.logout(); renderRank(); };
  const nk = $('#rknick'); if (nk) nk.onclick = () => openNick();
  list.innerHTML = st.avail ? '<div class="small" style="text-align:center;padding:20px">불러오는 중…</div>' : '';
  if (!st.avail) return;
  const [rows, mine] = await Promise.all([RK.board(key), st.user ? RK.mine(key) : null]);
  if (key !== rkKey()) return;
  if (st.user && $('#rkmine')) $('#rkmine').innerHTML = mine && mine.score ? `서버 최고 <b>${mine.score.toLocaleString()}</b> · 전체 <b>${mine.rank}</b>위 / ${mine.total}명` : '아직 서버에 기록이 없어요. 한 판 하면 올라가요.';
  if (!rows) { list.innerHTML = '<div class="small" style="text-align:center;padding:20px">랭킹을 불러오지 못했어요</div>'; return; }
  if (!rows.length) { list.innerHTML = '<div class="small" style="text-align:center;padding:20px">아직 기록이 없어요. 첫 번째 주인공이 되어 보세요!</div>'; return; }
  list.innerHTML = rows.map((r, i) => `<div class="r ${st.user && r.uid === st.user.id ? 'me' : ''}"><div class="no">${i + 1}</div><div class="nk">${esc(r.nick)}<span class="mini">${D.HEROES[r.hero] ? D.HEROES[r.hero].name : ''}${r.cleared ? ' · 클리어' : ''} · ${fmt(r.t)}</span></div><div class="sc">${r.score.toLocaleString()}</div></div>`).join('');
}
function openNick() { $('#nickin').value = RK.state().nick || ''; $('#nickmsg').textContent = ''; $('#m-nick').classList.remove('hide'); }
$('#nickcancel').onclick = () => $('#m-nick').classList.add('hide');
$('#nicksave').onclick = async () => { const r = await RK.setNick($('#nickin').value); if (r.ok) { $('#m-nick').classList.add('hide'); renderRank(); } else $('#nickmsg').textContent = r.msg; };
RK.init(() => { cloudOnAuth(); if (!$('#s-menu').classList.contains('hide')) loginHint(); if (!$('#s-settings').classList.contains('hide')) renderSettings(); if (!$('#s-rank').classList.contains('hide')) renderRank(); if (RK.state().askNick) { RK.state().askNick = false; openNick(); } });

/* ───── 게임 ───── */
const cv = $('#cv'), ctx = cv.getContext('2d');
let lowQ = false, slowT = 0;
let S = null, W = 0, H = 0, K = 1, DPR = 1, runId = null, running = false, last = 0, hudT = 0, tutT = 0;
function resize() {
  const r = $('#app').getBoundingClientRect(); DPR = Math.min(lowQ ? 1 : 1.5, window.devicePixelRatio || 1);
  W = r.width; H = r.height; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  K = Math.max(0.8, Math.min(2.2, Math.sqrt(W * H / (340 * 660))));
  A.setDpr(DPR * K);
}
window.addEventListener('resize', resize); resize();

/* 조작: 화면 어디든 누르고 끌기 */
const JOY = { on: false, bx: 0, by: 0, x: 0, y: 0, id: null }, KEYS = {};
cv.addEventListener('pointerdown', e => { SND.unlock(); if (!running) return; JOY.on = true; JOY.id = e.pointerId; JOY.bx = e.clientX; JOY.by = e.clientY; JOY.x = JOY.y = 0; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
cv.addEventListener('pointermove', e => { if (!JOY.on || e.pointerId !== JOY.id) return; let dx = e.clientX - JOY.bx, dy = e.clientY - JOY.by; const d = hyp(dx, dy), R = 46; if (d > R) { JOY.bx += dx - dx / d * R; JOY.by += dy - dy / d * R; dx = e.clientX - JOY.bx; dy = e.clientY - JOY.by; } JOY.x = dx / R; JOY.y = dy / R; });
const jend = e => { if (e.pointerId === JOY.id) { JOY.on = false; JOY.x = JOY.y = 0; } };
cv.addEventListener('pointerup', jend); cv.addEventListener('pointercancel', jend);
addEventListener('keydown', e => { KEYS[e.key.toLowerCase()] = true; if (e.key === 'Escape' && running) pause(); });
addEventListener('keyup', e => { KEYS[e.key.toLowerCase()] = false; });
function input() {
  let x = JOY.x, y = JOY.y;
  const kx = (KEYS.d || KEYS.arrowright ? 1 : 0) - (KEYS.a || KEYS.arrowleft ? 1 : 0), ky = (KEYS.s || KEYS.arrowdown ? 1 : 0) - (KEYS.w || KEYS.arrowup ? 1 : 0);
  if (kx || ky) { x = kx; y = ky; }
  const m = hyp(x, y); if (m < 0.12) return { x: 0, y: 0 }; if (m > 1) { x /= m; y /= m; }
  return { x, y };
}

function startRun() {
  SND.unlock();
  for (const s of SCR) $('#s-' + s).classList.add('hide');
  S = C.newRun({ hero: SV.hero, chapter: SV.ch, hard: SV.hard, meta: Object.assign({}, SV.meta), hlv: (SV.hlv || {})[SV.hero] || 1, viewR: 420 });
  S.revivable = true; S.goldDoubled = false;
  $('#hud').classList.remove('hide'); $('#bossbar').classList.add('hide');
  running = true; last = performance.now(); paused = false; slotSig = '';
  SND.music(fieldMusic());
  if (S.endless) banner('백귀야행', '이번 주 조건 · ' + D.weekly().name); else banner(S.ch.id + '장 · ' + S.ch.name + (S.hard ? ' (어려움)' : ''), '살아남아 우두머리를 쓰러뜨려라');
  tutT = SV.tut ? 0 : 6; $('#tut').classList.toggle('hide', !!SV.tut);
  runId = null; RK.start(SV.ch === 6 ? 1000 + D.weekNo() : SV.ch + (SV.hard ? 10 : 0), SV.hero).then(id => { runId = id; });
  requestAnimationFrame(loop);
}
let paused = false, modal = null;
function pause() {
  if (!S || S.over || modal) return; paused = true;
  $('#pinfo').innerHTML = `${S.ch.name}${S.hard ? ' (어려움)' : ''} · ${fmt(S.t)} · Lv ${S.lv}`;
  $('#pbuild').innerHTML = S.W.map(w => { const W = D.WEAPONS[w.id]; return `<div class="bi"><img src="${A.iconURL(W.icon, 32, w.evo)}"><span>${w.jin ? '진·' + W.evo.name : w.evo ? W.evo.name : W.name + ' ' + w.lv}</span><em>${w.jin ? '진 각성' : w.evo ? (w.id === S.hero.weapon ? `진 각성: Lv${D.JIN.minLv} 이후 상자` : '진화') : '진화: ' + D.PASSIVES[W.evo.with].name}</em></div>`; }).join('')
    + (S.relics || []).map(r => `<div class="bi"><img src="${A.iconURL(D.RELICS[r].icon, 32)}"><span>${D.RELICS[r].name}</span><em>${D.RELICS[r].desc}</em></div>`).join('')
    + (S.orbs ? `<div class="bi"><span>보옥</span><em>${Object.entries(S.orbs).map(([k, n]) => D.ORBS[k].name.replace(' 보옥', '') + ' ×' + n).join(' · ')}</em></div>` : '')
    + Object.entries(S.P).map(([k, v]) => `<div class="bi"><img src="${A.iconURL(D.PASSIVES[k].icon, 32)}"><span>${D.PASSIVES[k].name} ${v}</span><em>${D.PASSIVES[k].desc}</em></div>`).join('')
    + setsHTML(S.sets || {});
  $('#sndbtn2').textContent = '소리: ' + (SV.snd || SV.bgm !== false ? '켜짐' : '꺼짐'); $('#m-pause').classList.remove('hide'); modal = 'pause';
}
$('#pausebtn').onclick = pause;
$('#otgo').onclick = () => { $('#m-ot').classList.add('hide'); modal = null; C.overtime(S); last = performance.now(); events(); };
$('#otend').onclick = () => { $('#m-ot').classList.add('hide'); modal = null; C.retire(S); finish(); };
$('#resume').onclick = () => { $('#m-pause').classList.add('hide'); modal = null; paused = false; last = performance.now(); };
$('#sndbtn2').onclick = () => { const on = !(SV.snd || SV.bgm !== false); SV.snd = on; SV.bgm = on; save(); SND.setOpts({ sfx: on, bgm: on }); $('#sndbtn2').textContent = '소리: ' + (on ? '켜짐' : '꺼짐'); };
$('#giveup').onclick = () => { $('#m-pause').classList.add('hide'); modal = null; paused = false; S.over = S.cleared ? 'clear' : 'quit'; finish(); };   // 연장전 중 포기 = 귀환(기록 인정)
document.addEventListener('visibilitychange', () => { if (document.hidden && running) pause(); });

function loop(now) {
  if (!running) return;
  const raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now;
  // 느린 기기면 자동으로 해상도를 낮춰요
  if (!lowQ && !paused && !modal && raw < 0.5) { slowT = raw > 0.026 ? slowT + raw : Math.max(0, slowT - raw * 0.5); if (slowT > 2.5) { lowQ = true; resize(); } }
  if (!paused && !modal) {
    S.viewR = hyp(W, H) / 2 / K + 30;
    const inp = input();
    C.step(S, dt, inp); SND.intensity && SND.intensity(0.2 + S.t / 420 + (S.hard ? 0.3 : 0));
    if (tutT > 0) { tutT -= dt; if (tutT <= 0 || (hyp(inp.x, inp.y) > 0.3 && S.t > 2)) { tutT = 0; $('#tut').classList.add('hide'); SV.tut = true; save(); } }
    events();
  }
  render();
  hudT -= dt; if (hudT <= 0) { hudT = 0.1; hud(); }
  requestAnimationFrame(loop);
}
function events() {
  for (const e of S.ev) {
    if (e.k === 'sfx') SND.play(e.s);
    else if (e.k === 'hurt') { SND.play('hurt'); vib(25); }
    else if (e.k === 'level') SND.play('level');
    else if (e.k === 'chest') SND.play('chest');
    else if (e.k === 'warn') toast(e.txt);
    else if (e.k === 'rage') toast(e.name + '이(가) 분노했다!');
    else if (e.k === 'evo') { SND.play('evo'); toast(D.WEAPONS[e.id].evo.name + ' 각성!'); }
    else if (e.k === 'boss') { SND.play('boss'); vib([60, 40, 60]); banner(e.name, e.final ? '최종 우두머리 · 결계에 갇혔다!' : '우두머리 출현 · 결계에 갇혔다!'); $('#bossname').textContent = e.name; $('#bossbar').classList.remove('hide'); SND.music('boss'); }
    else if (e.k === 'bossdown' && e.ot) { toast(e.name + ' 퇴치!'); $('#bossbar').classList.add('hide'); SND.music(fieldMusic()); }
    else if (e.k === 'bossdown') { toast(e.name + ' 퇴치! 10:00에 최종 우두머리가 나타나요'); $('#bossbar').classList.add('hide'); SND.music(fieldMusic()); }
    else if (e.k === 'clear') { SND.music(''); SND.play('clear'); $('#bossbar').classList.add('hide'); if (S.otAsk) { modal = 'ot'; $('#m-ot').classList.remove('hide'); } }
    else if (e.k === 'ot') { banner('연장전', '버틸 수 있을 만큼 버텨라'); SND.music('boss'); SND.play('boss'); vib([80, 40, 80]); }
    else if (e.k === 'otlv') { toast(S.endless ? `행렬이 거세진다 (${e.lv}단계) · 금화 +${e.gold}` : `연장 ${e.lv}분 · 적이 더 강해진다! 금화 +${e.gold}`); SND.play('boss'); }
    else if (e.k === 'relicfx') { toast('불사초가 다시 일으켜 세웠다!'); SND.play('evo'); }
    else if (e.k === 'stage') { banner(e.name, '백귀야행이 이어진다'); }
    else if (e.k === 'dead') { SND.music(''); SND.play('dead'); vib(200); }
  }
  S.ev.length = 0;
  if (S.over === 'dead') {
    if (S.freeRev > 0) { S.freeRev--; C.revive(S); toast('환생! 다시 일어섰다'); return; }
    if (S.revivable && !S.revived) { modal = 'dead'; $('#m-dead').classList.remove('hide'); } else finish(); return;
  }
  if (S.over === 'clear') { if (!S.clearAt) S.clearAt = performance.now(); else if (performance.now() - S.clearAt > 1400) finish(); return; }
  if (S.relicAsk && !modal) { openRelic(); return; }
  if (S.otAsk || modal) return;
  if (S.chests > 0 || S.pendingLv > 0) openLevel();
}
function openRelic() {
  modal = 'relic'; const box = $('#ropts'); box.innerHTML = '';
  $('#relsub').textContent = `우두머리가 남긴 유물 · 하나를 고르세요 (${(S.relics || []).length + 1}/${D.MAX_RELIC})`;
  for (const id of S.relicOpts) {
    const R = D.RELICS[id], b = document.createElement('button'); b.className = 'opt relic';
    b.innerHTML = `<img src="${A.iconURL(R.icon, 46)}" alt=""><div><b>${R.name}</b><span class="new" style="background:#7a4bd0">유물</span><p>${R.desc}</p></div>`;
    b.onclick = () => { C.relicPick(S, id); SND.play('evo'); $('#m-relic').classList.add('hide'); modal = null; last = performance.now(); slotSig = ''; toast('유물 획득: ' + R.name); events(); };
    box.appendChild(b);
  }
  $('#m-relic').classList.remove('hide');
}
let lastOps = [];
function openLevel(reroll) {
  modal = 'lvl'; const chest = S.chests > 0;
  const ops = C.choices(S, 3, reroll ? lastOps : []); lastOps = ops.map(o => o.kind + ':' + o.id); const evo = ops[0] && (ops[0].kind === 'evo' || ops[0].kind === 'jin'), jin = evo && ops[0].kind === 'jin';
  $('#lvtitle').textContent = jin ? '진(眞) 각성!' : evo ? '무기 각성!' : chest ? '보물 상자!' : '레벨 업!';
  $('#lvsub').textContent = jin ? `${D.HEROES[S.heroId].name}만이 다다를 수 있는 경지` : evo ? '비급이 완성되었다' : chest ? `상자에서 하나를 고르세요${S.chests > 1 ? ` (${S.chests}개 남음)` : ''}` : `Lv ${S.lv - S.pendingLv + 1} · 하나를 고르세요`;
  $('#m-lvl .mbox').classList.toggle('evo', evo);
  const box = $('#opts'); box.innerHTML = '';
  for (const o of ops) {
    const b = document.createElement('button'); b.className = 'opt' + (o.kind === 'evo' || o.kind === 'jin' ? ' evo' : '');
    let tag = '';
    if (o.kind === 'w' || o.kind === 'p') tag = o.lv === 1 ? '<span class="new">NEW</span>' : `<span class="lv">Lv ${o.lv}</span>`;
    if (o.kind === 'evo') tag = '<span class="new" style="background:var(--gold);color:#2a1b06">진화</span>';
    if (o.kind === 'jin') tag = '<span class="new" style="background:#ff6a3d;color:#fff">진 각성</span>';
    const pair = o.kind === 'w' && o.lv === 1 ? `<p class="pair">진화 짝: ${o.pair}</p>` : '';
    const st = o.set && o.lv === 1 ? `<p class="setl"><span class="setc" style="--c:${o.set.color}">${o.set.name} ${o.set.have}/${o.set.max}</span>${o.set.on ? ` <b style="color:${o.set.color}">세트 효과 발동: ${o.set.on}</b>` : ''}</p>` : '';
    b.innerHTML = `<img src="${A.iconURL(o.icon, 46, o.kind === 'evo' || o.kind === 'jin')}" alt=""><div><b>${o.name}</b>${tag}<p>${o.kind === 'evo' || o.kind === 'jin' ? o.from + ' → ' + o.name + ' · ' : ''}${o.desc}</p>${pair}${st}</div>`;
    b.onclick = () => { C.pick(S, o); SND.play('click'); if (o.set && o.set.on && o.lv === 1) { toast(`${o.set.name} 세트 ${o.set.have}개 · ${o.set.on}`); SND.play('evo'); } $('#m-lvl').classList.add('hide'); modal = null; last = performance.now(); slotSig = ''; events(); };
    box.appendChild(b);
  }
  const rb = $('#rerollbtn'); rb.classList.toggle('hide', evo);
  rb.textContent = S.rerolls > 0 ? `다시 뽑기 (${S.rerolls}회 남음)` : '▶ 광고 보고 다시 뽑기';
  rb.onclick = () => { if (S.rerolls > 0) { S.rerolls--; openLevel(true); } else showAd(() => openLevel(true)); };
  $('#m-lvl').classList.remove('hide');
}
$('#revive').onclick = () => showAd(() => { $('#m-dead').classList.add('hide'); modal = null; C.revive(S); SND.music(S.boss ? 'boss' : fieldMusic()); last = performance.now(); toast('다시 일어섰다!'); });
$('#nodead').onclick = () => { $('#m-dead').classList.add('hide'); modal = null; S.revivable = false; finish(); };

function showAd(done) {
  if (SV.adfree) return done();
  const ov = $('#adov'); ov.classList.remove('hide'); let n = 3; $('#adcount').textContent = n;
  const iv = setInterval(() => { n--; $('#adcount').textContent = n; if (n <= 0) { clearInterval(iv); ov.classList.add('hide'); done(); } }, 1000);
}

async function finish() {
  running = false; $('#hud').classList.add('hide'); $('#tut').classList.add('hide');
  const r = C.result(S), ch = S.ch.id, cleared = r.cleared, key = S.endless ? 1000 + (S.week || D.weekNo()) : ch + (S.hard ? 10 : 0);
  const notes = [];
  if (S.over !== 'quit') {
    SV.stats.runs++; SV.stats.kills += r.kills; SV.stats.bosses += r.bosses; SV.stats.maxLv = Math.max(SV.stats.maxLv, r.lv);
    for (const id of r.evolved) SV.evo[id] = true;
    if (r.jin) { SV.jin = SV.jin || {}; SV.jin[S.heroId] = true; }
    if (cleared) {
      if (!r.revived) SV.stats.noRevClear++;
      if (S.hard) SV.hclear[ch] = true; else SV.clear[ch] = true;
      if (ch === 1) SV.heroClear[S.heroId] = true;
      if (!SV.firstClear[key]) { SV.firstClear[key] = true; const fg = Math.round(S.ch.firstGold * (S.hard ? D.HARD.firstGold : 1)); r.gold += fg; notes.push(`첫 클리어 보너스 금화 +${fg}`); }
    }
    dailyApply(r, S.heroId);
  }
  const before = new Set(D.ACH.filter(a => a.test(SV)).map(a => a.id));
  SV.gold += r.gold; SV.stats.goldTotal += r.gold;
  const prev = SV.best[key];
  if (S.over !== 'quit' && (!prev || r.score > prev.score)) SV.best[key] = { score: r.score, t: r.t, kills: r.kills, hero: S.heroId, cleared };
  const newAch = D.ACH.filter(a => !SV.ach[a.id] && a.test(SV));
  for (const h in D.HEROES) if (D.HEROES[h].unlock && heroUnlocked(h) && !SV['u_' + h]) { SV['u_' + h] = true; notes.push(`새 주인공 해금: ${D.HEROES[h].name}!`); }
  if (newAch.length) notes.push(`업적 달성 ${newAch.length}개 · 메인 → 업적에서 보상 받기`);
  if (dailyClaimable()) notes.push('일일 임무 보상을 받을 수 있어요');
  save();
  if (pendingPull) { pendingPull = false; setTimeout(pullCloud, 500); }
  $('#restitle').textContent = S.endless ? (S.over === 'quit' ? '후퇴' : '백귀야행 종료') : cleared ? '퇴마 성공!' : S.over === 'quit' ? '후퇴' : '퇴마 실패';
  $('#restitle').style.color = cleared || (S.endless && S.over !== 'quit') ? '' : '#ff8a7a';
  $('#ressub').textContent = S.endless ? `백귀야행 · 우두머리 ${r.bosses}마리 처치 · ${D.HEROES[S.heroId].name}` : `${ch}장 ${S.ch.name}${S.hard ? ' (어려움)' : ''} · ${D.HEROES[S.heroId].name}${r.ot ? ` · 연장전 ${fmt(r.ot)}` : ''}` + (cleared && !S.hard && ch < D.CHAPTERS.length && !(prev && prev.cleared) ? ` · ${ch + 1}장이 열렸어요!` : '');
  $('#resgrid').innerHTML = [[r.ot ? '연장전' : '생존 시간', r.ot ? fmt(r.ot) : fmt(r.t)], ['처치', r.kills.toLocaleString()], ['레벨', r.lv], ['획득 금화', `<span id="rgold">${r.gold.toLocaleString()}</span>`], ['점수', S.over === 'quit' ? '-' : r.score.toLocaleString()], ['내 최고', SV.best[key] ? SV.best[key].score.toLocaleString() : '-']].map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('');
  $('#resnotes').innerHTML = notes.map(n => `<div>✦ ${esc(n)}</div>`).join('');
  const dbl = $('#dbl'); dbl.disabled = r.gold <= 0; dbl.textContent = '▶ 광고 보고 금화 2배';
  dbl.onclick = () => { if (S.goldDoubled) return; showAd(() => { S.goldDoubled = true; SV.gold += r.gold; SV.stats.goldTotal += r.gold; save(); $('#rgold').textContent = (r.gold * 2).toLocaleString(); dbl.disabled = true; dbl.textContent = '금화 2배 받음'; }); };
  $('#m-res').classList.remove('hide');
  const rr = $('#resrank');
  if (S.over === 'quit') { rr.textContent = '포기한 판은 랭킹에 올라가지 않아요.'; return; }
  rr.textContent = RK.state().user ? '랭킹에 기록하는 중…' : (RK.state().avail ? '로그인하면 온라인 랭킹에 올라가요 (메인 → 랭킹)' : '');
  if (RK.state().user) {
    const out = await RK.finish(runId, r);
    rr.innerHTML = out.ok ? `온라인 랭킹 ${out.improved ? '<b style="color:var(--gold)">최고 기록 갱신!</b> ' : ''}현재 <b>${out.rank}</b>위 / ${out.total}명` : '랭킹 기록 실패: ' + out.msg;
  }
}
$('#again').onclick = () => { $('#m-res').classList.add('hide'); startRun(); };
$('#tomenu').onclick = () => { $('#m-res').classList.add('hide'); S = null; go('menu'); };

/* ───── HUD ───── */
let slotSig = '';
function hud() {
  if (!S) return;
  $('#xpfill').style.width = Math.min(100, S.xp / S.need * 100) + '%';
  $('#lvtag').textContent = 'Lv ' + S.lv;
  const otOn = S.ot && !S.endless; $('#timer').textContent = otOn ? '연장 ' + fmt(S.t - S.ot.t0) : fmt(S.t); $('#timer').classList.toggle('ot', !!otOn);
  $('#hkills').textContent = '☠ ' + S.kills.toLocaleString();
  $('#hgold span').textContent = Math.floor(S.gold).toLocaleString();
  if (S.boss) $('#bossfill').style.width = Math.max(0, S.boss.hp / S.boss.max * 100) + '%';
  const sig = S.W.map(w => w.id + w.lv + w.evo + !!w.jin).join() + '|' + Object.entries(S.P).join() + '|' + (S.relics || []).join() + '|' + JSON.stringify(S.sets || {});
  if (sig !== slotSig) {
    slotSig = sig;
    $('#slw').innerHTML = S.W.map(w => `<span class="sl${w.evo ? ' ev' : ''}"><img src="${A.iconURL(D.WEAPONS[w.id].icon, 26, w.evo)}"><b>${w.jin ? '眞' : w.evo ? '★' : w.lv}</b></span>`).join('');
    $('#slr').innerHTML = (S.relics || []).map(r => `<span class="sl"><img src="${A.iconURL(D.RELICS[r].icon, 26)}"></span>`).join('');
    $('#slset').innerHTML = Object.entries(S.sets || {}).filter(([k, n]) => n >= 2).map(([k, n]) => `<span class="setc" style="--c:${D.SETS[k].color}">${D.SETS[k].name} ${n}</span>`).join('');
    $('#slp').innerHTML = Object.entries(S.P).map(([k, v]) => `<span class="sl"><img src="${A.iconURL(D.PASSIVES[k].icon, 26)}"><b>${v}</b></span>`).join('');
  }
}
let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => el.style.opacity = 0, 1800); }
function banner(a, b) { $('#banner').innerHTML = `<div class="in"><b>${esc(a)}</b><small>${esc(b)}</small></div>`; }

/* ───── 그리기 ───── */
const PCOL = { fire: ['#bfe9ff', '#3fa6ff'], poison: ['#d6ff8a', '#4aa83a'], spike: ['#e6edf2', '#6b7884'], shard: ['#ffffff', '#ffb04a'], ice: ['#ffffff', '#7fc8ff'], fire2: ['#fff1a0', '#ff6a2a'], feather: ['#ffe08a', '#ff5a3a'], water: ['#e0fbff', '#2aa8c8'], bolt: ['#ffffff', '#6aa8ff'], bolt2: ['#ffffff', '#5a8aff'] };
function render() {
  const x = ctx, p = S.p;
  x.setTransform(DPR, 0, 0, DPR, 0, 0);
  const cx = W / 2, cy = H / 2;
  const wx = X => (X - p.x) * K + cx, wy = Y => (Y - p.y) * K + cy;
  const vis = (sx, sy, m) => sx > -m && sy > -m && sx < W + m && sy < H + m;
  // 바닥
  const g = A.ground(S.ch), T = (g.ws || 256) * K;
  const ox = -((p.x * K) % T) + cx % T - T, oy = -((p.y * K) % T) + cy % T - T;
  for (let a = ox - T; a < W + T; a += T) for (let b = oy - T; b < H + T; b += T) x.drawImage(g, a, b, T + 0.5, T + 0.5);
  if (S.hard) { x.fillStyle = 'rgba(60,0,20,.18)'; x.fillRect(0, 0, W, H); }
  // 결계
  if (S.arena) {
    const A0 = S.arena, ax = wx(A0.x), ay = wy(A0.y), ar = A0.r * K;
    x.save(); x.beginPath(); x.rect(0, 0, W, H); x.arc(ax, ay, ar, 0, TAU, true); x.fillStyle = 'rgba(10,0,10,.55)'; x.fill(); x.restore();
    x.save(); x.setLineDash([10 * K, 8 * K]); x.lineDashOffset = -S.t * 30; x.beginPath(); x.arc(ax, ay, ar, 0, TAU); x.strokeStyle = 'rgba(242,193,78,.9)'; x.lineWidth = 4 * K; x.stroke(); x.restore();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + S.t * 0.1; const px = ax + Math.cos(a) * ar, py = ay + Math.sin(a) * ar; x.fillStyle = '#f6e27a'; x.fillRect(px - 4 * K, py - 7 * K, 8 * K, 14 * K); x.fillStyle = '#d0342c'; x.fillRect(px - 0.8 * K, py - 5 * K, 1.6 * K, 10 * K); }
  }
  // 위험 지대 (보스 불길)
  for (const h of S.hz) { const sx = wx(h.x), sy = wy(h.y); if (!vis(sx, sy, 60)) continue; const a = Math.min(1, h.t / 0.6); x.beginPath(); x.arc(sx, sy, h.r * K, 0, TAU); x.fillStyle = `rgba(255,${90 + 40 * Math.sin(S.t * 8 + h.x)},30,${0.35 * a})`; x.fill(); }
  // 내 장판
  for (const z of S.pz) {
    const sx = wx(z.x), sy = wy(z.y);
    if (z.k === 'quake' && !z.done) { x.beginPath(); x.arc(sx, sy, z.r * K, 0, TAU); x.strokeStyle = 'rgba(200,170,120,.6)'; x.lineWidth = 2; x.stroke(); }
    else if (z.k === 'vortex') { const a = Math.min(1, z.t * 2, (z.t0 - z.t) * 4); x.save(); x.translate(sx, sy); x.globalAlpha = 0.85 * a; for (let i = 0; i < 3; i++) { x.rotate(S.t * 6 + i * 2.1); x.beginPath(); x.arc(0, 0, z.r * K * (0.35 + i * 0.25), 0, 4.2); x.strokeStyle = z.evo ? 'rgba(220,150,255,.8)' : 'rgba(170,110,240,.75)'; x.lineWidth = (4 - i) * K; x.stroke(); } x.beginPath(); x.arc(0, 0, z.r * K, 0, TAU); x.fillStyle = 'rgba(80,30,120,.18)'; x.fill(); x.restore(); }
    else if (z.k === 'burn') { x.beginPath(); x.arc(sx, sy, z.r * K, 0, TAU); x.fillStyle = `rgba(110,200,255,${0.22 * Math.min(1, z.t)})`; x.fill(); }
  }
  // 예고 표시
  for (const t of S.tele) {
    x.save(); x.globalAlpha = 0.35 + 0.2 * Math.sin(S.t * 20);
    if (t.k === 'circle') { const sx = wx(t.x), sy = wy(t.y); x.beginPath(); x.arc(sx, sy, t.r * K, 0, TAU); x.fillStyle = 'rgba(255,40,40,.28)'; x.fill(); x.strokeStyle = '#ff5050'; x.lineWidth = 2; x.stroke(); if (t.p != null) { x.globalAlpha = 0.5; x.beginPath(); x.arc(sx, sy, t.r * K * Math.min(1, t.p), 0, TAU); x.fillStyle = 'rgba(255,60,60,.5)'; x.fill(); } }
    else { x.translate(wx(t.x), wy(t.y)); x.rotate(t.a); x.fillStyle = 'rgba(255,40,40,.4)'; x.fillRect(0, -t.w / 2 * K, t.len * K, t.w * K); }
    x.restore();
  }
  // 영혼 구슬
  for (const gm of S.gems) {
    const sx = wx(gm.x), sy = wy(gm.y); if (!vis(sx, sy, 20)) continue;
    const col = gm.v >= 10 ? '#ff5a6e' : gm.v >= 2 ? '#6ee7a0' : '#6ecbff', r = (gm.v >= 10 ? 6 : gm.v >= 2 ? 4.6 : 3.6) * K;
    x.beginPath(); x.arc(sx, sy, r * 1.9, 0, TAU); x.fillStyle = col + '33'; x.fill();
    x.beginPath(); x.arc(sx, sy, r, 0, TAU); x.fillStyle = col; x.fill(); x.beginPath(); x.arc(sx - r * .3, sy - r * .3, r * .35, 0, TAU); x.fillStyle = '#fff'; x.fill();
  }
  for (const o of S.drops) { const sx = wx(o.x), sy = wy(o.y) + Math.sin(S.t * 4 + o.x) * 2 * K; if (!vis(sx, sy, 30)) continue; const s = o.k === 'chest' ? 44 : o.k === 'coin' ? 15 : 32; x.drawImage(A.drop(o.k), sx - s / 2 * K, sy - s / 2 * K, s * K, s * K); }
  // 금강결계
  const aura = S.W.find(w => w.id === 'aura');
  if (aura) { const s = C.wst(aura), r = s.r * p.area * K; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = aura.evo ? 'rgba(255,214,102,.16)' : 'rgba(255,214,102,.10)'; x.fill(); x.save(); x.setLineDash([6 * K, 6 * K]); x.lineDashOffset = S.t * 20; x.strokeStyle = 'rgba(255,214,102,.5)'; x.lineWidth = 2 * K; x.stroke(); x.restore(); }
  // 캐릭터(위→아래 순)
  const list = [];
  for (const e of S.en) { if (e.dead) continue; const sx = wx(e.x), sy = wy(e.y); if (!vis(sx, sy, 90)) continue; list.push(e); }
  list.push(p); list.sort((a, b) => a.y - b.y);
  for (const e of list) {
    const sx = wx(e.x), sy = wy(e.y), rr = (e.r || 12) * K;
    const sh = A.shadow(Math.round(e.r || 12)); x.drawImage(sh, sx - rr, sy + rr * 0.42, rr * 2, rr * 0.76);
    if (e === p) {
      const fr = p.moving ? Math.floor(S.t * 8) % 2 : 0, sp = A.sprite(S.heroId, fr, p.hurt > 0 && Math.floor(S.t * 30) % 2 === 0);
      const bob = p.moving ? Math.abs(Math.sin(S.t * 12)) * 2 * K : 0, hp = heroPose(p);
      if (hp.glow > 0) { x.save(); x.globalAlpha = hp.glow * 0.7; x.beginPath(); x.ellipse(sx, sy + 13 * K, 22 * K * (1.2 - hp.glow * 0.2), 8 * K, 0, 0, TAU); x.strokeStyle = p.atk && p.atk.k === 'stomp' ? '#e0b070' : '#aee6ff'; x.lineWidth = 3 * K; x.stroke(); x.restore(); }
      drawSpr(sp, sx, sy - bob, hp.face, 0, hp.tilt, hp.o);
      const bw = 34 * K; x.fillStyle = '#000a'; x.fillRect(sx - bw / 2, sy + 20 * K, bw, 5 * K); x.fillStyle = p.hp / p.maxhp < 0.3 ? '#ff5a4a' : '#5fe08a'; x.fillRect(sx - bw / 2 + 1, sy + 20 * K + 1, (bw - 2) * Math.max(0, p.hp / p.maxhp), 5 * K - 2);
      if (p.chill > 0) { x.beginPath(); x.arc(sx, sy, 16 * K, 0, TAU); x.strokeStyle = 'rgba(150,210,255,.7)'; x.lineWidth = 2; x.stroke(); }
    } else if (e.seg) {
      if (A.snakeReady(e.segSpr === 'segb' ? 'cy' : 'imugi')) continue;   // 그림이 있으면 머리 차례에 한꺼번에 그림
      const sp = A.seg(Math.min(13, e.si), e.flash > 0, e.segSpr === 'segb'); x.drawImage(sp.cv, sx - sp.sz / 2 * K, sy - sp.sz / 2 * K, sp.sz * K, sp.sz * K);
    } else {
      const fr = Math.floor(S.t * (e.boss ? 4 : 7) + e.id) % 2, sp = A.sprite(e.spr, fr, e.flash > 0, e.tint);
      if (e.boss && e.def.move === 'snake' && A.snake(x, e.def.segSpr === 'segb' ? 'cy' : 'imugi', [[sx, sy], ...e.segs.map(g => [wx(g.x), wy(g.y)])], K, e.ang, e.st !== 'idle' || e.cast > 0, e.flash > 0)) {}
      else if (e.boss && e.def.move === 'snake') { x.save(); x.translate(sx, sy); x.rotate(e.ang); x.drawImage(sp.cv, -sp.sz / 2 * K, -sp.sz / 2 * K, sp.sz * K, sp.sz * K); x.restore(); }
      else { const mp = mobPose(e); drawSpr(sp, sx, sy, e.face, (e.ai === 'charge' && e.st === 1) || (e.boss && (e.st === 'aim' || e.st === 'stomp')) ? 1 : 0, mp.tilt, mp.o); }
      if (e.elite && !e.boss) { const bw = 30 * K; x.fillStyle = '#000a'; x.fillRect(sx - bw / 2, sy - rr - 12 * K, bw, 4 * K); x.fillStyle = '#ffb04a'; x.fillRect(sx - bw / 2, sy - rr - 12 * K, bw * e.hp / e.max, 4 * K); }
      if (e.boss && e.rage) { x.beginPath(); x.arc(sx, sy, rr * 1.3, 0, TAU); x.strokeStyle = `rgba(255,60,40,${0.3 + 0.2 * Math.sin(S.t * 10)})`; x.lineWidth = 3; x.stroke(); }
    }
  }
  // 염주
  for (const w of S.W) if (w.id === 'beads' && w.pos) for (const [bx, by] of w.pos) { const sx = wx(bx), sy = wy(by), r = (w.evo ? 8 : 6) * K; x.beginPath(); x.arc(sx, sy, r, 0, TAU); x.fillStyle = w.evo ? '#f2c14e' : '#b07a3e'; x.fill(); x.lineWidth = 1.5; x.strokeStyle = '#1b1423'; x.stroke(); x.beginPath(); x.arc(sx - r * .3, sy - r * .3, r * .33, 0, TAU); x.fillStyle = '#fff2d0'; x.fill(); }
  // 내 공격체
  for (const q of S.pr) {
    const sx = wx(q.x), sy = wy(q.y);
    if (q.k === 'wave') { x.beginPath(); x.arc(sx, sy, q.r0 * K, 0, TAU); x.strokeStyle = `rgba(255,226,140,${0.8 * (1 - q.t / q.dur)})`; x.lineWidth = 6 * K; x.stroke(); continue; }
    if (!vis(sx, sy, 40)) continue;
    x.save(); x.translate(sx, sy); x.rotate(q.a);
    if (q.k === 'tal') { x.fillStyle = q.evo ? '#ffd34d' : '#f6e27a'; x.strokeStyle = '#1b1423'; x.lineWidth = 1.2; x.fillRect(-9 * K, -5 * K, 18 * K, 10 * K); x.strokeRect(-9 * K, -5 * K, 18 * K, 10 * K); x.fillStyle = '#d0342c'; x.fillRect(-6 * K, -0.8 * K, 12 * K, 1.6 * K); }
    else if (q.k === 'arrow') { x.strokeStyle = q.evo ? '#ffe9a0' : '#e8d8b0'; x.lineWidth = 2.5 * K; x.beginPath(); x.moveTo(-14 * K, 0); x.lineTo(10 * K, 0); x.stroke(); x.fillStyle = '#dfe6ee'; x.beginPath(); x.moveTo(14 * K, 0); x.lineTo(8 * K, -3.5 * K); x.lineTo(8 * K, 3.5 * K); x.closePath(); x.fill(); x.fillStyle = '#d23b2c'; x.fillRect(-16 * K, -3 * K, 4 * K, 6 * K); if (q.evo) { x.globalAlpha = 0.35; x.fillStyle = '#fff2b0'; x.fillRect(-30 * K, -2 * K, 18 * K, 4 * K); x.globalAlpha = 1; } }
    else if (q.k === 'knife') { x.fillStyle = q.evo ? '#ffe9a0' : '#e8eef4'; x.beginPath(); x.moveTo(10 * K, 0); x.lineTo(-4 * K, -2.5 * K); x.lineTo(-4 * K, 2.5 * K); x.closePath(); x.fill(); x.fillStyle = '#8a5a2b'; x.fillRect(-9 * K, -1.5 * K, 5 * K, 3 * K); }
    else if (q.k === 'soul') { x.rotate(-q.a); x.beginPath(); x.arc(0, 0, 9 * K, 0, TAU); x.fillStyle = 'rgba(127,216,255,.3)'; x.fill(); x.beginPath(); x.arc(0, 0, 5 * K, 0, TAU); x.fillStyle = '#dff8ff'; x.fill(); }
    else { x.globalAlpha = Math.min(1, q.life * 2); x.beginPath(); x.arc(-10 * K, 0, q.w / 2 * K, -1.1, 1.1); x.strokeStyle = q.evo ? 'rgba(255,240,180,.9)' : 'rgba(220,255,235,.85)'; x.lineWidth = 6 * K; x.stroke(); x.beginPath(); x.arc(-18 * K, 0, q.w / 2.4 * K, -1, 1); x.strokeStyle = 'rgba(160,240,190,.5)'; x.lineWidth = 3 * K; x.stroke(); }
    x.restore();
  }
  // 적 탄환
  for (const q of S.ep) {
    const sx = wx(q.x), sy = wy(q.y), r = q.r * K; if (!vis(sx, sy, 20)) continue;
    const col = PCOL[q.k] || PCOL.fire;
    x.beginPath(); x.arc(sx, sy, r * 1.8, 0, TAU); x.fillStyle = col[1] + '55'; x.fill();
    x.beginPath(); x.arc(sx, sy, r, 0, TAU); x.fillStyle = col[1]; x.fill(); x.beginPath(); x.arc(sx, sy, r * 0.5, 0, TAU); x.fillStyle = col[0]; x.fill();
  }
  // 효과
  x.textAlign = 'center';
  for (const f of S.fx) {
    const sx = wx(f.x), sy = wy(f.y); if (!vis(sx, sy, 300)) continue;
    if (f.k === 'num') { if (!SV.nums && !f.big) continue; x.font = `900 ${(f.big ? 15 : f.crit ? 14 : 12) * K}px sans-serif`; x.globalAlpha = Math.min(1, f.t * 3); x.lineWidth = 3; x.strokeStyle = '#000'; x.strokeText(f.v, sx, sy); x.fillStyle = f.crit ? '#ff9a4a' : f.big ? '#ffd36b' : '#fff'; x.fillText(f.v, sx, sy); x.globalAlpha = 1; }
    else if (f.k === 'swing') { const k = 1 - f.t / f.t0; x.save(); x.globalAlpha = 1 - k * 0.6; const span = f.arc * Math.min(1, k * 1.6); x.beginPath(); x.arc(sx, sy, f.r * K, f.a - f.arc / 2, f.a - f.arc / 2 + span); x.strokeStyle = f.c === 'twin' ? (f.evo ? 'rgba(200,235,255,.95)' : 'rgba(225,235,245,.9)') : f.evo ? 'rgba(255,236,150,.95)' : 'rgba(255,220,140,.9)'; x.lineWidth = (f.evo ? 13 : 9) * K; x.stroke(); x.beginPath(); x.arc(sx, sy, f.r * 0.7 * K, f.a - f.arc / 2, f.a - f.arc / 2 + span); x.strokeStyle = f.c === 'twin' ? 'rgba(90,140,220,.6)' : 'rgba(210,59,44,.7)'; x.lineWidth = 5 * K; x.stroke(); x.restore(); }
    else if (f.k === 'bolt') { x.save(); x.globalAlpha = f.t * 4; x.beginPath(); let px = sx, py = sy - 260 * K; x.moveTo(px, py); for (let i = 1; i <= 7; i++) { px = sx + (Math.sin(i * 7.3 + f.seed * 20) * 10) * K; py = sy - 260 * K + i * 260 / 7 * K; x.lineTo(px, py); } x.strokeStyle = f.evo ? '#fff' : '#fff6b0'; x.lineWidth = (f.evo ? 6 : 4) * K; x.stroke(); x.strokeStyle = '#ffd34d'; x.lineWidth = 1.5 * K; x.stroke(); x.beginPath(); x.arc(sx, sy, f.r * K, 0, TAU); x.fillStyle = 'rgba(255,240,150,.35)'; x.fill(); x.restore(); }
    else if (f.k === 'pop') { x.beginPath(); x.arc(sx, sy, f.r * K * (1.6 - f.t * 2), 0, TAU); x.strokeStyle = f.c; x.globalAlpha = f.t * 3; x.lineWidth = 2 * K; x.stroke(); x.globalAlpha = 1; }
    else if (f.k === 'ring') { x.beginPath(); x.arc(sx, sy, f.r * K * (1.2 - f.t), 0, TAU); x.strokeStyle = f.c; x.globalAlpha = f.t * 2; x.lineWidth = 6 * K; x.stroke(); x.globalAlpha = 1; }
    else if (f.k === 'boom') { x.beginPath(); x.arc(sx, sy, f.r * K * (1.3 - f.t * 1.5), 0, TAU); x.fillStyle = `rgba(127,216,255,${f.t * 1.6})`; x.fill(); }
    else if (f.k === 'blast') { const c = (PCOL[f.c] || PCOL.fire2)[1]; x.beginPath(); x.arc(sx, sy, f.r * K * (1.2 - f.t), 0, TAU); x.fillStyle = c; x.globalAlpha = f.t * 2; x.fill(); x.globalAlpha = 1; }
    else if (f.k === 'rock') {
      // 지진: 바닥이 갈라지고 바위가 솟았다가 가라앉음 (아이콘과 같은 바위 그림)
      const life = 0.45, k = 1 - f.t / life, up = k < 0.35 ? k / 0.35 : 1, fade = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1, r = f.r * K;
      x.save(); x.globalAlpha = fade;
      x.beginPath(); x.ellipse(sx, sy + r * 0.15, r * (0.8 + 0.4 * up), r * 0.45 * (0.8 + 0.4 * up), 0, 0, TAU); x.fillStyle = 'rgba(40,28,20,.45)'; x.fill();
      x.strokeStyle = 'rgba(27,20,35,.8)'; x.lineWidth = 1.6;
      for (let i = 0; i < 5; i++) { const a = i * 1.26 + f.x * 0.1; x.beginPath(); x.moveTo(sx, sy + r * 0.15); x.lineTo(sx + Math.cos(a) * r * 1.1, sy + r * 0.15 + Math.sin(a) * r * 0.55); x.stroke(); }
      const im = A.img('icon_quake'), s = r * 1.9 * (f.evo ? 1.25 : 1);
      if (im) { x.save(); x.beginPath(); x.rect(sx - s, sy - s * 1.2, s * 2, s * 1.2 + r * 0.25); x.clip(); x.drawImage(im, sx - s / 2, sy + r * 0.2 - s * up, s, s); x.restore(); }
      else { for (let i = 0; i < 4; i++) { const rx = sx + (i - 1.5) * r * 0.35; x.beginPath(); x.moveTo(rx - 6 * K, sy + 4 * K); x.lineTo(rx, sy - 14 * K * up); x.lineTo(rx + 6 * K, sy + 4 * K); x.closePath(); x.fillStyle = '#9a8a76'; x.fill(); x.stroke(); } }
      if (k < 0.5) { x.globalAlpha = (0.5 - k) * 1.6; for (let i = 0; i < 6; i++) { const a = i * 1.05 + f.y, d = r * (0.6 + k * 1.6); x.beginPath(); x.arc(sx + Math.cos(a) * d, sy + Math.sin(a) * d * 0.5, 2.6 * K, 0, TAU); x.fillStyle = '#b9a789'; x.fill(); } }
      x.restore();
    }
  }
  // 조이스틱
  if (JOY.on) { const r = $('#app').getBoundingClientRect(); const bx = JOY.bx - r.left, by = JOY.by - r.top; x.beginPath(); x.arc(bx, by, 46, 0, TAU); x.fillStyle = 'rgba(255,255,255,.08)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 2; x.stroke(); x.beginPath(); x.arc(bx + JOY.x * 46, by + JOY.y * 46, 20, 0, TAU); x.fillStyle = 'rgba(255,255,255,.35)'; x.fill(); }
  // 체력 낮음 경고
  if (p.hp / p.maxhp < 0.3) { const gr = x.createRadialGradient(cx, cy, Math.min(W, H) * 0.35, cx, cy, Math.max(W, H) * 0.7); gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(255,0,0,${0.25 + 0.1 * Math.sin(S.t * 6)})`); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
}
// o: { dx, dy 위치 밀기 · sx, sy 늘이기/찌그러뜨리기(발밑 기준) }
function drawSpr(sp, sx, sy, face, shake, tilt, o) {
  const s = sp.sz * K, x = ctx;
  if (shake) sx += Math.sin(S.t * 60) * 1.5;
  const scx = (o && o.sx) || 1, scy = (o && o.sy) || 1; if (o) { sx += o.dx || 0; sy += o.dy || 0; }
  if (face < 0 || tilt || scx !== 1 || scy !== 1) { const fy = s * 0.42; x.save(); x.translate(sx, sy + fy); if (tilt) x.rotate(tilt); x.scale(face < 0 ? -scx : scx, scy); x.drawImage(sp.cv, -s / 2, -s / 2 - fy, s, s); x.restore(); }
  else x.drawImage(sp.cv, sx - s / 2, sy - s / 2, s, s);
}
/* 주인공 공격 동작: 뒤로 살짝 당겼다가 공격 방향으로 내지름 / 술법은 떠올랐다 내려옴 / 지진은 뛰어올라 내려찍음 */
function heroPose(p) {
  const o = { dx: 0, dy: 0, sx: 1, sy: 1 }; let face = p.face, tilt = p.moving ? Math.sin(S.t * 12) * 0.05 : 0, glow = 0;
  const q = p.atk; if (!q) return { o, face, tilt, glow };
  const k = 1 - q.t / q.t0, ca = Math.cos(q.a), sa = Math.sin(q.a);
  if (q.k === 'swing' || q.k === 'throw') {
    if (Math.abs(ca) > 0.15) face = ca > 0 ? 1 : -1;
    const ph = k < 0.25 ? -k / 0.25 * 0.4 : k < 0.5 ? -0.4 + (k - 0.25) / 0.25 * 1.4 : 1 - (k - 0.5) / 0.5;
    const amt = q.k === 'swing' ? 8 : 4;
    o.dx = ca * amt * ph * K; o.dy = sa * amt * ph * K * 0.6;
    tilt += face * ph * (q.k === 'swing' ? 0.35 : 0.16);
    o.sx = 1 + 0.13 * Math.max(0, ph); o.sy = 1 - 0.09 * Math.max(0, ph) + 0.05 * Math.max(0, -ph);
  } else if (q.k === 'cast') {
    const h = Math.sin(k * Math.PI); o.dy = -5 * h * K; o.sx = 1 - 0.06 * h; o.sy = 1 + 0.1 * h; glow = h;
  } else {   // stomp
    if (k < 0.45) { const h = k / 0.45; o.dy = -9 * Math.sin(h * Math.PI / 2) * K; o.sx = 1 - 0.08 * h; o.sy = 1 + 0.12 * h; }
    else { const h = 1 - (k - 0.45) / 0.55; o.sx = 1 + 0.22 * h; o.sy = 1 - 0.2 * h; glow = h * 0.6; }
  }
  return { o, face, tilt, glow };
}
/* 몬스터: 걸을 때 통통 뛰기 · 물 때 달려듦 · 맞으면 움찔 · 보스는 공격할 때 몸을 일으킴 */
function mobPose(e) {
  const o = { dx: 0, dy: 0, sx: 1, sy: 1 }; let tilt = e.stun > 0 ? 0.25 : 0;
  if (e.ai !== 'fly' && !e.boss) { const hop = Math.abs(Math.sin(S.t * 9 + e.id * 1.7)); o.dy = -hop * 2.5 * K; o.sx = 1 + 0.07 * (1 - hop); o.sy = 1 - 0.07 * (1 - hop); }
  else if (e.ai === 'fly') o.dy = (Math.sin(S.t * 6 + e.id) * 3 - 4) * K;
  else { const br = Math.sin(S.t * 3 + e.id); o.sx = 1 + 0.025 * br; o.sy = 1 - 0.025 * br; }
  if (e.bite > 0) { const ph = Math.sin((1 - e.bite / 0.28) * Math.PI); o.dx += Math.cos(e.ba) * 7 * ph * K; o.dy += Math.sin(e.ba) * 5 * ph * K; o.sx += 0.16 * ph; o.sy -= 0.1 * ph; tilt += (e.face || 1) * 0.28 * ph; }
  if (e.cast > 0) { const ph = Math.sin((1 - e.cast / 0.35) * Math.PI); o.dy -= 7 * ph * K; o.sy += 0.1 * ph; o.sx -= 0.05 * ph; }
  if (e.flash > 0) { o.sx += 0.1; o.sy -= 0.1; }
  return { o, tilt };
}

const setCoin = () => document.documentElement.style.setProperty('--coin', `url(${A.drop('coin').toDataURL()})`);
setCoin();
A.loadImages('img/', () => { setCoin(); if (!$('#s-menu').classList.contains('hide')) renderMenu(); if (!$('#s-select').classList.contains('hide')) renderSelect(); });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
go('menu');
window.__toema = { get S() { return S; }, SV: () => SV, go, startRun, cloudOnAuth, pushCloud, pullCloud, resetCloud: () => { cloudUid = null; } };
})();
