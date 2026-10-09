/* 퇴마 서바이버(가제) — 코드로 그리는 그림. 모든 캐릭터·몬스터·아이콘은 여기서 그려서 캐시합니다. */
(function (G) {
const TAU = Math.PI * 2, OL = '#1b1423';
const A = {};
let DPR = 1;
A.setDpr = d => { DPR = d; cache.clear(); };
const cache = new Map();

function C(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w * DPR); c.height = Math.ceil(h * DPR); const x = c.getContext('2d'); x.scale(DPR, DPR); x.lineJoin = 'round'; x.lineCap = 'round'; return [c, x]; }
function ell(x, cx, cy, rx, ry, fill, stroke, lw = 2) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, TAU); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw; x.stroke(); } }
function path(x, pts, fill, stroke, lw = 2, close = true) { x.beginPath(); x.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) x.lineTo(pts[i], pts[i + 1]); if (close) x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw; x.stroke(); } }
function line(x, a, b, c, d, col, lw) { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.strokeStyle = col; x.lineWidth = lw; x.stroke(); }
function eyes(x, cx, cy, gap, r, col = '#ff4a3d') { for (const s of [-1, 1]) { ell(x, cx + s * gap, cy, r + 1.2, r + 1.2, 'rgba(255,60,40,.35)'); ell(x, cx + s * gap, cy, r, r, col); } }

/* ───── 주인공 ───── */
function daesung(x, f) {
  const b = f ? 1 : 0;
  // 꼬리
  x.beginPath(); x.moveTo(-6, 6); x.bezierCurveTo(-16, 8, -18, -4, -12, -8); x.strokeStyle = OL; x.lineWidth = 5; x.stroke(); x.strokeStyle = '#b8742c'; x.lineWidth = 3; x.stroke();
  // 다리
  ell(x, -4, 12 - b, 3.5, 3, '#6b3d1e', OL, 1.5); ell(x, 5, 12 + b - 1, 3.5, 3, '#6b3d1e', OL, 1.5);
  // 몸(붉은 전포)
  path(x, [-8, 1, 8, 1, 9, 11, -9, 11], '#c8402c', OL, 2);
  path(x, [-8, 6, 9, 6, 9, 8, -8, 8], '#f2c14e');
  // 봉(등에 비스듬히)
  line(x, -12, 12, 12, -16, OL, 5); line(x, -12, 12, 12, -16, '#d23b2c', 3); ell(x, 12, -16, 2.6, 2.6, '#f2c14e', OL, 1.2); ell(x, -12, 12, 2.6, 2.6, '#f2c14e', OL, 1.2);
  // 머리
  ell(x, 0, -6, 10.5, 9.5, '#b8742c', OL, 2);
  ell(x, 0, -4.5, 7.5, 6.2, '#f3cf9e');
  ell(x, -3, -6, 1.5, 2, OL); ell(x, 3, -6, 1.5, 2, OL);
  ell(x, -2.6, -6.6, .5, .6, '#fff'); ell(x, 3.4, -6.6, .5, .6, '#fff');
  x.beginPath(); x.arc(0, -2.6, 2.2, 0.2, Math.PI - 0.2); x.strokeStyle = OL; x.lineWidth = 1.3; x.stroke();
  ell(x, -10.5, -6, 3, 3.4, '#f3cf9e', OL, 1.5); ell(x, 10.5, -6, 3, 3.4, '#f3cf9e', OL, 1.5);
  // 금테
  x.beginPath(); x.ellipse(0, -10, 10, 3.5, 0, Math.PI * 1.05, Math.PI * 1.95); x.strokeStyle = OL; x.lineWidth = 4; x.stroke(); x.strokeStyle = '#ffd34d'; x.lineWidth = 2.2; x.stroke();
}
function uchi(x, f) {
  const b = f ? 1 : 0;
  ell(x, -4, 13 - b, 3.2, 2.6, '#2a2433', OL, 1.4); ell(x, 4, 13 + b - 1, 3.2, 2.6, '#2a2433', OL, 1.4);
  // 도포
  path(x, [-7, -1, 7, -1, 11, 13, -11, 13], '#dfe9f5', OL, 2);
  path(x, [-1.5, -1, 1.5, -1, 3, 13, -3, 13], '#5aa7e8');
  line(x, -7, 6, 7, 6, '#3c6fb0', 2);
  // 부적 든 손
  path(x, [9, 0, 15, -1, 16, 9, 10, 10], '#f6e27a', OL, 1.5); line(x, 12.5, 2, 13, 7.5, '#d0342c', 1.4);
  // 얼굴
  ell(x, 0, -5, 7.5, 7.5, '#f3d3b0', OL, 2);
  line(x, -3.5, -5.5, -1.5, -5, OL, 1.6); line(x, 3.5, -5.5, 1.5, -5, OL, 1.6);
  line(x, -1.4, -1.8, 1.4, -1.8, '#a4583c', 1.2);
  // 수염
  path(x, [-1.5, 0, 1.5, 0, 0, 4.5], '#2a2433');
  // 갓
  ell(x, 0, -10, 15, 4.2, '#1d1a24', OL, 1.5);
  path(x, [-5.5, -10, -4.5, -18, 4.5, -18, 5.5, -10], '#1d1a24', OL, 1.5);
  line(x, -13, -10, 13, -10, 'rgba(255,255,255,.18)', 1);
}

