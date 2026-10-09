/* 퇴마 서바이버(가제) — 화면·조작·흐름 */
(function () {
'use strict';
const D = window.DATA, C = window.CORE, A = window.ART, RK = window.RANK;
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const TAU = Math.PI * 2, hyp = Math.hypot;

/* ───── 저장 ───── */
const SKEY = 'toema_save_v1';
function blank() { return { gold: 0, meta: {}, clear: {}, best: {}, hero: 'daesung', ch: 1, snd: true, vib: true, adfree: false, runs: 0 }; }
let SV = blank();
try { const s = JSON.parse(localStorage.getItem(SKEY)); if (s) SV = Object.assign(blank(), s); } catch (e) {}
const save = () => { try { localStorage.setItem(SKEY, JSON.stringify(SV)); } catch (e) {} };

/* ───── 효과음(간단 합성) ───── */
const SND = (() => {
  let ac = null, last = {};
  const ctx = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } return ac; };
  const tone = (f, d, type = 'square', v = 0.05, slide = 0) => { const a = ctx(); if (!a) return; const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.setValueAtTime(f, a.currentTime); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), a.currentTime + d); g.gain.setValueAtTime(v, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + d); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + d + 0.02); };
  const P = {
    swing: () => tone(320, 0.08, 'triangle', 0.03, -200), throw: () => tone(900, 0.05, 'triangle', 0.02, 300), thunder: () => tone(120, 0.25, 'sawtooth', 0.05, -80), wind: () => tone(500, 0.15, 'sine', 0.025, -300),
    coin: () => tone(1300, 0.06, 'square', 0.02), heal: () => { tone(600, 0.1, 'sine', 0.05, 300); }, magnet: () => tone(400, 0.3, 'sine', 0.05, 600),
    level: () => { tone(523, 0.08, 'square', 0.04); setTimeout(() => tone(784, 0.12, 'square', 0.04), 80); }, hurt: () => tone(160, 0.1, 'sawtooth', 0.05, -60),
    boss: () => { tone(110, 0.5, 'sawtooth', 0.07, -40); setTimeout(() => tone(98, 0.6, 'sawtooth', 0.07, -40), 300); }, chest: () => { tone(660, 0.1, 'triangle', 0.05); setTimeout(() => tone(990, 0.15, 'triangle', 0.05), 90); },
    clear: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'square', 0.05), i * 110)), dead: () => tone(300, 0.6, 'sawtooth', 0.06, -250), click: () => tone(700, 0.04, 'square', 0.02),
  };
  return { play(k) { if (!SV.snd) return; const n = performance.now(); if (last[k] && n - last[k] < 70) return; last[k] = n; try { P[k] && P[k](); } catch (e) {} }, unlock() { const a = ctx(); if (a && a.state === 'suspended') a.resume(); } };
})();
const vib = ms => { if (SV.vib && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} };

/* ───── 화면 전환 ───── */
const SCR = ['menu', 'select', 'shop', 'rank', 'settings'];
function go(name) {
  SND.play('click');
  for (const s of SCR) $('#s-' + s).classList.toggle('hide', s !== name);
  $$('.goldv').forEach(e => e.textContent = SV.gold); $('#mgold').textContent = SV.gold;
  if (name === 'select') renderSelect();
  if (name === 'shop') renderShop();
  if (name === 'rank') renderRank();
  if (name === 'settings') renderSettings();
  if (name === 'menu') drawMenuArt();
}
$$('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

function drawMenuArt() {
  const c = $('#menuart'), dpr = Math.min(2, window.devicePixelRatio || 1); c.width = 300 * dpr; c.height = 130 * dpr;
  const x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, 300, 130);
  const put = (cv, cx, cy, s) => x.drawImage(cv, cx - s / 2, cy - s / 2, s, s);
  put(A.bossPortrait('fox', 130), 150, 60, 130);
  put(A.portrait('daesung', 80), 70, 82, 80); put(A.portrait('uchi', 80), 232, 82, 80);
}

