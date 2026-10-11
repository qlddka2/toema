-- 퇴마 서바이벌 v3.9: 백귀야행 층 보너스
-- Supabase → SQL Editor 에 이 파일 내용을 붙여넣고 Run 한 번. (sv_finish 함수만 바뀜, 테이블·기록은 그대로)
-- 예전 앱(층 정보를 안 보냄)은 p_ot = 0 → 보너스 0 으로 계산되어 그대로 동작합니다.

-- ───────── 판 종료: 점수는 서버가 계산 (앱과 같은 공식) ─────────
--   챕터: 10×min(생존초,600) + 처치 + 중간보스 1500 + 클리어 (5000 + max(0,180−보스처치초)×20 + 연장전초×40)
--   백귀야행: 10×생존초 + 처치 + 우두머리 처치×2000 + 도달한 층 보너스 (v3.9: p_ot = 층, 2층 3000 · 3층 8000 · 4층 15000)
create or replace function public.sv_finish(p_run uuid, p_t int, p_kills int, p_mid boolean, p_cleared boolean, p_boss_t int, p_ot int default 0, p_bosses int default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.sv_runs; el numeric; sc int; b public.sv_best; improved boolean := false; rk int; tot int; best int; endless boolean;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into r from public.sv_runs where id = p_run and user_id = auth.uid() for update;
  if not found then raise exception 'no_run'; end if;
  if r.finished_at is not null then raise exception 'already'; end if;
  el := extract(epoch from now() - r.started_at);
  endless := r.chapter >= 1000;
  p_mid := coalesce(p_mid, false); p_cleared := coalesce(p_cleared, false); p_boss_t := coalesce(p_boss_t, 0);
  p_ot := coalesce(p_ot, 0); p_bosses := coalesce(p_bosses, 0);
  if p_t is null or p_t < 0 or p_t > 7200 or p_kills is null or p_kills < 0 or p_kills > 25 * p_t + 50 then raise exception 'invalid'; end if;
  if p_t > el + 5 then raise exception 'time_mismatch'; end if;
  if endless then
    if p_bosses < 0 or p_bosses > p_t / 150 + 1 then raise exception 'invalid'; end if;
    if p_ot < 0 or p_ot > 4 or (p_ot >= 2 and p_t < 600 * (p_ot - 1) - 5) then raise exception 'invalid'; end if;
    sc := 10 * p_t + p_kills + 2000 * p_bosses + case p_ot when 2 then 3000 when 3 then 8000 when 4 then 15000 else 0 end;
  else
    if p_mid and p_t < 300 then raise exception 'invalid'; end if;
    if p_cleared and (p_t < 600 or not p_mid or p_boss_t < 5 or p_boss_t > p_t - 600 + 2) then raise exception 'invalid'; end if;
    if p_ot < 0 or (p_ot > 0 and not p_cleared) or p_ot > p_t - 600 - p_boss_t + 2 then raise exception 'invalid'; end if;
    sc := 10 * least(p_t, 600) + p_kills + case when p_mid then 1500 else 0 end
          + case when p_cleared then 5000 + greatest(0, 180 - p_boss_t) * 20 + 40 * p_ot else 0 end;
  end if;

  update public.sv_runs set finished_at = now(), t = p_t, kills = p_kills, mid = p_mid, cleared = p_cleared, boss_t = p_boss_t, ot = p_ot, bosses = p_bosses, score = sc where id = r.id;

  select * into b from public.sv_best where user_id = auth.uid() and chapter = r.chapter for update;
  if not found then
    insert into public.sv_best (user_id, chapter, score, t, kills, cleared, hero) values (auth.uid(), r.chapter, sc, p_t, p_kills, p_cleared, r.hero);
    improved := true; best := sc;
  elsif sc > b.score then
    update public.sv_best set score = sc, t = p_t, kills = p_kills, cleared = p_cleared, hero = r.hero, updated_at = now() where user_id = auth.uid() and chapter = r.chapter;
    improved := true; best := sc;
  else best := b.score;
  end if;

  select count(*) + 1 into rk from public.sv_best where chapter = r.chapter and score > best;
  select count(*) into tot from public.sv_best where chapter = r.chapter;
  return jsonb_build_object('score', sc, 'best', best, 'improved', improved, 'rank', rk, 'total', tot);
end $$;