/* ───── 몬스터 공통: 좀비 색 ───── */
const Z = { fur: '#7d8b6a', dark: '#4e5944', light: '#a3ad87', rot: '#6b3f3f', bone: '#e8e2cf' };
function dog(x, f, c = Z) {
  const s = f ? 2 : -2;
  line(x, -7, 4, -8 + s, 10, OL, 4); line(x, 6, 4, 7 - s, 10, OL, 4); line(x, -7, 4, -8 + s, 10, c.dark, 2.2); line(x, 6, 4, 7 - s, 10, c.dark, 2.2);
  line(x, -10, -1, -15, -6 + s / 2, OL, 4); line(x, -10, -1, -15, -6 + s / 2, c.fur, 2);
  ell(x, -1, 1, 11, 6.5, c.fur, OL, 2);
  ell(x, -3, 2, 3, 2, c.rot); line(x, -6, -1, 2, -1, c.bone, 1.2);
  ell(x, 9, -4, 6.5, 5.5, c.fur, OL, 2);
  path(x, [12, -3, 17, -2, 16, 1, 12, 1], c.light, OL, 1.5);
  path(x, [5, -8, 6, -14, 9, -9], c.dark, OL, 1.5);
  eyes(x, 9, -5, 0, 1.4);
  path(x, [13, 1, 14, 3, 15, 1], c.bone);
}
function wolf(x, f) { dog(x, f, { fur: '#7f8796', dark: '#4d5462', light: '#aeb5c2', rot: '#5f3f4a', bone: '#ece6d6' }); }
function boar(x, f) {
  const s = f ? 2 : -2;
  for (const [a, b] of [[-8, s], [-3, -s], [4, s], [9, -s]]) { line(x, a, 4, a + b * .5, 11, OL, 4.5); line(x, a, 4, a + b * .5, 11, '#4b3d33', 2.6); }
  ell(x, 0, 0, 14, 9, '#7a6a55', OL, 2);
  path(x, [-12, -6, -6, -11, 2, -10, 8, -8], '#4b3d33', null, 2, false);
  for (let i = -10; i < 8; i += 3) line(x, i, -8, i + 1, -12, OL, 1.4);
  ell(x, 11, 1, 7, 6, '#8a7962', OL, 2);
  ell(x, 16, 2, 3.2, 3, '#c9a08a', OL, 1.4);
  path(x, [13, 4, 16, 9, 14, 5], '#f0ead8', OL, 1);
  eyes(x, 11, -1.5, 0, 1.5);
  ell(x, -4, 3, 3, 2, Z.rot);
}
function crow(x, f) {
  const w = f ? -8 : 4;
  path(x, [-2, -2, -14, w, -6, 2], '#2b2a33', OL, 1.5);
  path(x, [2, -2, 14, w, 6, 2], '#2b2a33', OL, 1.5);
  ell(x, 0, 1, 6, 7, '#34323d', OL, 2);
  ell(x, 0, -6, 4.5, 4.5, '#34323d', OL, 1.8);
  path(x, [-1.5, -5, 1.5, -5, 0, 0], '#d9b13b', OL, 1);
  eyes(x, 0, -7, 2, 1.1);
  ell(x, 2, 3, 2, 1.5, Z.rot);
}
function bat(x, f) {
  const w = f ? -6 : 3;
  path(x, [-2, -1, -13, w - 4, -11, w + 3, -6, w, -4, 4], '#3b2f45', OL, 1.5);
  path(x, [2, -1, 13, w - 4, 11, w + 3, 6, w, 4, 4], '#3b2f45', OL, 1.5);
  ell(x, 0, 0, 5, 6, '#4a3a57', OL, 1.8);
  path(x, [-4, -4, -3, -10, -1, -5], '#4a3a57', OL, 1.2); path(x, [4, -4, 3, -10, 1, -5], '#4a3a57', OL, 1.2);
  eyes(x, 0, -1, 2, 1.1, '#7dff6a');
}
function snake(x, f) {
  x.beginPath(); for (let i = 0; i <= 10; i++) { const t = i / 10, px = -14 + t * 24, py = Math.sin(t * 5 + (f ? 1.4 : 0)) * 4; i ? x.lineTo(px, py) : x.moveTo(px, py); }
  x.strokeStyle = OL; x.lineWidth = 8; x.stroke(); x.strokeStyle = '#6f8f4a'; x.lineWidth = 5; x.stroke(); x.strokeStyle = '#a8c06a'; x.lineWidth = 1.5; x.setLineDash([2, 3]); x.stroke(); x.setLineDash([]);
  ell(x, 12, Math.sin(5 + (f ? 1.4 : 0)) * 4, 5, 4, '#6f8f4a', OL, 1.8);
  eyes(x, 13, Math.sin(5 + (f ? 1.4 : 0)) * 4 - 1.5, 0, 1.1, '#ffd84a');
}
function bear(x, f) {
  const s = f ? 2 : -2;
  for (const [a, b] of [[-11, s], [-4, -s], [5, s], [12, -s]]) { line(x, a, 6, a + b * .5, 15, OL, 6); line(x, a, 6, a + b * .5, 15, '#4a4038', 4); }
  ell(x, 0, 1, 19, 12, '#6e6152', OL, 2.2);
  ell(x, -6, 4, 5, 3, Z.rot); line(x, -12, -2, 0, -4, Z.bone, 1.4); line(x, -10, -6, -2, -8, Z.bone, 1.4);
  ell(x, 16, -4, 10, 9, '#7d6f5e', OL, 2.2);
  ell(x, 11, -12, 3.5, 3.5, '#7d6f5e', OL, 1.6); ell(x, 21, -12, 3.5, 3.5, '#7d6f5e', OL, 1.6);
  ell(x, 22, -1, 4.5, 3.6, '#b9a993', OL, 1.4); ell(x, 24.5, -2, 1.4, 1.2, OL);
  eyes(x, 15, -5, 4, 1.6);
  path(x, [19, 2, 20, 5, 21, 2], Z.bone); path(x, [22, 2, 23, 5, 24, 2], Z.bone);
}
function buffalo(x, f) {
  const s = f ? 2 : -2;
  for (const [a, b] of [[-12, s], [-5, -s], [5, s], [12, -s]]) { line(x, a, 6, a + b * .5, 15, OL, 6); line(x, a, 6, a + b * .5, 15, '#2f3133', 4); }
  ell(x, 0, 1, 19, 11, '#4a4f55', OL, 2.2);
  ell(x, -5, 3, 4, 2.5, Z.rot); for (let i = -14; i < 10; i += 4) line(x, i, -7, i + 2, -9, '#6c737b', 1.2);
  ell(x, 16, -1, 9, 8, '#555b62', OL, 2.2);
  x.beginPath(); x.moveTo(12, -7); x.quadraticCurveTo(4, -18, 10, -20); x.moveTo(20, -7); x.quadraticCurveTo(28, -18, 22, -20); x.strokeStyle = OL; x.lineWidth = 5; x.stroke(); x.strokeStyle = '#e6dcc4'; x.lineWidth = 3; x.stroke();
  ell(x, 21, 3, 4.5, 3.5, '#7b8088', OL, 1.4);
  eyes(x, 16, -2, 3.5, 1.5);
}