/* ───── 출전 준비 ───── */
function renderSelect() {
  const H = $('#heroes'); H.innerHTML = '';
  for (const id in D.HEROES) {
    const h = D.HEROES[id], d = document.createElement('button'); d.className = 'hero' + (SV.hero === id ? ' on' : '');
    d.innerHTML = `<div class="cls">${h.cls}</div><b>${h.name}</b><p>${h.desc}</p><div class="stats">체력 ${h.hp} · 방어 ${h.armor} · 속도 ${h.speed}</div>`;
    const cv = A.portrait(id, 84); cv.style.width = '84px'; cv.style.height = '84px'; d.insertBefore(cv, d.children[1]);
    d.onclick = () => { SV.hero = id; save(); SND.play('click'); renderSelect(); };
    H.appendChild(d);
  }
  const CH = $('#chs'); CH.innerHTML = '';
  for (const ch of D.CHAPTERS) {
    const locked = ch.id > 1 && !SV.clear[ch.id - 1];
    const b = SV.best[ch.id];
    const d = document.createElement('button'); d.className = 'ch' + (SV.ch === ch.id ? ' on' : ''); if (locked) d.disabled = true;
    d.innerHTML = `<div class="n">${ch.id}</div><div><b>${ch.name}</b><small>${locked ? '🔒 ' + (ch.id - 1) + '장을 클리어하면 열려요' : ch.sub}</small></div><div class="best">${b ? (SV.clear[ch.id] ? '클리어 ✔<br>' : '') + '최고 ' + b.score.toLocaleString() : ''}</div>`;
    d.onclick = () => { if (locked) return; SV.ch = ch.id; save(); SND.play('click'); renderSelect(); };
    CH.appendChild(d);
  }
  if (SV.ch > 1 && !SV.clear[SV.ch - 1]) SV.ch = 1;
}
$('#gobtn').onclick = () => startRun();

/* ───── 강화 ───── */
function renderShop() {
  const box = $('#shop'); box.innerHTML = '';
  for (const id in D.META) {
    const m = D.META[id], lv = SV.meta[id] || 0, max = lv >= m.max, cost = max ? 0 : m.cost[lv];
    const d = document.createElement('div'); d.className = 'up';
    d.innerHTML = `<div class="nm"><b>${m.name}</b><small>${m.desc} · 현재 ${lv}/${m.max}</small><div class="pips">${Array.from({ length: m.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div></div>`;
    const b = document.createElement('button'); b.className = 'btn ' + (max ? '' : 'gold'); b.disabled = max || SV.gold < cost;
    b.innerHTML = max ? '최대' : `<span class="coins" style="color:inherit"><i></i>${cost}</span>`;
    b.onclick = () => { if (SV.gold < cost || max) return; SV.gold -= cost; SV.meta[id] = lv + 1; save(); SND.play('chest'); renderShop(); $$('.goldv').forEach(e => e.textContent = SV.gold); };
    d.appendChild(b); box.appendChild(d);
  }
}

/* ───── 설정 ───── */
function renderSettings() { $('#sndbtn').textContent = '효과음: ' + (SV.snd ? '켜짐' : '꺼짐'); $('#vibbtn').textContent = '진동: ' + (SV.vib ? '켜짐' : '꺼짐'); }
$('#sndbtn').onclick = () => { SV.snd = !SV.snd; save(); renderSettings(); };
$('#vibbtn').onclick = () => { SV.vib = !SV.vib; save(); renderSettings(); };
$('#adfree').onclick = () => toast('스토어 출시 후 구매할 수 있어요');
$('#resetbtn').onclick = () => { if (confirm('금화·강화·기록이 모두 지워져요. 초기화할까요?')) { SV = blank(); save(); go('menu'); } };

