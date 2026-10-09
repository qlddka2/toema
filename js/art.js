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
function imugiSeg(x, i, blue) {
  const r = 14 - i * 0.45;
  ell(x, 0, 0, r, r, blue ? (i % 2 ? '#2a5aa8' : '#3168bf') : (i % 2 ? '#2f6f68' : '#357a72'), OL, 2);
  ell(x, 0, 0, r * 0.55, r * 0.55, blue ? '#9cc8ff' : '#7fb9a6');
  path(x, [-3, -r + 1, 0, -r - 5, 3, -r + 1], blue ? '#ffe27a' : '#d7c27a', OL, 1.2);
}

/* ───── 새 주인공 ───── */
function bari(x, f) {
  const b = f ? 1 : 0;
  ell(x, -4, 13 - b, 3, 2.5, '#3a2a3a', OL, 1.3); ell(x, 4, 13 + b - 1, 3, 2.5, '#3a2a3a', OL, 1.3);
  // 색동 치마
  path(x, [-6, -1, 6, -1, 12, 13, -12, 13], '#f4f0ff', OL, 2);
  for (let i = 0; i < 4; i++) path(x, [-6 - i * 1.5, 2 + i * 3, 6 + i * 1.5, 2 + i * 3, 7 + i * 1.5, 4.5 + i * 3, -7 - i * 1.5, 4.5 + i * 3], ['#e05a6e', '#f2c14e', '#5fc7a0', '#5aa7e8'][i]);
  // 방울
  line(x, 10, -1, 13, 4, OL, 1.4); ell(x, 13.5, 6, 3.2, 3.2, '#f2c14e', OL, 1.3); ell(x, 12, 8, 1.6, 1.6, '#f2c14e', OL, 1); ell(x, 15, 8.5, 1.6, 1.6, '#f2c14e', OL, 1);
  ell(x, 0, -6, 7.5, 7.5, '#f6dcc2', OL, 2);
  // 머리(쪽진 머리 + 비녀)
  x.beginPath(); x.arc(0, -7, 8, Math.PI, 0); x.fillStyle = '#2a1f2e'; x.fill(); x.strokeStyle = OL; x.lineWidth = 2; x.stroke();
  ell(x, -7, -2, 4, 4, '#2a1f2e', OL, 1.5); line(x, -11, -3, -3, -1, '#f2c14e', 1.6);
  ell(x, -2.5, -5, 1.2, 1.5, OL); ell(x, 2.5, -5, 1.2, 1.5, OL); ell(x, -4, -3, 1.6, 1, 'rgba(240,120,140,.6)'); ell(x, 4, -3, 1.6, 1, 'rgba(240,120,140,.6)');
  x.beginPath(); x.arc(0, -2.5, 1.6, 0.2, Math.PI - 0.2); x.strokeStyle = '#a4483c'; x.lineWidth = 1.1; x.stroke();
}
function gildong(x, f) {
  const b = f ? 1.5 : 0;
  ell(x, -4, 13 - b, 3, 2.4, '#1d1a24', OL, 1.3); ell(x, 4, 13 + b - 1.5, 3, 2.4, '#1d1a24', OL, 1.3);
  // 흩날리는 띠
  x.beginPath(); x.moveTo(-5, -9); x.quadraticCurveTo(-14, -12 + b, -18, -6); x.strokeStyle = '#d0342c'; x.lineWidth = 2.4; x.stroke();
  path(x, [-7, -1, 7, -1, 9, 12, -9, 12], '#2b3346', OL, 2);
  line(x, -7, 4, 7, 4, '#d0342c', 2);
  // 단검
  line(x, 9, 2, 16, -3, OL, 3); line(x, 9, 2, 16, -3, '#dfe6ee', 1.6); line(x, 8, 3, 10, 1, '#8a5a2b', 3);
  ell(x, 0, -6, 7.3, 7.3, '#f2d2ae', OL, 2);
  // 두건 + 복면
  x.beginPath(); x.arc(0, -7, 7.8, Math.PI * 1.02, -0.02); x.fillStyle = '#2b3346'; x.fill(); x.strokeStyle = OL; x.lineWidth = 2; x.stroke();
  path(x, [-7, -3, 7, -3, 6, 1, -6, 1], '#2b3346', OL, 1.4);
  line(x, -4, -5.5, -1.6, -5, OL, 1.8); line(x, 4, -5.5, 1.6, -5, OL, 1.8);
}
function gangrim(x, f) {
  const b = f ? 1 : 0;
  ell(x, -4, 13 - b, 3, 2.5, '#151219', OL, 1.3); ell(x, 4, 13 + b - 1, 3, 2.5, '#151219', OL, 1.3);
  path(x, [-7, -1, 7, -1, 10, 13, -10, 13], '#22202a', OL, 2);
  path(x, [-2, -1, 2, -1, 3, 13, -3, 13], '#8b1f2a');
  // 혼불 든 손
  ell(x, 13, 3, 4.5, 5.5, 'rgba(127,216,255,.35)'); ell(x, 13, 3.5, 3, 3.6, '#bfeeff', '#7fd8ff', 1.2);
  ell(x, 0, -5, 7.3, 7.3, '#d8dce6', OL, 2);
  line(x, -3.8, -5, -1.4, -4.6, OL, 1.8); line(x, 3.8, -5, 1.4, -4.6, OL, 1.8);
  line(x, -1.2, -1.5, 1.2, -1.5, '#5a3a4a', 1.1);
  // 검은 갓 (차사)
  ell(x, 0, -10, 14, 3.8, '#0f0d12', OL, 1.5);
  path(x, [-5, -10, -4, -17, 4, -17, 5, -10], '#0f0d12', OL, 1.5);
  line(x, 7, -9, 9, 2, '#8b1f2a', 1.2);
}
function seolmun(x, f) {
  const b = f ? 1 : 0;
  ell(x, -5, 14 - b, 4, 3, '#4a3a2e', OL, 1.4); ell(x, 5, 14 + b - 1, 4, 3, '#4a3a2e', OL, 1.4);
  path(x, [-10, -2, 10, -2, 13, 14, -13, 14], '#c9b48a', OL, 2.2);
  path(x, [-10, 6, 13, 6, 13, 9, -11, 9], '#7a6a4e');
  // 큰 손 + 돌
  ell(x, 13, 2, 4.5, 4.5, '#e8c7a0', OL, 1.6); ell(x, 15, -3, 5, 4, '#8a8f96', OL, 1.6);
  ell(x, 0, -6, 9, 8.5, '#e8c7a0', OL, 2);
  // 흰머리 쪽
  x.beginPath(); x.arc(0, -8, 9.2, Math.PI * 1.05, -0.05); x.fillStyle = '#eceae4'; x.fill(); x.strokeStyle = OL; x.lineWidth = 2; x.stroke();
  ell(x, 0, -16, 4.5, 3.5, '#eceae4', OL, 1.6);
  x.beginPath(); x.arc(-3, -5.5, 1.6, Math.PI * 1.1, Math.PI * 1.9); x.arc(3, -5.5, 1.6, Math.PI * 1.1, Math.PI * 1.9); x.strokeStyle = OL; x.lineWidth = 1.4; x.stroke();
  x.beginPath(); x.arc(0, -1.5, 2.4, 0.2, Math.PI - 0.2); x.strokeStyle = '#8a4a3a'; x.lineWidth = 1.3; x.stroke();
  ell(x, -5.5, -2.5, 1.8, 1.1, 'rgba(230,120,110,.55)'); ell(x, 5.5, -2.5, 1.8, 1.1, 'rgba(230,120,110,.55)');
}

