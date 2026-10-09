/* 퇴마 서바이버(가제) — 온라인 랭킹 (Supabase, 맞수와 같은 프로젝트·계정) */
(function () {
const st = { avail: false, ready: false, user: null, nick: '', err: '', askNick: false };
let sb = null, onChange = () => {};
const isDefaultNick = n => /^플레이어[0-9a-f]{6}$/.test(n || '');
const NICK_ERR = { nickname_taken: '이미 쓰고 있는 닉네임이에요.', invalid_nickname: '2~12자, 한글·영문·숫자·밑줄(_)만 쓸 수 있어요.', not_authenticated: '로그인이 필요해요.' };
const FIN_ERR = { no_run: '판 정보가 없어요', already: '이미 기록된 판이에요', time_mismatch: '시간 정보가 맞지 않아요', invalid: '기록 값이 올바르지 않아요', too_many: '너무 자주 시작했어요. 잠시 뒤 다시 해 주세요', not_authenticated: '로그인이 필요해요' };
const code = (e, M) => { const m = (e && e.message) || ''; return Object.keys(M).find(k => m.includes(k)) || ''; };

function init(cb) {
  onChange = cb || onChange;
  const start = () => {
    if (sb) return;
    const c = window.TOEMA_CONFIG;
    if (!c || !c.supabaseUrl || !c.supabaseKey) { st.err = '랭킹 서버 설정이 없어요'; onChange(); return; }
    if (!window.supabase || !window.supabase.createClient) return;
    try { sb = window.supabase.createClient(c.supabaseUrl, c.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); }
    catch (e) { st.err = '랭킹 서버에 연결하지 못했어요'; onChange(); return; }
    st.avail = true;
    sb.auth.onAuthStateChange((ev, s) => setTimeout(() => session(s && s.user || null), 0));
    sb.auth.getSession().then(({ data }) => session(data && data.session && data.session.user || null)).catch(() => { st.ready = true; onChange(); });
    onChange();
  };
  window.__sbLoaded = start;
  if (window.supabase) start();
  setTimeout(() => { if (!sb && !st.err) { st.err = '랭킹 라이브러리를 불러오지 못했어요 (네트워크·광고 차단 확인)'; onChange(); } }, 8000);
}
async function session(u) {
  if (st.ready && ((u && st.user && u.id === st.user.id) || (!u && !st.user))) return;
  st.user = u; st.ready = true; st.nick = '';
  if (u) {
    try { const { data } = await sb.from('profiles').select('nickname').eq('id', u.id).maybeSingle(); if (data) st.nick = data.nickname; } catch (e) {}
    if (isDefaultNick(st.nick)) st.askNick = true;
  }
  onChange();
}
const waitReady = async ms => { const t0 = Date.now(); while (!st.ready && Date.now() - t0 < ms) await new Promise(r => setTimeout(r, 100)); };

async function login() { if (!sb) return; try { await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin + location.pathname } }); } catch (e) {} }
async function logout() { if (!sb) return; try { await sb.auth.signOut(); } catch (e) {} st.user = null; st.nick = ''; onChange(); }
async function setNick(n) {
  if (!sb || !st.user) return { ok: false, msg: '로그인이 필요해요.' };
  try { const { data, error } = await sb.rpc('set_nickname', { p_nick: (n || '').trim() }); if (error) throw error; st.nick = data || n; onChange(); return { ok: true }; }
  catch (e) { return { ok: false, msg: NICK_ERR[code(e, NICK_ERR)] || '저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.' }; }
}

/* 판 시작: 서버가 시작 시각을 기록 (끝낼 때 시간 검증용) */
async function start(ch, hero) {
  if (!sb) return null; await waitReady(3000); if (!st.user) return null;
  try { const { data, error } = await sb.rpc('sv_start', { p_chapter: ch, p_hero: hero }); if (error) throw error; return data; } catch (e) { return null; }
}
/* 판 종료: 점수는 서버가 다시 계산 */
async function finish(runId, r) {
  if (!sb || !st.user) return { ok: false, msg: '로그인이 필요해요' };
  if (!runId) return { ok: false, msg: '판 시작 때 서버에 연결되지 않아 기록되지 않았어요' };
  try {
    const { data, error } = await sb.rpc('sv_finish', { p_run: runId, p_t: r.t, p_kills: r.kills, p_mid: r.mid, p_cleared: r.cleared, p_boss_t: r.bossT });
    if (error) throw error;
    return { ok: true, ...data };
  } catch (e) { return { ok: false, msg: FIN_ERR[code(e, FIN_ERR)] || '서버 오류' }; }
}
async function board(ch) {
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('sv_best').select('user_id,score,t,kills,cleared,hero,profiles(nickname)').eq('chapter', ch).order('score', { ascending: false }).order('updated_at', { ascending: true }).limit(50);
    if (error) throw error;
    return data.map(x => ({ uid: x.user_id, score: x.score, t: x.t, kills: x.kills, cleared: x.cleared, hero: x.hero, nick: (x.profiles && x.profiles.nickname) || '플레이어' }));
  } catch (e) { return null; }
}
async function mine(ch) {
  if (!sb || !st.user) return null;
  try { const { data, error } = await sb.rpc('sv_my', { p_chapter: ch }); if (error) throw error; return data; } catch (e) { return null; }
}
window.RANK = { init, state: () => st, login, logout, setNick, start, finish, board, mine };
})();