/* ───── 랭킹 화면 ───── */
let rkCh = 1;
$$('#rktabs button').forEach(b => b.onclick = () => { rkCh = +b.dataset.ch; $$('#rktabs button').forEach(x => x.classList.toggle('on', x === b)); renderRank(); });
async function renderRank() {
  const me = $('#rkme'), list = $('#rklist'), st = RK.state();
  const local = SV.best[rkCh];
  $('#rkuser').textContent = st.user ? st.nick : '';
  let meHtml = `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><div class="small">내 최고 기록 (이 기기)</div><b style="font-size:20px">${local ? local.score.toLocaleString() : '-'}</b></div>`;
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
  const ch = rkCh;
  const [rows, mine] = await Promise.all([RK.board(ch), st.user ? RK.mine(ch) : null]);
  if (ch !== rkCh) return;
  if (st.user && $('#rkmine')) $('#rkmine').innerHTML = mine && mine.score ? `서버 최고 <b>${mine.score.toLocaleString()}</b> · 전체 <b>${mine.rank}</b>위 / ${mine.total}명` : '아직 서버에 기록이 없어요. 한 판 하면 올라가요.';
  if (!rows) { list.innerHTML = '<div class="small" style="text-align:center;padding:20px">랭킹을 불러오지 못했어요</div>'; return; }
  if (!rows.length) { list.innerHTML = '<div class="small" style="text-align:center;padding:20px">아직 기록이 없어요. 첫 번째 주인공이 되어 보세요!</div>'; return; }
  list.innerHTML = rows.map((r, i) => `<div class="r ${st.user && r.uid === st.user.id ? 'me' : ''}"><div class="no">${i + 1}</div><div class="nk">${esc(r.nick)}<span class="mini">${D.HEROES[r.hero] ? D.HEROES[r.hero].name : ''}${r.cleared ? ' · 클리어' : ''} · ${fmt(r.t)}</span></div><div class="sc">${r.score.toLocaleString()}</div></div>`).join('');
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function openNick() { $('#nickin').value = RK.state().nick || ''; $('#nickmsg').textContent = ''; $('#m-nick').classList.remove('hide'); }
$('#nickcancel').onclick = () => $('#m-nick').classList.add('hide');
$('#nicksave').onclick = async () => { const r = await RK.setNick($('#nickin').value); if (r.ok) { $('#m-nick').classList.add('hide'); renderRank(); } else $('#nickmsg').textContent = r.msg; };
RK.init(() => { if (!$('#s-rank').classList.contains('hide')) renderRank(); if (RK.state().askNick) { RK.state().askNick = false; openNick(); } });

/* ───── 게임 ───── */
const cv = $('#cv'), ctx = cv.getContext('2d');
let lowQ = false, slowT = 0;
let S = null, W = 0, H = 0, K = 1, DPR = 1, runId = null, running = false, last = 0, hudT = 0, runMeta = null;
function resize() {
  const r = $('#app').getBoundingClientRect(); DPR = Math.min(lowQ ? 1 : 1.5, window.devicePixelRatio || 1);
  W = r.width; H = r.height; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  K = Math.max(0.8, Math.min(2.2, Math.sqrt(W * H / (340 * 660))));
  A.setDpr(DPR * K);
}
window.addEventListener('resize', resize); resize();

/* 조작: 화면 어디든 누르고 끌기 */
const JOY = { on: false, bx: 0, by: 0, x: 0, y: 0, id: null }, KEYS = {};
cv.addEventListener('pointerdown', e => { SND.unlock(); if (!running) return; JOY.on = true; JOY.id = e.pointerId; JOY.bx = JOY.cx = e.clientX; JOY.by = JOY.cy = e.clientY; JOY.x = JOY.y = 0; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
cv.addEventListener('pointermove', e => { if (!JOY.on || e.pointerId !== JOY.id) return; let dx = e.clientX - JOY.bx, dy = e.clientY - JOY.by; const d = hyp(dx, dy), R = 46; if (d > R) { JOY.bx += dx - dx / d * R; JOY.by += dy - dy / d * R; dx = e.clientX - JOY.bx; dy = e.clientY - JOY.by; } JOY.cx = e.clientX; JOY.cy = e.clientY; JOY.x = dx / R; JOY.y = dy / R; });
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

async function startRun() {
  SND.unlock();
  for (const s of SCR) $('#s-' + s).classList.add('hide');
  runMeta = Object.assign({}, SV.meta);
  S = C.newRun({ hero: SV.hero, chapter: SV.ch, meta: runMeta, viewR: 420 });
  S.revivable = true; S.goldDoubled = false;
  $('#hud').classList.remove('hide'); $('#bossbar').classList.add('hide');
  running = true; last = performance.now(); paused = false; slotSig = '';
  SV.runs++; save();
  banner(S.ch.name, '살아남아 우두머리를 쓰러뜨려라');
  runId = null; RK.start(SV.ch, SV.hero).then(id => { runId = id; });
  requestAnimationFrame(loop);
}
let paused = false, modal = null;
function pause() { if (!S || S.over || modal) return; paused = true; $('#pinfo').textContent = `${S.ch.name} · ${fmt(S.t)} · Lv ${S.lv}`; $('#sndbtn2').textContent = '효과음: ' + (SV.snd ? '켜짐' : '꺼짐'); $('#m-pause').classList.remove('hide'); modal = 'pause'; }
$('#pausebtn').onclick = pause;
$('#resume').onclick = () => { $('#m-pause').classList.add('hide'); modal = null; paused = false; last = performance.now(); };
$('#sndbtn2').onclick = () => { SV.snd = !SV.snd; save(); $('#sndbtn2').textContent = '효과음: ' + (SV.snd ? '켜짐' : '꺼짐'); };
$('#giveup').onclick = () => { $('#m-pause').classList.add('hide'); modal = null; paused = false; S.over = 'quit'; finish(); };
document.addEventListener('visibilitychange', () => { if (document.hidden && running) pause(); });

function loop(now) {
  if (!running) return;
  const raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now;
  // 느린 기기면 자동으로 해상도를 낮춰요
  if (!lowQ && !paused && !modal && raw < 0.5) { slowT = raw > 0.026 ? slowT + raw : Math.max(0, slowT - raw * 0.5); if (slowT > 2.5) { lowQ = true; resize(); } }
  if (!paused && !modal) {
    S.viewR = hyp(W, H) / 2 / K + 30;
    C.step(S, dt, input());
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
    else if (e.k === 'boss') { SND.play('boss'); vib([60, 40, 60]); banner(e.name, e.final ? '최종 우두머리 · 결계에 갇혔다!' : '우두머리 출현 · 결계에 갇혔다!'); $('#bossname').textContent = e.name; $('#bossbar').classList.remove('hide'); }
    else if (e.k === 'bossdown') { toast(e.name + ' 퇴치!'); $('#bossbar').classList.add('hide'); }
    else if (e.k === 'clear') { SND.play('clear'); $('#bossbar').classList.add('hide'); }
    else if (e.k === 'dead') { SND.play('dead'); vib(200); }
  }
  S.ev.length = 0;
  if (S.over === 'dead') { if (S.revivable && !S.revived) { modal = 'dead'; $('#m-dead').classList.remove('hide'); } else finish(); return; }
  if (S.over === 'clear') { if (!S.clearAt) S.clearAt = performance.now(); else if (performance.now() - S.clearAt > 1400) finish(); return; }
  if (S.chests > 0 || S.pendingLv > 0) openLevel();
}
function openLevel() {
  modal = 'lvl'; const chest = S.chests > 0;
  $('#lvtitle').textContent = chest ? '보물 상자!' : '레벨 업!'; $('#lvsub').textContent = chest ? '상자에서 하나를 고르세요' : `Lv ${S.lv - S.pendingLv + 1} · 하나를 고르세요`;
  const ops = C.choices(S); const box = $('#opts'); box.innerHTML = '';
  for (const o of ops) {
    const b = document.createElement('button'); b.className = 'opt';
    const lvTxt = o.kind === 'w' || o.kind === 'p' ? (o.lv === 1 ? '<span class="new">NEW</span>' : `<span class="lv">Lv ${o.lv}</span>`) : '';
    b.innerHTML = `<img src="${A.iconURL(o.icon, 46)}" alt=""><div><b>${o.name}</b>${lvTxt}<p>${o.desc}</p></div>`;
    b.onclick = () => { C.pick(S, o); SND.play('click'); $('#m-lvl').classList.add('hide'); modal = null; last = performance.now(); slotSig = ''; if (S.chests > 0 || S.pendingLv > 0) openLevel(); };
    box.appendChild(b);
  }
  const rb = $('#rerollbtn');
  rb.textContent = S.rerolls > 0 ? `다시 뽑기 (${S.rerolls}회 남음)` : '▶ 광고 보고 다시 뽑기';
  rb.onclick = () => { if (S.rerolls > 0) { S.rerolls--; openLevel(); } else showAd(() => openLevel()); };
  $('#m-lvl').classList.remove('hide');
}
$('#revive').onclick = () => showAd(() => { $('#m-dead').classList.add('hide'); modal = null; C.revive(S); last = performance.now(); toast('다시 일어섰다!'); });
$('#nodead').onclick = () => { $('#m-dead').classList.add('hide'); modal = null; S.revivable = false; finish(); };

function showAd(done) {
  if (SV.adfree) return done();
  const ov = $('#adov'); ov.classList.remove('hide'); let n = 3; $('#adcount').textContent = n;
  const iv = setInterval(() => { n--; $('#adcount').textContent = n; if (n <= 0) { clearInterval(iv); ov.classList.add('hide'); done(); } }, 1000);
}

async function finish() {
  running = false; $('#hud').classList.add('hide');
  const r = C.result(S), ch = S.ch.id, cleared = r.cleared;
  SV.gold += r.gold;
  const prev = SV.best[ch];
  if (!prev || r.score > prev.score) SV.best[ch] = { score: r.score, t: r.t, kills: r.kills, hero: S.heroId, cleared };
  if (cleared) SV.clear[ch] = true;
  save();
  $('#restitle').textContent = cleared ? '퇴마 성공!' : S.over === 'quit' ? '후퇴' : '퇴마 실패';
  $('#restitle').style.color = cleared ? '' : '#ff8a7a';
  $('#ressub').textContent = `${S.ch.id}장 ${S.ch.name} · ${D.HEROES[S.heroId].name}` + (cleared && ch < D.CHAPTERS.length && !prev?.cleared ? ` · ${ch + 1}장이 열렸어요!` : '');
  $('#resgrid').innerHTML = [['생존 시간', fmt(r.t)], ['처치', r.kills.toLocaleString()], ['레벨', r.lv], ['획득 금화', `<span id="rgold">${r.gold}</span>`], ['점수', r.score.toLocaleString()], ['내 최고', SV.best[ch].score.toLocaleString()]].map(([a, b]) => `<div><small>${a}</small><b>${b}</b></div>`).join('');
  const dbl = $('#dbl'); dbl.disabled = r.gold <= 0; dbl.textContent = '▶ 광고 보고 금화 2배';
  dbl.onclick = () => { if (S.goldDoubled) return; showAd(() => { S.goldDoubled = true; SV.gold += r.gold; save(); $('#rgold').textContent = r.gold * 2; dbl.disabled = true; dbl.textContent = '금화 2배 받음'; }); };
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
  $('#timer').textContent = fmt(S.t);
  $('#hkills').textContent = '☠ ' + S.kills.toLocaleString();
  $('#hgold span').textContent = S.gold;
  if (S.boss) $('#bossfill').style.width = Math.max(0, S.boss.hp / S.boss.max * 100) + '%';
  const sig = S.W.map(w => w.id + w.lv).join() + '|' + Object.entries(S.P).join();
  if (sig !== slotSig) {
    slotSig = sig;
    $('#slw').innerHTML = S.W.map(w => `<img src="${A.iconURL(D.WEAPONS[w.id].icon, 26)}" title="${D.WEAPONS[w.id].name} ${w.lv}">`).join('');
    $('#slp').innerHTML = Object.keys(S.P).map(k => `<img src="${A.iconURL(D.PASSIVES[k].icon, 26)}">`).join('');
  }
}
const fmt = t => { t = Math.floor(t); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
let toastT = 0;
function toast(t) { const el = $('#toast'); el.textContent = t; el.style.opacity = 1; clearTimeout(toastT); toastT = setTimeout(() => el.style.opacity = 0, 1600); }
function banner(a, b) { $('#banner').innerHTML = `<div class="in"><b>${esc(a)}</b><small>${esc(b)}</small></div>`; }

/* ───── 그리기 ───── */
function render() {
  const x = ctx, p = S.p;
  x.setTransform(DPR, 0, 0, DPR, 0, 0);
  const cx = W / 2, cy = H / 2;
  const wx = X => (X - p.x) * K + cx, wy = Y => (Y - p.y) * K + cy;
  // 바닥
  const g = A.ground(S.ch), T = 256 * K;
  const ox = -((p.x * K) % T) + cx % T - T, oy = -((p.y * K) % T) + cy % T - T;
  for (let a = ox - T; a < W + T; a += T) for (let b = oy - T; b < H + T; b += T) x.drawImage(g, a, b, T, T);
  // 결계 밖 어둡게
  if (S.arena) {
    const A0 = S.arena, ax = wx(A0.x), ay = wy(A0.y), ar = A0.r * K;
    x.save(); x.beginPath(); x.rect(0, 0, W, H); x.arc(ax, ay, ar, 0, TAU, true); x.fillStyle = 'rgba(10,0,10,.55)'; x.fill(); x.restore();
    x.save(); x.setLineDash([10 * K, 8 * K]); x.lineDashOffset = -S.t * 30; x.beginPath(); x.arc(ax, ay, ar, 0, TAU); x.strokeStyle = 'rgba(242,193,78,.9)'; x.lineWidth = 4 * K; x.stroke(); x.restore();
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + S.t * 0.1; const px = ax + Math.cos(a) * ar, py = ay + Math.sin(a) * ar; x.fillStyle = '#f6e27a'; x.fillRect(px - 4 * K, py - 7 * K, 8 * K, 14 * K); x.fillStyle = '#d0342c'; x.fillRect(px - 0.8 * K, py - 5 * K, 1.6 * K, 10 * K); }
  }
  // 예고 표시
  for (const t of S.tele) {
    x.save(); x.globalAlpha = 0.35 + 0.2 * Math.sin(S.t * 20);
    if (t.k === 'circle') { x.beginPath(); x.arc(wx(t.x), wy(t.y), t.r * K, 0, TAU); x.fillStyle = 'rgba(255,40,40,.35)'; x.fill(); x.strokeStyle = '#ff5050'; x.lineWidth = 2; x.stroke(); }
    else { x.translate(wx(t.x), wy(t.y)); x.rotate(t.a); x.fillStyle = 'rgba(255,40,40,.4)'; x.fillRect(0, -t.w / 2 * K, t.len * K, t.w * K); }
    x.restore();
  }
  // 영혼 구슬
  for (const gm of S.gems) {
    const sx = wx(gm.x), sy = wy(gm.y); if (sx < -20 || sy < -20 || sx > W + 20 || sy > H + 20) continue;
    const col = gm.v >= 10 ? '#ff5a6e' : gm.v >= 2 ? '#6ee7a0' : '#6ecbff', r = (gm.v >= 10 ? 6 : gm.v >= 2 ? 4.6 : 3.6) * K;
    x.beginPath(); x.arc(sx, sy, r * 1.9, 0, TAU); x.fillStyle = col + '33'; x.fill();
    x.beginPath(); x.arc(sx, sy, r, 0, TAU); x.fillStyle = col; x.fill(); x.beginPath(); x.arc(sx - r * .3, sy - r * .3, r * .35, 0, TAU); x.fillStyle = '#fff'; x.fill();
  }
  for (const o of S.drops) { const sx = wx(o.x), sy = wy(o.y) + Math.sin(S.t * 4 + o.x) * 2 * K; x.drawImage(A.drop(o.k), sx - 16 * K, sy - 16 * K, 32 * K, 32 * K); }
  // 금강결계
  const aura = S.W.find(w => w.id === 'aura');
  if (aura) { const s = D.WEAPONS.aura.lv[aura.lv - 1], r = s.r * K; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fillStyle = 'rgba(255,214,102,.10)'; x.fill(); x.save(); x.setLineDash([6 * K, 6 * K]); x.lineDashOffset = S.t * 20; x.strokeStyle = 'rgba(255,214,102,.5)'; x.lineWidth = 2 * K; x.stroke(); x.restore(); }
  // 그림자 + 캐릭터(위→아래 순)
  const list = [];
  for (const e of S.en) { if (e.dead) continue; const sx = wx(e.x), sy = wy(e.y); if (sx < -80 || sy < -80 || sx > W + 80 || sy > H + 80) continue; list.push(e); }
  list.push(p); list.sort((a, b) => a.y - b.y);
  for (const e of list) {
    const sx = wx(e.x), sy = wy(e.y), rr = (e.r || 12) * K;
    const sh = A.shadow(Math.round(e.r || 12)); x.drawImage(sh, sx - rr, sy + rr * 0.42, rr * 2, rr * 0.76);
    if (e === p) {
      const fr = p.moving ? Math.floor(S.t * 8) % 2 : 0, sp = A.sprite(S.heroId, fr, p.hurt > 0 && Math.floor(S.t * 30) % 2 === 0);
      const bob = p.moving ? Math.abs(Math.sin(S.t * 12)) * 2 * K : 0;
      drawSpr(sp, sx, sy - bob, p.face);
      const bw = 34 * K; x.fillStyle = '#000a'; x.fillRect(sx - bw / 2, sy + 18 * K, bw, 5 * K); x.fillStyle = p.hp / p.maxhp < 0.3 ? '#ff5a4a' : '#5fe08a'; x.fillRect(sx - bw / 2 + 1, sy + 18 * K + 1, (bw - 2) * Math.max(0, p.hp / p.maxhp), 5 * K - 2);
    } else if (e.seg) {
      const i = e.par.segs.indexOf(e); const sp = A.seg(Math.min(13, i), e.flash > 0); x.drawImage(sp.cv, sx - sp.sz / 2 * K, sy - sp.sz / 2 * K, sp.sz * K, sp.sz * K);
    } else {
      const fr = Math.floor(S.t * (e.boss ? 4 : 7) + e.id) % 2, sp = A.sprite(e.boss ? e.kind : e.type, fr, e.flash > 0);
      if (e.boss && e.kind === 'imugi') { x.save(); x.translate(sx, sy); x.rotate(e.ang); x.drawImage(sp.cv, -sp.sz / 2 * K, -sp.sz / 2 * K, sp.sz * K, sp.sz * K); x.restore(); }
      else drawSpr(sp, sx, sy, e.face, e.ai === 'charge' && e.st === 1 ? 1 : 0);
      if (e.elite && !e.boss) { const bw = 30 * K; x.fillStyle = '#000a'; x.fillRect(sx - bw / 2, sy - rr - 10 * K, bw, 4 * K); x.fillStyle = '#ffb04a'; x.fillRect(sx - bw / 2, sy - rr - 10 * K, bw * e.hp / e.max, 4 * K); }
    }
  }
  // 염주
  for (const w of S.W) if (w.id === 'beads' && w.pos) for (const [bx, by] of w.pos) { const sx = wx(bx), sy = wy(by); x.beginPath(); x.arc(sx, sy, 6 * K, 0, TAU); x.fillStyle = '#b07a3e'; x.fill(); x.lineWidth = 1.5; x.strokeStyle = '#1b1423'; x.stroke(); x.beginPath(); x.arc(sx - 2 * K, sy - 2 * K, 2 * K, 0, TAU); x.fillStyle = '#ffe2b0'; x.fill(); }
  // 내 공격체
  for (const q of S.pr) {
    const sx = wx(q.x), sy = wy(q.y);
    x.save(); x.translate(sx, sy); x.rotate(q.a);
    if (q.k === 'tal') { x.fillStyle = '#f6e27a'; x.strokeStyle = '#1b1423'; x.lineWidth = 1.2; x.fillRect(-9 * K, -5 * K, 18 * K, 10 * K); x.strokeRect(-9 * K, -5 * K, 18 * K, 10 * K); x.fillStyle = '#d0342c'; x.fillRect(-6 * K, -0.8 * K, 12 * K, 1.6 * K); }
    else { x.globalAlpha = Math.min(1, q.life * 2); x.beginPath(); x.arc(-10 * K, 0, q.w / 2 * K, -1.1, 1.1); x.strokeStyle = 'rgba(220,255,235,.85)'; x.lineWidth = 6 * K; x.stroke(); x.beginPath(); x.arc(-18 * K, 0, q.w / 2.4 * K, -1, 1); x.strokeStyle = 'rgba(160,240,190,.5)'; x.lineWidth = 3 * K; x.stroke(); }
    x.restore();
  }
  // 적 탄환
  for (const q of S.ep) {
    const sx = wx(q.x), sy = wy(q.y), r = q.r * K;
    const col = q.k === 'fire' ? ['#bfe9ff', '#3fa6ff'] : q.k === 'poison' ? ['#d6ff8a', '#4aa83a'] : q.k === 'spike' ? ['#e6edf2', '#6b7884'] : ['#ffffff', '#ffb04a'];
    x.beginPath(); x.arc(sx, sy, r * 1.8, 0, TAU); x.fillStyle = col[1] + '55'; x.fill();
    x.beginPath(); x.arc(sx, sy, r, 0, TAU); x.fillStyle = col[1]; x.fill(); x.beginPath(); x.arc(sx, sy, r * 0.5, 0, TAU); x.fillStyle = col[0]; x.fill();
  }
  // 효과
  x.textAlign = 'center';
  for (const f of S.fx) {
    const sx = wx(f.x), sy = wy(f.y);
    if (f.k === 'num') { x.font = `900 ${(f.big ? 15 : 12) * K}px sans-serif`; x.globalAlpha = Math.min(1, f.t * 3); x.lineWidth = 3; x.strokeStyle = '#000'; x.strokeText(f.v, sx, sy); x.fillStyle = f.big ? '#ffd36b' : '#fff'; x.fillText(f.v, sx, sy); x.globalAlpha = 1; }
    else if (f.k === 'swing') { const k = 1 - f.t / f.t0; x.save(); x.globalAlpha = 1 - k * 0.6; x.beginPath(); x.arc(sx, sy, f.r * K, f.a - f.arc / 2, f.a - f.arc / 2 + f.arc * Math.min(1, k * 1.6)); x.strokeStyle = 'rgba(255,220,140,.9)'; x.lineWidth = 9 * K; x.stroke(); x.beginPath(); x.arc(sx, sy, f.r * 0.7 * K, f.a - f.arc / 2, f.a - f.arc / 2 + f.arc * Math.min(1, k * 1.6)); x.strokeStyle = 'rgba(210,59,44,.7)'; x.lineWidth = 5 * K; x.stroke(); x.restore(); }
    else if (f.k === 'bolt') { x.save(); x.globalAlpha = f.t * 4; x.beginPath(); let px = sx, py = sy - 260 * K; x.moveTo(px, py); for (let i = 1; i <= 7; i++) { px = sx + (Math.sin(i * 7.3 + f.seed * 20) * 10) * K; py = sy - 260 * K + i * 260 / 7 * K; x.lineTo(px, py); } x.strokeStyle = '#fff6b0'; x.lineWidth = 4 * K; x.stroke(); x.strokeStyle = '#ffd34d'; x.lineWidth = 1.5 * K; x.stroke(); x.beginPath(); x.arc(sx, sy, f.r * K, 0, TAU); x.fillStyle = 'rgba(255,240,150,.35)'; x.fill(); x.restore(); }
    else if (f.k === 'pop') { x.beginPath(); x.arc(sx, sy, f.r * K * (1.6 - f.t * 2), 0, TAU); x.strokeStyle = f.c; x.globalAlpha = f.t * 3; x.lineWidth = 2 * K; x.stroke(); x.globalAlpha = 1; }
    else if (f.k === 'ring') { x.beginPath(); x.arc(sx, sy, f.r * K * (1.2 - f.t), 0, TAU); x.strokeStyle = f.c; x.globalAlpha = f.t * 2; x.lineWidth = 6 * K; x.stroke(); x.globalAlpha = 1; }
  }
  // 조이스틱
  if (JOY.on) { const r = $('#app').getBoundingClientRect(); const bx = JOY.bx - r.left, by = JOY.by - r.top; x.beginPath(); x.arc(bx, by, 46, 0, TAU); x.fillStyle = 'rgba(255,255,255,.08)'; x.fill(); x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 2; x.stroke(); x.beginPath(); x.arc(bx + JOY.x * 46, by + JOY.y * 46, 20, 0, TAU); x.fillStyle = 'rgba(255,255,255,.35)'; x.fill(); }
  // 체력 낮음 경고
  if (p.hp / p.maxhp < 0.3) { const gr = x.createRadialGradient(cx, cy, Math.min(W, H) * 0.35, cx, cy, Math.max(W, H) * 0.7); gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, `rgba(255,0,0,${0.25 + 0.1 * Math.sin(S.t * 6)})`); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
}
function drawSpr(sp, sx, sy, face, shake) {
  const s = sp.sz * K, x = ctx;
  if (shake) sx += Math.sin(S.t * 60) * 1.5;
  if (face < 0) { x.save(); x.translate(sx, sy); x.scale(-1, 1); x.drawImage(sp.cv, -s / 2, -s / 2, s, s); x.restore(); }
  else x.drawImage(sp.cv, sx - s / 2, sy - s / 2, s, s);
}

go('menu');
window.__toema = { get S() { return S; }, SV: () => SV, go, startRun };
})();