/* ───── 새 보스 ───── */
function haetae(x, f) {
  const s = f ? 3 : -3;
  for (const [a, b] of [[-16, s], [-6, -s], [8, s], [17, -s]]) { line(x, a, 8, a + b * .5, 20, OL, 8); line(x, a, 8, a + b * .5, 20, '#5d6b7a', 5.5); }
  x.beginPath(); x.moveTo(-22, -2); x.quadraticCurveTo(-34, -10, -30, -20); x.strokeStyle = OL; x.lineWidth = 6; x.stroke(); x.strokeStyle = '#8fa0b3'; x.lineWidth = 4; x.stroke();
  ell(x, 0, 2, 24, 14, '#7a8a9c', OL, 2.5);
  for (let i = -16; i <= 12; i += 7) ell(x, i, -2, 3.5, 2.5, '#9fb0c2');
  ell(x, 22, -8, 15, 14, '#8a9aac', OL, 2.5);
  for (let i = 0; i < 6; i++) { const a = -Math.PI * 0.9 + i * 0.35; ell(x, 22 + Math.cos(a) * 15, -8 + Math.sin(a) * 14, 5, 5, '#5d6b7a', OL, 1.4); }
  ell(x, 22, -8, 11, 10, '#8a9aac');
  path(x, [20, -20, 22, -30, 25, -20], '#d7c27a', OL, 1.8);
  ell(x, 31, -2, 6, 5, '#b9c6d3', OL, 1.6);
  path(x, [26, 2, 28, 7, 30, 2], '#f0ead8'); path(x, [31, 2, 33, 7, 35, 2], '#f0ead8');
  eyes(x, 23, -9, 4.5, 2, '#7fd8ff');
}
function hwaseo(x, f) {
  const s = f ? 2.5 : -2.5;
  for (const [a, b] of [[-10, s], [-3, -s], [6, s], [12, -s]]) { line(x, a, 5, a + b * .5, 13, OL, 5); line(x, a, 5, a + b * .5, 13, '#7a2e1e', 3); }
  x.beginPath(); x.moveTo(-14, 2); x.quadraticCurveTo(-30, 4 + s, -36, -6); x.strokeStyle = OL; x.lineWidth = 4; x.stroke(); x.strokeStyle = '#ff9a3c'; x.lineWidth = 2.4; x.stroke();
  ell(x, -2, 0, 16, 10, '#c4452a', OL, 2.2);
  for (let i = -14; i <= 8; i += 4) path(x, [i, -8, i + 2, -16 - (i % 8 === 0 ? 4 : 0), i + 4, -8], i % 8 ? '#ffb347' : '#ff6a2a', null);
  ell(x, 14, -3, 8, 7, '#d2522e', OL, 2);
  ell(x, 10, -11, 4, 4, '#d2522e', OL, 1.5); ell(x, 10, -11, 2, 2, '#ff9ab0');
  ell(x, 21, -2, 2, 1.6, OL);
  eyes(x, 15, -5, 0, 1.6, '#ffe14a');
  line(x, 20, 0, 26, -2, '#fff', 0.8); line(x, 20, 1, 26, 2, '#fff', 0.8);
}
function jujak(x, f) {
  const w = f ? -10 : 6;
  for (const sgn of [-1, 1]) {
    x.beginPath(); x.moveTo(-2, -4 * sgn); x.quadraticCurveTo(-20, (-26 + w) * sgn, -40, (-18 + w) * sgn); x.quadraticCurveTo(-24, (-8 + w / 2) * sgn, -6, 2 * sgn); x.closePath();
    x.fillStyle = '#e8402c'; x.fill(); x.strokeStyle = OL; x.lineWidth = 2.2; x.stroke();
    for (let i = 0; i < 4; i++) { line(x, -8 - i * 7, (-6 - i * 3) * sgn, -14 - i * 7, (-14 - i * 3 + w * .6) * sgn, '#ffb347', 2); }
  }
  // 꼬리 깃
  for (let i = -2; i <= 2; i++) { x.beginPath(); x.moveTo(-12, 0); x.quadraticCurveTo(-30, i * 6, -46, i * 10 + (f ? 2 : -2)); x.strokeStyle = OL; x.lineWidth = 5; x.stroke(); x.strokeStyle = i % 2 ? '#ffb347' : '#ff6a2a'; x.lineWidth = 3; x.stroke(); }
  ell(x, 0, 0, 14, 10, '#d8352a', OL, 2.2);
  ell(x, 2, 3, 9, 5, '#ffcf6a');
  ell(x, 14, -4, 8, 7, '#e8402c', OL, 2);
  path(x, [10, -10, 8, -20, 13, -11, 14, -22, 16, -10], '#ffb347', OL, 1.4);
  path(x, [21, -5, 28, -3, 21, -1], '#f2c14e', OL, 1.4);
  eyes(x, 16, -5, 0, 1.8, '#fff3a0');
}
function hyeonmu(x, f) {
  const s = f ? 3 : -3;
  for (const [a, b] of [[-20, s], [-8, -s], [8, s], [20, -s]]) { ell(x, a + b * .3, 16, 6, 5, '#3d5a52', OL, 2); }
  // 꼬리 뱀
  x.beginPath(); x.moveTo(-28, 0); x.bezierCurveTo(-44, -6, -40, -26, -26, -26); x.strokeStyle = OL; x.lineWidth = 8; x.stroke(); x.strokeStyle = '#4f8a6e'; x.lineWidth = 5; x.stroke();
  ell(x, -24, -27, 6, 5, '#4f8a6e', OL, 1.8); eyes(x, -22, -28, 0, 1.2, '#f6ff5a');
  // 등딱지
  ell(x, 0, 0, 32, 20, '#2c3d4a', OL, 2.6);
  for (const [cx, cy] of [[0, -4], [-14, -2], [14, -2], [-7, 8], [7, 8], [0, -14]]) path(x, [cx - 6, cy, cx - 3, cy - 5, cx + 3, cy - 5, cx + 6, cy, cx + 3, cy + 5, cx - 3, cy + 5], '#3f5868', '#1b1423', 1.4);
  ell(x, 0, 12, 26, 6, '#6b7a5a', OL, 1.6);
  ell(x, 32, 2, 10, 8, '#4f8a6e', OL, 2.2);
  eyes(x, 34, 0, 3.5, 1.7, '#f6ff5a');
  line(x, 38, 5, 42, 5, OL, 1.4);
}
function baekho(x, f) { tiger(x, f); }
function cheongryong(x, f) {
  imugiHead(x, f);
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(-6, 8 * s); x.quadraticCurveTo(-16, 18 * s, -10, 26 * s); x.strokeStyle = OL; x.lineWidth = 5; x.stroke(); x.strokeStyle = '#f2e6b8'; x.lineWidth = 3; x.stroke(); }
}