/* ───── 보스 ───── */
function tiger(x, f) {
  const s = f ? 3 : -3;
  for (const [a, b] of [[-16, s], [-7, -s], [8, s], [17, -s]]) { line(x, a, 8, a + b * .5, 20, OL, 8); line(x, a, 8, a + b * .5, 20, '#d98b3a', 5.5); }
  x.beginPath(); x.moveTo(-24, 0); x.quadraticCurveTo(-36, -4, -34, -16); x.strokeStyle = OL; x.lineWidth = 7; x.stroke(); x.strokeStyle = '#d98b3a'; x.lineWidth = 4.5; x.stroke();
  ell(x, 0, 2, 26, 14, '#e39a45', OL, 2.5);
  ell(x, 0, 8, 18, 6, '#f6e3c4');
  for (let i = -18; i <= 14; i += 7) path(x, [i, -11, i + 3, -11, i + 1, 2], '#2a1d18');
  ell(x, 24, -6, 13, 12, '#e39a45', OL, 2.5);
  path(x, [15, -14, 17, -22, 22, -16], '#e39a45', OL, 2); path(x, [28, -16, 33, -22, 33, -13], '#e39a45', OL, 2);
  ell(x, 30, 0, 8, 6, '#f6e3c4', OL, 1.6);
  path(x, [18, -12, 22, -10, 19, -7], '#2a1d18'); path(x, [24, -15, 26, -11, 23, -11], '#2a1d18');
  // 칼송곳니
  path(x, [26, 3, 28, 18, 30, 3], '#fff8e8', OL, 1.6); path(x, [32, 3, 33.5, 16, 35, 3], '#fff8e8', OL, 1.6);
  ell(x, 34, -2, 2, 1.6, OL);
  eyes(x, 25, -7, 4.5, 2, '#ffe14a');
}
function fox(x, f) {
  const sw = f ? 0.12 : -0.12;
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i - 4) * 0.28 + sw;
    x.save(); x.rotate(a); x.beginPath(); x.ellipse(24, 0, 20, 6.5, 0, 0, TAU); x.fillStyle = '#f4e9d8'; x.fill(); x.strokeStyle = OL; x.lineWidth = 2; x.stroke();
    x.beginPath(); x.ellipse(38, 0, 7, 5, 0, 0, TAU); x.fillStyle = '#8fd8ff'; x.fill(); x.restore();
  }
  ell(x, 0, 2, 16, 11, '#f7efe2', OL, 2.4);
  ell(x, 0, 6, 10, 5, '#ffffff');
  ell(x, 13, -6, 10, 9, '#f7efe2', OL, 2.4);
  path(x, [6, -12, 6, -24, 12, -14], '#f7efe2', OL, 2); path(x, [15, -14, 21, -24, 20, -12], '#f7efe2', OL, 2);
  path(x, [7.5, -14, 7.5, -20, 10.5, -15], '#ff9ab0'); path(x, [16.5, -15, 19.5, -21, 18.5, -14], '#ff9ab0');
  path(x, [19, -5, 27, -3, 19, 0], '#f7efe2', OL, 1.6); ell(x, 26.5, -3.2, 1.5, 1.2, OL);
  line(x, 10, -8, 14, -7, '#c0263c', 2.2); line(x, 16, -8, 19, -7, '#c0263c', 2.2);
  eyes(x, 13, -7.5, 3, 1.3, '#ffcf3d');
  path(x, [10, -2, 13, 0, 16, -2], null, '#c0263c', 1.4, false);
}
function bulga(x, f) {
  const s = f ? 3 : -3;
  for (const [a, b] of [[-18, s], [-7, -s], [8, s], [18, -s]]) { line(x, a, 10, a + b * .5, 24, OL, 10); line(x, a, 10, a + b * .5, 24, '#3d454f', 7); }
  ell(x, 0, 2, 30, 18, '#5b6773', OL, 2.6);
  for (let i = -26; i <= 22; i += 6) path(x, [i, -12, i + 3, -24 - (i % 4 === 0 ? 4 : 0), i + 6, -12], '#9aa6b2', OL, 1.4);
  for (let i = -20; i < 20; i += 8) ell(x, i, 6, 3, 2, '#7e8a96');
  ell(x, 28, -4, 14, 12, '#66727e', OL, 2.4);
  x.beginPath(); x.moveTo(38, 0); x.quadraticCurveTo(48, 6, 44, 16); x.strokeStyle = OL; x.lineWidth = 8; x.stroke(); x.strokeStyle = '#66727e'; x.lineWidth = 5; x.stroke();
  path(x, [24, -14, 27, -22, 30, -14], '#c9d3dc', OL, 1.5);
  eyes(x, 29, -6, 4.5, 2.2, '#ff7a2f');
  path(x, [34, 4, 36, 10, 38, 4], '#f0ead8');
}
function imugiHead(x, f) {
  const o = f ? 1.5 : 0;
  ell(x, -4, 0, 16, 13, '#2f6f68', OL, 2.4);
  ell(x, 8, 0, 14, 11, '#368078', OL, 2.4);
  ell(x, 14, 0, 7, 6, '#7fb9a6');
  path(x, [-8, -12, -2, -22, 2, -11], '#d7c27a', OL, 1.6); path(x, [-8, 12, -2, 22, 2, 11], '#d7c27a', OL, 1.6);
  x.beginPath(); x.moveTo(18, -4); x.bezierCurveTo(28, -10 - o, 32, -2, 40, -8 + o); x.moveTo(18, 4); x.bezierCurveTo(28, 10 + o, 32, 2, 40, 8 - o); x.strokeStyle = OL; x.lineWidth = 3; x.stroke(); x.strokeStyle = '#e8d690'; x.lineWidth = 1.6; x.stroke();
  eyes(x, 6, 0, 6, 2.3, '#f6ff5a');
  line(x, 6, -6, 6, 6, OL, 1.2);
}
function imugiSeg(x, i) {
  const r = 14 - i * 0.45;
  ell(x, 0, 0, r, r, i % 2 ? '#2f6f68' : '#357a72', OL, 2);
  ell(x, 0, 0, r * 0.55, r * 0.55, '#7fb9a6');
  path(x, [-3, -r + 1, 0, -r - 5, 3, -r + 1], '#d7c27a', OL, 1.2);
}

