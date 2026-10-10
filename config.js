/* 랭킹 서버 설정 — 맞수와 같은 Supabase 프로젝트를 씁니다. 아래 두 값은 '공개용'이라 저장소에 올려도 됩니다.
   (절대 넣으면 안 되는 것: service_role 키, DB 비밀번호) */
window.TOEMA_CONFIG = {
  supabaseUrl: 'https://rofphqdqwxmjkypmjtok.supabase.co',
  // 안드로이드 앱 전용 (모두 공개돼도 되는 값)
  android: {
    admobAppId: 'ca-app-pub-7930587957278915~7696569254',
    rewarded: 'ca-app-pub-7930587957278915/6615421871',
    interstitial: 'ca-app-pub-7930587957278915/7928503547',
    removeAdsId: 'remove_ads',          // Play Console 인앱 상품 ID
    googleWebClientId: '1032647898801-fai3vemb8tp2ba675md9n5df0svs5h53.apps.googleusercontent.com',              // Google Cloud > 사용자 인증 정보 > 'Web client' 클라이언트 ID (Supabase 구글 로그인에 쓰는 것)
  },
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvZnBocWRxd3htamt5cG1qdG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NTc5NDAsImV4cCI6MjEwNzAzMzk0MH0.4YtLlwxtzx-s0xX7SCQv7mbgN_RIsXpdh6LuFCY9WMI'
};
