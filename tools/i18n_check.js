/* 게임 데이터(js/data.js)의 한국어 문구 중 번역이 안 되는 것 찾기:  node tools/i18n_check.js */
const fs = require('fs'), path = require('path'), R = p => path.join(__dirname, '..', p);
global.window = {}; global.localStorage = { getItem: () => 'en', setItem() {} }; global.navigator = { language: 'en' };
global.MutationObserver = class { observe() {} };
global.document = { readyState: 'complete', documentElement: {}, title: '', body: { nodeType: 9 } };
eval(fs.readFileSync(R('js/i18n_dict.js'), 'utf8')); global.window.I18N_DICT = window.I18N_DICT;
eval(fs.readFileSync(R('js/i18n.js'), 'utf8'));
const D = require(R('js/data.js')), out = new Set();
const walk = (v, k) => { if (typeof v === 'string') { if (/[가-힣]/.test(v)) out.add(v); } else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') for (const kk in v) walk(v[kk], kk); };
walk(D);
// 화면에서 조합되는 문구
for (const h in D.HEROES) out.add('🔒 ' + D.HEROES[h].unlock?.txt);
for (const k in D.UNIONS) { const U = D.UNIONS[k]; out.add(D.WEAPONS[U.a].evo.name + ' + ' + D.WEAPONS[U.b].evo.name); }
for (const k in D.PASSIVES) out.add(D.PASSIVES[k].name + ' 3');
const extra = (process.argv[2] || '').split('|').filter(Boolean); extra.forEach(e => out.add(e));
for (const l of ['en', 'ja', 'zh']) { window.I18N.set(l); const miss = [...out].filter(s => s && !s.includes('undefined') && /[가-힣]/.test(window.I18N.t(s))); console.log(l, miss.length); if (l === 'en') miss.forEach(m => console.log('  ', m)); }