const SPR = { daesung: [daesung, 26], uchi: [uchi, 26], dog: [dog, 22], wolf: [wolf, 22], boar: [boar, 26], crow: [crow, 22], bat: [bat, 22], snake: [snake, 22], bear: [bear, 34], buffalo: [buffalo, 34],
  tiger: [tiger, 44], fox: [fox, 46], bulga: [bulga, 52], imugi: [imugiHead, 34] };

/* 스프라이트(프레임·피격 흰색) 캐시 */
A.sprite = function (type, frame, flash) {
  const key = type + frame + (flash ? 'w' : '');
  let c = cache.get(key); if (c) return c;
  const [fn, half] = SPR[type]; const sz = half * 2 + 8;
  const [cv, x] = C(sz, sz); x.translate(sz / 2, sz / 2); fn(x, frame);
  if (flash) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(0, 0, cv.width, cv.height); }
  c = { cv, sz }; cache.set(key, c); return c;
};
A.seg = function (i, flash) {
  const key = 'seg' + i + (flash ? 'w' : ''); let c = cache.get(key); if (c) return c;
  const sz = 40; const [cv, x] = C(sz, sz); x.translate(20, 20); imugiSeg(x, i);
  if (flash) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(0, 0, cv.width, cv.height); }
  c = { cv, sz }; cache.set(key, c); return c;
};

