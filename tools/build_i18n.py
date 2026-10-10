#!/usr/bin/env python3
"""tools/i18n_src.tsv → js/i18n_dict.js  (python3 tools/build_i18n.py)"""
import re, json, os, sys
os.chdir(os.path.dirname(os.path.abspath(__file__)) + '/..')
D = {'en': {}, 'ja': {}, 'zh': {}}; bad = []
for ln, line in enumerate(open('tools/i18n_src.tsv', encoding='utf-8'), 1):
    line = line.rstrip('\n')
    if not line or line.startswith('#'): continue
    p = line.split('\t')
    if len(p) != 4: bad.append((ln, 'cols', line)); continue
    ko, *tr = p; n = len(re.findall(r'\{[sn]\}', ko))
    for l, t in zip(['en', 'ja', 'zh'], tr):
        idx = [int(x) for x in re.findall(r'\{(\d+)\}', t)]
        if idx and max(idx) >= n: bad.append((ln, l, 'placeholder', ko))
        D[l][ko] = t
open('js/i18n_dict.js', 'w', encoding='utf-8').write('/* 자동 생성: tools/build_i18n.py */\nwindow.I18N_DICT = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('keys', len(D['en']), 'problems', bad)
if len(sys.argv) > 1:   # 데이터 문구 중 번역 없는 것
    keys = json.load(open(sys.argv[1]))
    print('data keys missing:', [k for k in keys if k not in D['en']])
