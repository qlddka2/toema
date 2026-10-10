#!/usr/bin/env python3
"""바닥 그림을 이어 붙여도 이음새가 안 보이는 타일로 만듭니다.
사용: python3 tools/seamless.py 원본.png img/ground_grass.png [--size 512]"""
import sys, argparse
import numpy as np
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out'); ap.add_argument('--size', type=int, default=512)
ap.add_argument('--flatten', type=float, default=0, help='0~1: 그림 전체에 걸친 밝기·색 쏠림(비네팅)을 평평하게. 반복 타일이 네모로 보일 때 0.8 정도')
a = ap.parse_args()
im = Image.open(a.src).convert('RGB')
s = min(im.size); im = im.crop(((im.width - s) // 2, (im.height - s) // 2, (im.width + s) // 2, (im.height + s) // 2)).resize((a.size, a.size), Image.LANCZOS)
A = np.asarray(im).astype(np.float32); n = a.size
if a.flatten > 0:
    from scipy import ndimage
    blur = np.stack([ndimage.gaussian_filter(A[..., c], n / 6, mode='wrap') for c in range(3)], -1)
    mean = A.reshape(-1, 3).mean(0)
    A = A * (1 - a.flatten) + (A - blur + mean) * a.flatten
# 겹쳐 잇기: 그림 끝부분(ov)을 시작 부분에 겹쳐 서서히 섞음 → 오른쪽 끝과 왼쪽 시작이 자연스럽게 이어짐 (가로 → 세로)
def wrap(X, axis, frac=0.22):
    m = X.shape[axis]; ov = int(m * frac); keep = m - ov
    head = np.take(X, range(ov), axis); tail = np.take(X, range(keep, m), axis)
    r = np.linspace(0, 1, ov); r = r * r * (3 - 2 * r); r = r.reshape((-1, 1, 1) if axis == 0 else (1, -1, 1))
    mixed = tail * (1 - r) + head * r                                  # 시작 부분: 끝 그림 → 원래 그림으로
    body = np.take(X, range(ov, keep), axis)
    return np.concatenate([mixed, body], axis)
out = wrap(wrap(A, 1), 0)
out = np.asarray(Image.fromarray(out.clip(0, 255).astype(np.uint8)).resize((n, n), Image.LANCZOS)).astype(np.float32)
Image.fromarray(out.clip(0, 255).astype(np.uint8)).save(a.out)
print('saved', a.out)