A.shadow = function (r) {
  const key = 'sh' + r; let c = cache.get(key); if (c) return c;
  const [cv, x] = C(r * 2, r * 0.76); ell(x, r, r * 0.38, r * 0.95, r * 0.36, 'rgba(0,0,0,.28)'); cache.set(key, cv); return cv;
};
/* ───── 바닥 타일 ───── */
A.ground = function (ch) {
  const key = 'g' + ch.id; let c = cache.get(key); if (c) return c;
  const S = 256, [cv, x] = C(S, S), R = (G.CORE ? G.CORE.rng(ch.id * 99) : Math.random);
  x.fillStyle = ch.ground[0]; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) { ell(x, R() * S, R() * S, 10 + R() * 26, 6 + R() * 16, ch.ground[1 + (i % 2)]); }
  if (ch.deco === 'grass') {
    for (let i = 0; i < 60; i++) { const px = R() * S, py = R() * S; line(x, px, py, px - 2, py - 5, '#4f7a3f', 1.4); line(x, px, py, px + 2, py - 5, '#4f7a3f', 1.4); }
    for (let i = 0; i < 8; i++) { const px = R() * S, py = R() * S; ell(x, px, py, 2, 2, ['#e8d36a', '#e89ab0', '#f2f2f2'][i % 3]); }
    for (let i = 0; i < 5; i++) ell(x, R() * S, R() * S, 4 + R() * 4, 3 + R() * 2, '#6b6f5f', 'rgba(0,0,0,.25)', 1);
  } else {
    for (let i = 0; i < 7; i++) { const px = R() * S, py = R() * S; ell(x, px, py, 14 + R() * 18, 7 + R() * 8, '#24413f', 'rgba(140,200,180,.15)', 1.5); }
    for (let i = 0; i < 40; i++) { const px = R() * S, py = R() * S; line(x, px, py, px + 1, py - 7, '#566b45', 1.3); }
    for (let i = 0; i < 6; i++) ell(x, R() * S, R() * S, 2.2, 2.2, '#9fd27a');
  }
  c = cv; cache.set(key, c); return c;
};

