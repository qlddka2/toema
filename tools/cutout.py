#!/usr/bin/env python3
"""초록 배경(#00FF00) 그림에서 그림들을 잘라 투명 PNG로 저장.
사용: python3 tools/cutout.py 원본.png 이름1,이름2,... [--flip 이름,...] [--out img] [--size 512]
이름 순서 = 왼쪽 위부터 읽는 순서(행 우선). 'skip'이면 건너뜀."""
import sys, os, argparse
import numpy as np
from PIL import Image
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('names')
ap.add_argument('--flip', default=''); ap.add_argument('--grid', default=''); ap.add_argument('--out', default='img'); ap.add_argument('--size', type=int, default=512)
a = ap.parse_args()
im = np.asarray(Image.open(a.src).convert('RGB')).astype(np.float32)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
# 초록 정도: g가 r·b보다 얼마나 큰가
gx = g - np.maximum(r, b)
alpha = np.clip(1 - (gx - 40) / 90, 0, 1)          # gx<40 불투명, gx>130 완전 투명
alpha[(g > 200) & (r < 120) & (b < 120)] = 0
# 테두리 초록 번짐 제거(despill)
spill = np.clip(g - np.maximum(r, b), 0, None)
g2 = g - spill * (1 - alpha) * 0.9
g2 = np.minimum(g2, np.maximum(r, b) + 25)
out = np.dstack([r, g2, b, alpha * 255]).clip(0, 255).astype(np.uint8)
mask = alpha > 0.5
mask = ndimage.binary_closing(mask, iterations=3)
lab, n = ndimage.label(mask)
objs = ndimage.find_objects(lab)
H, W = mask.shape
comps = []
for i, sl in enumerate(objs):
    area = (lab[sl] == i + 1).sum()
    if area < H * W * 0.004: continue          # 작은 조각(워터마크 등) 버림
    comps.append((sl, i + 1, area))
if a.grid:
    # 격자 모드: 칸마다 그 칸 안의 덩어리를 모두 모아 하나로
    gc, gr = map(int, a.grid.lower().split('x')); cw, chh = W / gc, H / gr
    boxes = []
    for r in range(gr):
        for c in range(gc):
            ids = [i + 1 for i, sl in enumerate(objs) if sl is not None and (lab[sl] == i + 1).sum() > cw * chh * 0.003
                   and c * cw <= (sl[1].start + sl[1].stop) / 2 < (c + 1) * cw and r * chh <= (sl[0].start + sl[0].stop) / 2 < (r + 1) * chh]
            if not ids: boxes.append(None); continue
            ys = [objs[i - 1][0] for i in ids]; xs = [objs[i - 1][1] for i in ids]
            boxes.append([min(x.start for x in xs), min(y.start for y in ys), max(x.stop for x in xs), max(y.stop for y in ys), ids])
    comps = []
# 겹치는 상자(떨어진 뼈 조각 등)는 큰 것에 합침
def box(sl): return [sl[1].start, sl[0].start, sl[1].stop, sl[0].stop]
if not a.grid: boxes = [[*box(sl), [lid]] for sl, lid, _ in comps]
merged = not a.grid
while merged:
    merged = False
    for i in range(len(boxes)):
        for j in range(i + 1, len(boxes)):
            A, B = boxes[i], boxes[j]
            pad = 20
            if A[0] - pad < B[2] and B[0] - pad < A[2] and A[1] - pad < B[3] and B[1] - pad < A[3]:
                boxes[i] = [min(A[0], B[0]), min(A[1], B[1]), max(A[2], B[2]), max(A[3], B[3]), A[4] + B[4]]
                del boxes[j]; merged = True; break
        if merged: break
# 읽는 순서: 행(세로 중심 기준 묶음) → 열
rowh = H / 6
if not a.grid:
  rows = max(1, round(H / max(1, min(B[3] - B[1] for B in boxes)))) if boxes else 1
  boxes.sort(key=lambda B: (int(((B[1] + B[3]) / 2) / (H / rows)), (B[0] + B[2]) / 2))
names = a.names.split(','); flips = set(a.flip.split(','))
os.makedirs(a.out, exist_ok=True)
for B, nm in zip(boxes, names):
    if nm == 'skip' or B is None: continue
    x0, y0, x1, y1, ids = B
    keep = np.isin(lab[y0:y1, x0:x1], ids)
    keep = ndimage.binary_dilation(keep, iterations=4)
    crop = out[y0:y1, x0:x1].copy(); crop[..., 3] = (crop[..., 3] * keep).astype(np.uint8)
    img = Image.fromarray(crop, 'RGBA')
    if nm in flips: img = img.transpose(Image.FLIP_LEFT_RIGHT)
    # 정사각 캔버스 중앙, 바닥 맞춤 여백
    s = max(img.width, img.height); pad = int(s * 0.06); S = s + pad * 2
    can = Image.new('RGBA', (S, S), (0, 0, 0, 0)); can.paste(img, ((S - img.width) // 2, (S - img.height) // 2))
    can = can.resize((a.size, a.size), Image.LANCZOS)
    can.save(os.path.join(a.out, nm + '.png'), optimize=True)
    print('saved', nm, (x1 - x0, y1 - y0))
print('found', len(boxes), 'objects')