const SPR = { daesung: [daesung, 26], uchi: [uchi, 26], bari: [bari, 26], gildong: [gildong, 26], gangrim: [gangrim, 26], seolmun: [seolmun, 28],
  dog: [dog, 22], wolf: [wolf, 22], boar: [boar, 26], crow: [crow, 22], bat: [bat, 22], snake: [snake, 22], bear: [bear, 34], buffalo: [buffalo, 34],
  tiger: [tiger, 44], fox: [fox, 46], bulga: [bulga, 52], imugi: [imugiHead, 34], haetae: [haetae, 46], baekho: [baekho, 44], hwaseo: [hwaseo, 40], jujak: [jujak, 50], hyeonmu: [hyeonmu, 50], cheongryong: [cheongryong, 36] };
/* 색 덧칠 */
const TINT = { frost: 'rgba(170,215,255,.42)', fire: 'rgba(255,110,40,.38)', sea: 'rgba(40,170,160,.40)', baekho: 'rgba(240,246,255,.72)', cheongryong: 'rgba(60,120,230,.55)' };

/* ───── 외부 그림(PNG) — 있으면 코드 그림 대신 사용 ───── */
const IMG_LIST = { daesung: 52, uchi: 52, dog: 40, crow: 38, boar: 46, bear: 68 };   // 값 = 게임 안에서 그릴 상자 크기
const IMG = {};
A.loadImages = function (base, done) {
  const ks = Object.keys(IMG_LIST); let n = ks.length;
  for (const k of ks) { const im = new Image(); im.onload = () => { IMG[k] = im; cache.clear(); if (--n === 0 && done) done(); }; im.onerror = () => { if (--n === 0 && done) done(); }; im.src = base + k + '.png'; }
};
A.hasImg = k => !!IMG[k];