/* ───── 아이콘(레벨업 카드·HUD) ───── */
const ICON = {
  staff(x) { line(x, -14, 14, 14, -14, OL, 7); line(x, -14, 14, 14, -14, '#d23b2c', 4.5); ell(x, 14, -14, 4, 4, '#f2c14e', OL, 1.5); ell(x, -14, 14, 4, 4, '#f2c14e', OL, 1.5); },
  talisman(x) { x.rotate(-0.2); path(x, [-9, -15, 9, -15, 9, 15, -9, 15], '#f6e27a', OL, 2); line(x, 0, -10, 0, 10, '#d0342c', 2.2); line(x, -5, -4, 5, -4, '#d0342c', 2); line(x, -5, 4, 5, 2, '#d0342c', 2); ell(x, 0, -11, 3, 2, '#d0342c'); },
  thunder(x) { path(x, [4, -16, -8, 2, 0, 2, -4, 16, 10, -4, 2, -4, 6, -16], '#ffe46b', OL, 2); },
  beads(x) { for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ell(x, Math.cos(a) * 11, Math.sin(a) * 11, 4.5, 4.5, i % 2 ? '#8a5a2b' : '#b07a3e', OL, 1.4); } ell(x, 0, 0, 3, 3, '#f2c14e'); },
  aura(x) { ell(x, 0, 0, 15, 15, 'rgba(255,214,102,.25)', '#ffd666', 2.5); ell(x, 0, 0, 8, 8, 'rgba(255,214,102,.4)', '#ffd666', 2); ell(x, 0, 0, 3, 3, '#fff3c4'); },
  fan(x) { x.beginPath(); x.moveTo(0, 12); x.arc(0, 12, 24, -Math.PI * 0.82, -Math.PI * 0.18); x.closePath(); x.fillStyle = '#7fd08a'; x.fill(); x.strokeStyle = OL; x.lineWidth = 2; x.stroke(); for (let i = 0; i < 5; i++) { const a = -Math.PI * 0.8 + i * Math.PI * 0.15; line(x, 0, 12, Math.cos(a) * 22, 12 + Math.sin(a) * 22, '#3f7d48', 1.4); } line(x, 0, 12, 0, 16, '#8a5a2b', 4); },
  might(x) { path(x, [-12, 4, -4, -10, 4, -4, 12, -12, 8, 8, -8, 12], '#ff7a59', OL, 2); },
  haste(x) { ell(x, 0, 0, 14, 14, '#9ad6ff', OL, 2); ell(x, 0, 0, 6, 6, '#e8f6ff'); line(x, 0, 0, 0, -10, OL, 2); line(x, 0, 0, 7, 3, OL, 2); },
  vigor(x) { x.beginPath(); x.moveTo(0, 13); x.bezierCurveTo(-18, 0, -12, -16, 0, -6); x.bezierCurveTo(12, -16, 18, 0, 0, 13); x.fillStyle = '#ff5a6e'; x.fill(); x.strokeStyle = OL; x.lineWidth = 2; x.stroke(); },
  swift(x) { path(x, [-12, 8, 6, 8, 12, 2, 4, 0, 2, -10, -4, -10, -6, 0, -12, 2], '#c8a06a', OL, 2); line(x, -16, -4, -10, -4, '#fff', 2); line(x, -18, 2, -13, 2, '#fff', 2); },
  magnet(x) { ell(x, 0, 0, 13, 13, null, '#b6a2ff', 3); ell(x, 0, 0, 7, 7, 'rgba(182,162,255,.5)', '#b6a2ff', 2); ell(x, 0, 0, 2.5, 2.5, '#fff'); },
  regen(x) { path(x, [-4, -13, 4, -13, 4, -4, 13, -4, 13, 4, 4, 4, 4, 13, -4, 13, -4, 4, -13, 4, -13, -4, -4, -4], '#6ee7a0', OL, 2); },
  heal(x) { ginseng(x); },
  gold(x) { coin(x, 12); },
};
function ginseng(x) { path(x, [-2, -6, 2, -6, 4, 4, 7, 12, 2, 8, 0, 14, -2, 8, -7, 12, -4, 4], '#f1dcae', OL, 1.6); for (const a of [-0.6, 0, 0.6]) { x.save(); x.translate(0, -6); x.rotate(a); ell(x, 0, -7, 3, 6, '#5fbf5a', OL, 1.2); x.restore(); } ell(x, 0, -14, 2, 2, '#e0403c'); }
function coin(x, r) { ell(x, 0, 0, r, r, '#f2c14e', OL, 2); ell(x, 0, 0, r * 0.72, r * 0.72, null, '#c08a2a', 1.2); path(x, [-r * .3, -r * .3, r * .3, -r * .3, r * .3, r * .3, -r * .3, r * .3], '#7a4d14'); }
A.icon = function (id, size = 44) {
  const key = 'i' + id + size; let c = cache.get(key); if (c) return c;
  const [cv, x] = C(size, size); x.translate(size / 2, size / 2); x.scale(size / 44, size / 44); (ICON[id] || ICON.might)(x);
  cache.set(key, cv); return cv;
};
A.iconURL = (id, size = 44) => { const c = A.icon(id, size); return c.toDataURL(); };
A.portrait = function (hero, size = 96) {
  const [cv, x] = C(size, size); x.translate(size / 2, size / 2 + 4); x.scale(size / 34, size / 34); (hero === 'daesung' ? daesung : uchi)(x, 0); return cv;
};
A.bossPortrait = function (kind, size = 120) {
  const [cv, x] = C(size, size); x.translate(size / 2 - (kind === 'imugi' ? 6 : 8), size / 2); x.scale(size / 110, size / 110); SPR[kind][0](x, 0); return cv;
};

