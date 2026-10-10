// 저장소의 게임 파일(웹)을 app/www 로 복사 — 앱 안에 그대로 들어감
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';
const root = new URL('../../', import.meta.url).pathname, out = new URL('../www/', import.meta.url).pathname;
rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'privacy.html', 'config.js', 'manifest.json', 'js', 'img', 'snd', 'icons']) if (existsSync(root + f)) cpSync(root + f, out + f, { recursive: true });
console.log('web files copied to', out);
