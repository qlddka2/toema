/* 퇴마 서바이버 — 다국어 (한국어 원문 → 영어·일본어·중국어 간체)
   화면에 나오는 글자를 그대로 번역해서 바꿔 끼움. 재시작 없이 언어 전환.
   사전(js/i18n_dict.js)의 열쇠는 한국어 원문.
   - {n}: 숫자 자리, {s}: 다른 말(이름 등) 자리 → 번역문에서는 {0},{1}… 순서로 씀 */
(function () {
const LANGS = { ko: '한국어', en: 'English', ja: '日本語', zh: '简体中文' };
const HAN = /[가-힣]/;
const DICT = window.I18N_DICT || {};
let lang = 'ko';
try { lang = localStorage.getItem('toema_lang') || ''; } catch (e) {}
if (!LANGS[lang]) { const n = (navigator.language || 'ko').toLowerCase(); lang = n.startsWith('ko') ? 'ko' : n.startsWith('ja') ? 'ja' : n.startsWith('zh') ? 'zh' : 'en'; }

const C = {};
function compile(l) {
  if (C[l]) return C[l];
  const d = DICT[l] || {}, exact = new Map(), list = [];
  for (const k in d) {
    if (/\{[sn]\}/.test(k)) {
      const re = new RegExp('^' + k.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{s\}/g, '(.+?)').replace(/\{n\}/g, '(-?[0-9]+(?:[.,][0-9]+)*)') + '$');
      list.push([re, k.match(/\{[sn]\}/g), d[k], k.replace(/\{[sn]\}/g, '').length]);
    } else exact.set(k, d[k]);
  }
  list.sort((a, b) => b[3] - a[3]);   // 고정 글자가 긴(더 구체적인) 틀부터
  return (C[l] = { exact, list });
}
const miss = new Set();
const fill = (v, vals) => { let i = 0; return v.replace(/\{(\d+)\}|\{[sn]\}/g, (m, d) => (d != null ? vals[+d] : vals[i++]) ?? ''); };
function core(s, P, depth) {
  if (!HAN.test(s)) return s;
  if (P.exact.has(s)) return P.exact.get(s);
  const nums = [], norm = s.replace(/-?\d+(?:[.,]\d+)*/g, x => { nums.push(x); return '{n}'; });
  if (nums.length && P.exact.has(norm)) return fill(P.exact.get(norm), nums);
  for (const [re, ord, v] of P.list) {
    const m = s.match(re); if (!m) continue;
    const vals = m.slice(1).map((c, i) => ord[i] === '{s}' ? core(c, P, depth + 1) : c);
    if (vals.some(x => x == null)) continue;   // 이름 자리를 못 옮기면 이 틀은 건너뜀
    return fill(v, vals);
  }
  const q = s.match(/^([\s\S]*?)([!?…:]+)$/);   // 끝 문장부호는 떼고 다시
  if (q && q[1]) { const r = core(q[1], P, depth + 1); if (r != null) return r + q[2]; }
  if (depth < 4) for (const sep of [' · ', '\n', ' / ', ' → ', ' + ', '! ', ', ', ': ', ' (', ')', '·']) {
    if (!s.includes(sep)) continue;
    const parts = s.split(sep), out = parts.map(p => { const pm = p.match(/^(\s*)([\s\S]*?)(\s*)$/); if (!pm[2]) return p; const t = core(pm[2], P, depth + 1); return t == null ? null : pm[1] + t + pm[3]; });
    if (out.every(x => x != null)) return out.join(sep);
  }
  if (depth === 0) miss.add(norm);
  return null;
}
function tr(src) {
  if (lang === 'ko' || !src || !HAN.test(src)) return src;
  const P = compile(lang), m = src.match(/^([\s·✦▶←•🔒]*)([\s\S]*?)([\s]*)$/);
  let r = core(m[2], P, 0);
  if (r == null) { const q = m[2].match(/^([\s\S]*?)([!?…:]+)$/); if (q) { const r2 = core(q[1], P, 1); if (r2 != null) { miss.delete(m[2].replace(/-?\d+(?:[.,]\d+)*/g, '{n}')); r = r2 + q[2]; } } }
  return r == null ? src : m[1] + r + m[3];
}

/* 화면 글자 바꿔 끼우기 */
const SKIP = /^(SCRIPT|STYLE|CANVAS|TEXTAREA)$/;
function doText(n, fresh) {
  if (!n.parentNode || SKIP.test(n.parentNode.nodeName) || (n.parentNode.closest && n.parentNode.closest('[translate="no"]'))) return;
  if (!fresh && n.__out !== undefined && n.data === n.__out) return;          // 내가 바꾼 글자
  if (fresh && n.__ko !== undefined && n.data === n.__out) { /* 언어 전환: 원문에서 다시 */ } else n.__ko = n.data;
  const out = tr(n.__ko); n.__out = out; if (out !== n.data) n.data = out;
}
const ATTRS = ['placeholder', 'title', 'aria-label'];
function doAttrs(el) { for (const a of ATTRS) if (el.hasAttribute && el.hasAttribute(a)) { const k = '__ko_' + a; if (el[k] === undefined || el.getAttribute(a) !== el['__out_' + a]) el[k] = el.getAttribute(a); const o = tr(el[k]); el['__out_' + a] = o; el.setAttribute(a, o); } }
function walk(root, fresh) {
  if (root.nodeType === 3) return doText(root, fresh);
  if (root.nodeType !== 1 || SKIP.test(root.nodeName)) return;
  doAttrs(root); root.querySelectorAll && root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(doAttrs);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) doText(n, fresh);
}
let titleKo = null;
function apply() {
  document.documentElement.lang = lang === 'zh' ? 'zh-Hans' : lang;
  if (titleKo === null) titleKo = document.title; document.title = tr(titleKo);
  walk(document.body, true);
}
function start() {
  apply();
  new MutationObserver(ms => { for (const m of ms) { if (m.type === 'characterData') doText(m.target); else m.addedNodes.forEach(n => walk(n)); } })
    .observe(document.body, { subtree: true, childList: true, characterData: true });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

window.I18N = {
  LANGS, get lang() { return lang; }, t: tr, miss,
  set(l) { if (!LANGS[l] || l === lang) return; lang = l; try { localStorage.setItem('toema_lang', l); } catch (e) {} apply(); if (window.onLangChange) window.onLangChange(l); },
};
})();