/* ───── 바닥 아이템 ───── */
A.drop = function (k) {
  const key = 'd' + k; let c = cache.get(key); if (c) return c;
  const [cv, x] = C(32, 32); x.translate(16, 16);
  if (k === 'heal') { x.scale(0.8, 0.8); ginseng(x); }
  else if (k === 'magnet') { x.scale(0.6, 0.6); ICON.talisman(x); x.setTransform(DPR, 0, 0, DPR, 0, 0); x.translate(16, 16); ell(x, 0, 0, 13, 13, null, 'rgba(182,162,255,.8)', 1.5); }
  else if (k === 'coin') coin(x, 6);
  else if (k === 'bag') { ell(x, 0, 3, 9, 8, '#a0663a', OL, 1.8); path(x, [-4, -5, 4, -5, 2, -1, -2, -1], '#a0663a', OL, 1.4); coin(x, 4); }
  else if (k === 'chest') { path(x, [-12, -4, 12, -4, 12, 10, -12, 10], '#b8342c', OL, 2); x.beginPath(); x.moveTo(-12, -4); x.quadraticCurveTo(0, -14, 12, -4); x.fillStyle = '#d0463a'; x.fill(); x.strokeStyle = OL; x.lineWidth = 2; x.stroke(); line(x, -12, 2, 12, 2, '#f2c14e', 2); ell(x, 0, 2, 3, 3, '#f2c14e', OL, 1.2); }
  cache.set(key, cv); return cv;
};

G.ART = A;
})(window);
