#!/usr/bin/env python3
"""바닥 그림을 이어 붙여도 이음새가 안 보이는 타일로 만듭니다.
사용: python3 tools/seamless.py 원본.png img/ground_grass.png [--size 512]"""
import sys, argparse
import numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out'); ap.add_argument('--size', type=int, default=512)
a = ap.parse_args()
im = Image.open(a.src).convert('RGB')
s = min(im.size); im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2)).resize((a.size, a.size), Image.LANCZOS)
A = np.asarray(im).astype(np.float32); n = a.size
B = np.roll(np.roll(A, n // 2, 0), n // 2, 1)          # 반 칸 밀어서 가장자리를 가운데로
y, x = np.mgrid[0:n, 0:n] / (n - 1)
w = np.minimum(np.minimum(x, 1 - x), np.minimum(y, 1 - y)) * 2   # 가장자리 0 → 가운데 1
w = np.clip(w * 1.6, 0, 1)[..., None]
out = A * w + B * (1 - w)                                 # 가장자리는 밀린 그림(이어지는 부분)으로 채움
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(a.out)
print('saved', a.out)
