// cap add android 로 만든 안드로이드 프로젝트를 출시용으로 고침
//  - targetSdk·compileSdk 36 (2026-08-31부터 필수), 필요하면 AGP 올림
//  - AdMob 앱 ID, 세로 고정, 버전 번호, 업로드 키 서명
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const A = new URL('../android/', import.meta.url).pathname, R = new URL('../../', import.meta.url).pathname;
const rd = p => readFileSync(A + p, 'utf8'), wr = (p, s) => writeFileSync(A + p, s);
const must = (ok, msg) => { if (!ok) { console.error('PATCH FAILED: ' + msg); process.exit(1); } };

// 1) SDK 버전
let v = rd('variables.gradle');
v = v.replace(/compileSdkVersion\s*=\s*(\d+)/, (m, n) => `compileSdkVersion = ${Math.max(36, +n)}`)
     .replace(/targetSdkVersion\s*=\s*(\d+)/, (m, n) => `targetSdkVersion = ${Math.max(36, +n)}`);
wr('variables.gradle', v);
// AGP 8.9 미만이면 올림 (compileSdk 36 지원), Gradle 래퍼도 맞춤
let b = rd('build.gradle');
const agp = (b.match(/com\.android\.tools\.build:gradle:(\d+)\.(\d+)\.(\d+)/) || []);
if (agp.length && (+agp[1] < 8 || (+agp[1] === 8 && +agp[2] < 9))) {
  b = b.replace(/com\.android\.tools\.build:gradle:[\d.]+/, 'com.android.tools.build:gradle:8.9.1'); wr('build.gradle', b);
  let w = rd('gradle/wrapper/gradle-wrapper.properties');
  const gv = (w.match(/gradle-(\d+)\.(\d+)(?:\.(\d+))?-/) || []);
  if (gv.length && (+gv[1] < 8 || (+gv[1] === 8 && +gv[2] < 11) || (+gv[1] === 8 && +gv[2] === 11 && !(+gv[3] >= 1)))) w = w.replace(/gradle-[\d.]+-(all|bin)\.zip/, 'gradle-8.11.1-$1.zip');
  wr('gradle/wrapper/gradle-wrapper.properties', w);
  console.log('AGP -> 8.9.1');
}
let gp = existsSync(A + 'gradle.properties') ? rd('gradle.properties') : '';
if (!gp.includes('suppressUnsupportedCompileSdk')) wr('gradle.properties', gp + '\nandroid.suppressUnsupportedCompileSdk=36\n');

// 2) AndroidManifest: AdMob 앱 ID, 세로 고정
const cfg = readFileSync(R + 'config.js', 'utf8'), appId = (cfg.match(/admobAppId:\s*'([^']+)'/) || [])[1];
must(appId, 'config.js 에 admobAppId 가 없어요');
let m = rd('app/src/main/AndroidManifest.xml');
if (!m.includes('com.google.android.gms.ads.APPLICATION_ID')) m = m.replace(/<application([^>]*)>/, `<application$1>\n        <meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="${appId}"/>`);
if (!m.includes('screenOrientation')) m = m.replace(/android:name="\.MainActivity"/, 'android:name=".MainActivity"\n            android:screenOrientation="portrait"');
must(m.includes(appId), 'AdMob 앱 ID 넣기 실패'); wr('app/src/main/AndroidManifest.xml', m);

// 3) 버전: versionName = 게임 버전(js/data.js), versionCode = 빌드 번호
const ver = (readFileSync(R + 'js/data.js', 'utf8').match(/D\.VERSION = '([^']+)'/) || [])[1] || '1.0.0';
const code = +(process.env.VERSION_CODE || 1);
let g = rd('app/build.gradle');
g = g.replace(/versionCode\s+\d+/, `versionCode ${code}`).replace(/versionName\s+"[^"]*"/, `versionName "${ver}"`);
// 4) 업로드 키 서명 (키 정보는 GitHub Secrets → 환경변수)
if (!g.includes('signingConfigs')) {
  g = g.replace(/android\s*\{/, `android {
    signingConfigs {
        release {
            if (System.getenv("KS_PATH")) {
                storeFile file(System.getenv("KS_PATH"))
                storePassword System.getenv("KS_PASS")
                keyAlias System.getenv("KS_ALIAS")
                keyPassword System.getenv("KS_KEY_PASS")
            }
        }
    }`);
  g = g.replace(/release\s*\{\s*\n(\s*)minifyEnabled/, (mm, sp) => `release {\n${sp}signingConfig signingConfigs.release\n${sp}minifyEnabled`);
}
must(g.includes('signingConfig signingConfigs.release'), '서명 설정 넣기 실패');
wr('app/build.gradle', g);
console.log(`patched: v${ver} (${code}), admob ${appId}`);