function outlined(x, img, s, col) {
  // 어두운 바닥에서도 보이도록 옅은 테두리
  const o = Math.max(1, s * 0.022);
  x.save(); x.globalAlpha = 1;
  const tmp = document.createElement('canvas'); tmp.width = Math.ceil(s * DPR); tmp.height = Math.ceil(s * DPR);
  const t = tmp.getContext('2d'); t.drawImage(img, 0, 0, tmp.width, tmp.height); t.globalCompositeOperation = 'source-in'; t.fillStyle = col; t.fillRect(0, 0, tmp.width, tmp.height);
  for (const [dx, dy] of [[-o, 0], [o, 0], [0, -o], [0, o], [-o, -o], [o, o], [-o, o], [o, -o]]) x.drawImage(tmp, dx - s / 2, dy - s / 2, s, s);
  x.restore();
  x.drawImage(img, -s / 2, -s / 2, s, s);
}

/* 스프라이트(프레임·피격 흰색·색 덧칠) 캐시 */
A.sprite = function (type, frame, flash, tint) {
  const key = type + frame + (flash ? 'w' : '') + (tint || '');
  let c = cache.get(key); if (c) return c;
  let cv, x, sz;
  if (IMG[type]) {
    sz = IMG_LIST[type];
    [cv, x] = C(sz, sz); x.translate(sz / 2, sz / 2);
    if (frame) x.scale(1.04, 0.95), x.translate(0, sz * 0.025);   // 걷기: 살짝 눌림
    outlined(x, IMG[type], sz * 0.94, 'rgba(244,234,213,.55)');
  } else {
    const [fn, half] = SPR[type]; sz = half * 2 + 8;
    [cv, x] = C(sz, sz); x.translate(sz / 2, sz / 2); fn(x, frame);
  }
  const tc = TINT[tint] || TINT[type];
  if (tc || flash) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; if (tc) { x.fillStyle = tc; x.fillRect(0, 0, cv.width, cv.height); } if (flash) { x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(0, 0, cv.width, cv.height); } }
  if (type === 'baekho' || type === 'cheongryong') { x.globalCompositeOperation = 'source-over'; }
  c = { cv, sz }; cache.set(key, c); return c;
};
A.seg = function (i, flash, blue) {
  const key = 'seg' + i + (flash ? 'w' : '') + (blue ? 'b' : ''); let c = cache.get(key); if (c) return c;
  const sz = 40; const [cv, x] = C(sz, sz); x.translate(20, 20); imugiSeg(x, i, blue);
  if (flash) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,255,255,.85)'; x.fillRect(0, 0, cv.width, cv.height); }
  c = { cv, sz }; cache.set(key, c); return c;
};

