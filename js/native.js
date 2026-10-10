/* 퇴마 서바이벌 — 안드로이드 앱 전용 기능 (광고·결제·구글 로그인·뒤로가기)
   웹(브라우저)에서는 아무 일도 하지 않고 NATIVE.on = false 로 둡니다.
   광고·결제·로그인 설정값은 config.js 의 TOEMA_CONFIG.android 에 있습니다. */
(function () {
const Cap = window.Capacitor;
const on = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
const P = name => (on && Cap.Plugins && Cap.Plugins[name]) || null;
const cfg = () => ((window.TOEMA_CONFIG || {}).android || {});
// 구글이 공개한 테스트용 광고 단위 (실제 ID가 비어 있으면 이걸로 동작 확인)
const TEST = { rewarded: 'ca-app-pub-3940256099942544/5224354917', interstitial: 'ca-app-pub-3940256099942544/1033173712' };
const unit = k => (cfg().testAds ? '' : cfg()[k]) || TEST[k];
const isTest = k => !!cfg().testAds || !cfg()[k];

const N = { on, ready: false, price: '', owned: false };

/* ───── 광고 (AdMob) ───── */
let adInit = null, rwReady = false, itReady = false, rwBusy = false;
function initAds() {
  const A = P('AdMob'); if (!A) return Promise.resolve(false);
  if (adInit) return adInit;
  adInit = (async () => {
    try {
      await A.initialize({});
      // 유럽 등 동의가 필요한 지역이면 동의 창 (구글 UMP)
      try { const c = await A.requestConsentInfo(); if (c && c.isConsentFormAvailable && c.status === 'REQUIRED') await A.showConsentForm(); } catch (e) {}
      preRewarded(); preInter();
      return true;
    } catch (e) { return false; }
  })();
  return adInit;
}
async function preRewarded() { const A = P('AdMob'); if (!A || rwReady) return; try { await A.prepareRewardVideoAd({ adId: unit('rewarded'), isTesting: isTest('rewarded') }); rwReady = true; } catch (e) { rwReady = false; } }
async function preInter() { const A = P('AdMob'); if (!A || itReady) return; try { await A.prepareInterstitial({ adId: unit('interstitial'), isTesting: isTest('interstitial') }); itReady = true; } catch (e) { itReady = false; } }

/* 보상형 광고: 끝까지 보면 done(), 못 보면 fail(메시지) */
N.rewarded = async function (done, fail) {
  const A = P('AdMob'); if (!A) return fail && fail('');
  if (rwBusy) return; rwBusy = true;
  await initAds();
  let got = false; const hs = [];
  const end = ok => { hs.forEach(h => h && h.remove && h.remove()); rwBusy = false; rwReady = false; setTimeout(preRewarded, 500); ok ? done() : fail && fail(''); };
  try {
    hs.push(await A.addListener('onRewardedVideoAdReward', () => { got = true; }));
    hs.push(await A.addListener('onRewardedVideoAdDismissed', () => end(got)));
    hs.push(await A.addListener('onRewardedVideoAdFailedToShow', () => end(false)));
    if (!rwReady) await A.prepareRewardVideoAd({ adId: unit('rewarded'), isTesting: isTest('rewarded') });
    await A.showRewardVideoAd();
  } catch (e) { end(false); }
};
/* 전면 광고: 판이 끝난 뒤 가끔 (보여줬으면 true) */
N.interstitial = async function () {
  const A = P('AdMob'); if (!A) return false;
  await initAds();
  try { if (!itReady) await A.prepareInterstitial({ adId: unit('interstitial'), isTesting: isTest('interstitial') }); await A.showInterstitial(); itReady = false; setTimeout(preInter, 1000); return true; }
  catch (e) { itReady = false; setTimeout(preInter, 3000); return false; }
};

/* ───── 결제: 광고 제거 (구글 플레이 비소모성 상품) ───── */
const PID = () => cfg().removeAdsId || 'remove_ads';
let onOwned = () => {}, onChange = () => {};
N.onOwned = f => { onOwned = f; if (N.owned) f(); };
N.onChange = f => { onChange = f; };
function initIAP() {
  const C = window.CdvPurchase; if (!C || !C.store) return;
  const { store, ProductType, Platform } = C;
  store.register([{ id: PID(), type: ProductType.NON_CONSUMABLE, platform: Platform.GOOGLE_PLAY }]);
  store.when()
    .productUpdated(p => { if (p.id === PID()) { const o = p.getOffer && p.getOffer(); const ph = o && o.pricingPhases && o.pricingPhases[0]; N.price = (ph && ph.price) || (p.pricing && p.pricing.price) || N.price; onChange(); } })
    .approved(t => t.verify())
    .verified(r => r.finish())
    .receiptUpdated(() => { if (store.owned(PID())) { N.owned = true; onOwned(); onChange(); } });
  store.initialize([Platform.GOOGLE_PLAY]).then(() => { N.ready = true; onChange(); });
}
N.buy = async function () {
  const C = window.CdvPurchase; if (!C || !C.store) return '결제 기능을 불러오지 못했어요';
  const p = C.store.get(PID(), C.Platform.GOOGLE_PLAY), o = p && p.getOffer && p.getOffer();
  if (!o) return '상품 정보를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요';
  const err = await o.order(); return err && err.message ? '결제가 완료되지 않았어요' : '';
};
N.restore = async function () { const C = window.CdvPurchase; if (C && C.store) try { await C.store.restorePurchases(); } catch (e) {} };

/* ───── 구글 로그인 (앱 전용 → Supabase 에 id 토큰 전달) ───── */
let slInit = null;
N.googleIdToken = async function () {
  const S = P('SocialLogin'); if (!S) throw new Error('no_plugin');
  const id = cfg().googleWebClientId; if (!id) throw new Error('no_client_id');
  if (!slInit) slInit = S.initialize({ google: { webClientId: id } });
  await slInit;
  const r = await S.login({ provider: 'google', options: { scopes: ['email', 'profile'] } });
  const x = (r && (r.result || r)) || {};
  const tok = x.idToken || (x.credential && x.credential.idToken) || (x.authentication && x.authentication.idToken);
  if (!tok) throw new Error('no_token');
  return tok;
};
N.googleLogout = async function () { const S = P('SocialLogin'); if (S) try { await S.logout({ provider: 'google' }); } catch (e) {} };

/* ───── 뒤로가기 버튼 ───── */
N.onBack = f => { const A = P('App'); if (A) A.addListener('backButton', f); };
N.minimize = () => { const A = P('App'); if (A) (A.minimizeApp ? A.minimizeApp() : A.exitApp()); };

if (on) {
  document.documentElement.classList.add('native');
  document.addEventListener('deviceready', initIAP, false);
  setTimeout(initAds, 1500);
}
window.NATIVE = N;
})();
