# 퇴마 서바이버 안드로이드 앱 만들기

웹 게임 파일을 그대로 안드로이드 앱(Capacitor)으로 감싸서 GitHub Actions가 앱 파일을 만들어 줍니다. 내 컴퓨터에 안드로이드 개발 도구를 깔 필요가 없습니다.

- 앱 이름: 퇴마 서바이버 / 패키지: `com.difgames.toema` / 개발자: Difgames
- 광고(AdMob)·결제(광고 제거)·구글 로그인 설정값: 저장소 맨 위 `config.js` 의 `android` 부분

## 1. 서명 키 등록 (처음 한 번)
저장소 → **Settings → Secrets and variables → Actions → New repository secret** 에서 4개를 등록합니다. 값은 따로 받은 `서명키_정보_비밀.txt` 에 있습니다.

| 이름 | 값 |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | `ANDROID_KEYSTORE_BASE64.txt` 내용 전체 |
| `KEYSTORE_PASSWORD` | 비밀번호 |
| `KEY_ALIAS` | `difgames-upload` |
| `KEY_PASSWORD` | 비밀번호(위와 같음) |

## 2. 앱 파일 만들기
저장소 → **Actions → Android build → Run workflow** (약 10분).
끝나면 그 실행 화면 아래 **Artifacts** 의 `toema-android-번호` 를 내려받습니다.
- `app-release.aab` → Play Console 에 올리는 파일
- `app-release.apk` → 안드로이드 폰에 바로 깔아 보는 파일

빨간 X로 실패하면 실패한 단계를 눌러 마지막 부분을 캡처해서 Claude에게 주세요.

## 3. Play Console
1. **앱 만들기**: 이름 '퇴마 서바이버', 기본 언어 한국어, 게임, 무료
2. **테스트 → 내부 테스트 → 새 버전 만들기**: `.aab` 업로드 (처음 올릴 때 'Play 앱 서명' 사용에 동의)
3. **수익 창출 → 제품 → 인앱 상품 → 상품 만들기**: 제품 ID `remove_ads`, 이름 '광고 제거', 가격 설정 후 활성화
4. **앱 무결성 → 앱 서명**: '앱 서명 키 인증서'의 SHA-1 을 복사해 둡니다 (5번에 사용)

## 4. 구글 로그인 (앱 전용)
앱 안에서는 웹 로그인이 막혀 있어서, 구글 클라우드에 '안드로이드용 로그인 키'를 따로 만들어야 합니다.
1. Supabase 구글 로그인을 만들 때 쓴 **Google Cloud 프로젝트** → API 및 서비스 → 사용자 인증 정보
2. **사용자 인증 정보 만들기 → OAuth 클라이언트 ID → Android** 를 **2개** 만듭니다
   - 패키지 이름 `com.difgames.toema` + SHA-1 = **업로드 키 지문** (`서명키_정보_비밀.txt` 에 있음)
   - 패키지 이름 `com.difgames.toema` + SHA-1 = **앱 서명 키 지문** (3-4번에서 복사한 것)
3. 같은 화면에서 **웹 애플리케이션** 유형의 기존 클라이언트 ID(Supabase 에 넣은 것)를 Claude 에게 알려주면 `config.js` 의 `googleWebClientId` 에 넣어 드립니다

## 5. 개발자 홈페이지 (`qlddka2.github.io`)
새 저장소 `qlddka2.github.io` (Public) 를 만들고 `devsite` 파일을 올리면 `https://qlddka2.github.io` 가 개발자 홈이 됩니다.
- `app-ads.txt`: AdMob 광고 인증 파일 (꼭 이 주소의 맨 위에 있어야 함)
- Play Console 스토어 등록정보의 웹사이트는 `https://qlddka2.github.io`, 개인정보처리방침은 `https://qlddka2.github.io/toema/privacy.html`

## 다시 빌드할 때
게임 파일을 고친 뒤 2번만 다시 실행하면 됩니다. 버전 번호(versionCode)는 Actions 실행 번호로 자동으로 올라가고, 버전 이름은 `js/data.js` 의 `D.VERSION` 을 따릅니다.