A.shadow = function (r) {
  const key = 'sh' + r; let c = cache.get(key); if (c) return c;
  const [cv, x] = C(r * 2, r * 0.76); ell(x, r, r * 0.38, r * 0.95, r * 0.36, 'rgba(0,0,0,.28)'); cache.set(key, cv); return cv;
};
/* ───── 바닥 타일 ───── */
const THEME = {
  grass: { base: ['#3a5a33', '#41643a', '#486d3f'] },
  swamp: { base: ['#2e4241', '#334b46', '#3a5248'] },
  snow:  { base: ['#8d9db0', '#98a8ba', '#8495a8'] },
  ash:   { base: ['#3d2a26', '#47302a', '#52372e'] },
  sea:   { base: ['#1f3a4a', '#244456', '#2a4d5f'] },
};
A.ground = function (ch) {
  const key = 'g' + ch.id; let c = cache.get(key); if (c) return c;
  const S = 256, [cv, x] = C(S, S), R = (G.CORE ? G.CORE.rng(ch.id * 99) : Math.random), T = THEME[ch.theme] || THEME.grass;
  x.fillStyle = T.base[0]; x.fillRect(0, 0, S, S);
  // 이음새 없이 반복되도록 가장자리 넘치는 무늬는 반대편에도 그림
  const wrap = fn => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { x.save(); x.translate(ox, oy); fn(); x.restore(); } };
  const blobs = []; for (let i = 0; i < 26; i++) blobs.push([R() * S, R() * S, 10 + R() * 26, 6 + R() * 16, T.base[1 + (i % 2)]]);
  wrap(() => { for (const b of blobs) ell(x, b[0], b[1], b[2], b[3], b[4]); });
  const pts = n => Array.from({ length: n }, () => [R() * S, R() * S, R()]);
  if (ch.theme === 'grass') {
    const g = pts(60), fl = pts(8), st = pts(5);
    wrap(() => { for (const [px, py] of g) { line(x, px, py, px - 2, py - 5, '#5a8a48', 1.4); line(x, px, py, px + 2, py - 5, '#5a8a48', 1.4); } fl.forEach(([px, py], i) => ell(x, px, py, 2, 2, ['#e8d36a', '#e89ab0', '#f2f2f2'][i % 3])); for (const [px, py, r] of st) ell(x, px, py, 4 + r * 4, 3 + r * 2, '#76796a', 'rgba(0,0,0,.25)', 1); });
  } else if (ch.theme === 'swamp') {
    const pd = pts(7), rd = pts(40), fl = pts(6);
    wrap(() => { for (const [px, py, r] of pd) ell(x, px, py, 14 + r * 18, 7 + r * 8, '#24413f', 'rgba(140,200,180,.15)', 1.5); for (const [px, py] of rd) line(x, px, py, px + 1, py - 7, '#5f7a4c', 1.3); for (const [px, py] of fl) ell(x, px, py, 2.2, 2.2, '#9fd27a'); });
  } else if (ch.theme === 'snow') {
    const ic = pts(6), sp = pts(50), rk = pts(5);
    wrap(() => { for (const [px, py, r] of ic) ell(x, px, py, 16 + r * 16, 8 + r * 6, 'rgba(160,200,235,.5)', 'rgba(255,255,255,.6)', 1.2); for (const [px, py] of sp) ell(x, px, py, 1.2, 1.2, '#ffffff'); for (const [px, py, r] of rk) ell(x, px, py, 5 + r * 4, 3 + r * 2, '#8a96a3', 'rgba(0,0,0,.2)', 1); });
  } else if (ch.theme === 'ash') {
    const em = pts(30), cr = pts(6), rk = pts(5);
    wrap(() => { for (const [px, py, r] of cr) { x.beginPath(); x.moveTo(px, py); x.lineTo(px + 14 + r * 10, py + 4); x.lineTo(px + 20, py + 12); x.strokeStyle = 'rgba(255,120,40,.55)'; x.lineWidth = 2; x.stroke(); } for (const [px, py] of em) ell(x, px, py, 1.4, 1.4, '#ff9a3c'); for (const [px, py, r] of rk) ell(x, px, py, 5 + r * 4, 3 + r * 2, '#2a1e1b', 'rgba(0,0,0,.3)', 1); });
  } else {
    const wv = pts(14), fo = pts(30);
    wrap(() => { for (const [px, py, r] of wv) { x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + 8, py - 4, px + 16, py); x.quadraticCurveTo(px + 24, py + 4, px + 32, py); x.strokeStyle = 'rgba(160,220,230,.35)'; x.lineWidth = 1.6; x.stroke(); } for (const [px, py] of fo) ell(x, px, py, 1.3, 1.3, 'rgba(220,250,255,.6)'); });
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
  bell(x) { line(x, 0, -16, 0, -6, OL, 2); x.beginPath(); x.moveTo(-10, 8); x.quadraticCurveTo(-10, -8, 0, -8); x.quadraticCurveTo(10, -8, 10, 8); x.closePath(); x.fillStyle = '#f2c14e'; x.fill(); x.strokeStyle = OL; x.lineWidth = 2; x.stroke(); ell(x, 0, 10, 3, 3, '#c08a2a', OL, 1.4); for (const r of [14, 18]) { x.beginPath(); x.arc(0, 0, r, -0.5, 0.5); x.strokeStyle = 'rgba(242,193,78,.7)'; x.lineWidth = 1.5; x.stroke(); x.beginPath(); x.arc(0, 0, r, Math.PI - 0.5, Math.PI + 0.5); x.stroke(); } },
  knives(x) { for (const [a, o] of [[-0.5, -6], [0, 0], [0.5, 6]]) { x.save(); x.rotate(a); x.translate(o * 0.2, 0); path(x, [-2, 6, 2, 6, 1.5, -14, 0, -18, -1.5, -14], '#dfe6ee', OL, 1.6); path(x, [-4, 6, 4, 6, 4, 8, -4, 8], '#8a5a2b', OL, 1.2); line(x, 0, 8, 0, 14, '#8a5a2b', 2.4); x.restore(); } },
  soulfire(x) { x.beginPath(); x.moveTo(0, -16); x.bezierCurveTo(10, -4, 12, 6, 0, 12); x.bezierCurveTo(-12, 6, -10, -4, 0, -16); x.fillStyle = '#7fd8ff'; x.fill(); x.strokeStyle = OL; x.lineWidth = 2; x.stroke(); ell(x, 0, 4, 5, 6, '#e8fbff'); ell(x, -2, 3, 1.2, 1.6, OL); ell(x, 2, 3, 1.2, 1.6, OL); },
  quake(x) { path(x, [-14, 12, -8, -6, -2, 4, 4, -14, 10, 2, 14, 12], '#9a8a76', OL, 2); line(x, -16, 14, 16, 14, '#6b5a46', 3); },
  might(x) { path(x, [-12, 4, -4, -10, 4, -4, 12, -12, 8, 8, -8, 12], '#ff7a59', OL, 2); },
  haste(x) { ell(x, 0, 0, 14, 14, '#9ad6ff', OL, 2); ell(x, 0, 0, 6, 6, '#e8f6ff'); line(x, 0, 0, 0, -10, OL, 2); line(x, 0, 0, 7, 3, OL, 2); },
  vigor(x) { x.beginPath(); x.moveTo(0, 13); x.bezierCurveTo(-18, 0, -12, -16, 0, -6); x.bezierCurveTo(12, -16, 18, 0, 0, 13); x.fillStyle = '#ff5a6e'; x.fill(); x.strokeStyle = OL; x.lineWidth = 2; x.stroke(); },
  swift(x) { path(x, [-12, 8, 6, 8, 12, 2, 4, 0, 2, -10, -4, -10, -6, 0, -12, 2], '#c8a06a', OL, 2); line(x, -16, -4, -10, -4, '#fff', 2); line(x, -18, 2, -13, 2, '#fff', 2); },
  magnet(x) { ell(x, 0, 0, 13, 13, null, '#b6a2ff', 3); ell(x, 0, 0, 7, 7, 'rgba(182,162,255,.5)', '#b6a2ff', 2); ell(x, 0, 0, 2.5, 2.5, '#fff'); },
  regen(x) { path(x, [-4, -13, 4, -13, 4, -4, 13, -4, 13, 4, 4, 4, 4, 13, -4, 13, -4, 4, -13, 4, -13, -4, -4, -4], '#6ee7a0', OL, 2); },
  armor(x) { path(x, [0, -15, 13, -9, 11, 6, 0, 15, -11, 6, -13, -9], '#9aa6b2', OL, 2); path(x, [0, -9, 7, -6, 6, 4, 0, 9, -6, 4, -7, -6], '#c9d3dc'); },
  luck(x) { for (let i = 0; i < 4; i++) { x.save(); x.rotate(i * Math.PI / 2 + 0.785); ell(x, 0, -7, 6, 7, '#5fc75a', OL, 1.6); x.restore(); } line(x, 0, 0, 4, 14, '#3f7d48', 2.4); },
  heal(x) { ginseng(x); },
  gold(x) { coin(x, 12); },
};
function ginseng(x) { path(x, [-2, -6, 2, -6, 4, 4, 7, 12, 2, 8, 0, 14, -2, 8, -7, 12, -4, 4], '#f1dcae', OL, 1.6); for (const a of [-0.6, 0, 0.6]) { x.save(); x.translate(0, -6); x.rotate(a); ell(x, 0, -7, 3, 6, '#5fbf5a', OL, 1.2); x.restore(); } ell(x, 0, -14, 2, 2, '#e0403c'); }
function coin(x, r) { ell(x, 0, 0, r, r, '#f2c14e', OL, 2); ell(x, 0, 0, r * 0.72, r * 0.72, null, '#c08a2a', 1.2); path(x, [-r * .3, -r * .3, r * .3, -r * .3, r * .3, r * .3, -r * .3, r * .3], '#7a4d14'); }
A.icon = function (id, size = 44, evo) {
  const key = 'i' + id + size + (evo ? 'e' : ''); let c = cache.get(key); if (c) return c;
  const [cv, x] = C(size, size); x.translate(size / 2, size / 2); x.scale(size / 44, size / 44);
  if (evo) { ell(x, 0, 0, 21, 21, 'rgba(242,193,78,.25)', '#f2c14e', 2); }
  (ICON[id] || ICON.might)(x);
  cache.set(key, cv); return cv;
};
const URLC = new Map();
A.iconURL = (id, size = 44, evo) => { const k = id + size + (evo ? 'e' : ''); if (!URLC.has(k)) URLC.set(k, A.icon(id, size, evo).toDataURL()); return URLC.get(k); };
A.portrait = function (hero, size = 96) {
  const [cv, x] = C(size, size);
  if (IMG[hero]) { x.drawImage(IMG[hero], 0, 0, size, size); return cv; }
  x.translate(size / 2, size / 2 + 4); x.scale(size / 34, size / 34); SPR[hero][0](x, 0); return cv;
};
A.bossPortrait = function (kind, size = 120) {
  const [cv, x] = C(size, size); x.translate(size / 2 - 8, size / 2); x.scale(size / 120, size / 120); SPR[kind][0](x, 0);
  const tc = TINT[kind]; if (tc) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = tc; x.fillRect(0, 0, cv.width, cv.height); }
  return cv;
};
A.mobPortrait = function (type, tint, size = 64) {
  const sp = A.sprite(type, 0, false, tint); const [cv, x] = C(size, size); x.drawImage(sp.cv, 0, 0, size, size); return cv;
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
