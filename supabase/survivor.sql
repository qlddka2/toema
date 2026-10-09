-- 퇴마 서바이버(가제) · 랭킹
-- 맞수와 같은 Supabase 프로젝트에서 실행하세요 (profiles·set_nickname은 맞수 schema.sql에 이미 있음).
-- SQL Editor → New query → 통째로 붙여넣고 Run. 여러 번 실행해도 안전합니다.

-- ───────── 테이블 ─────────
-- 판 기록(서버만 읽고 씀): 시작 시각을 서버가 찍어서, 끝날 때 '게임 시간 ≤ 실제 흐른 시간'을 검사합니다.
create table if not exists public.sv_runs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  chapter     smallint not null check (chapter between 1 and 20),
  hero        text not null check (hero ~ '^[a-z]{2,16}$'),
  started_at  timestamptz not null default now(),
  finished_at timestamptz,
  t int, kills int, mid boolean, cleared boolean, boss_t int, score int
);
create index if not exists sv_runs_user_time on public.sv_runs (user_id, started_at desc);

-- 챕터별 개인 최고 기록 (랭킹판)
create table if not exists public.sv_best (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  chapter    smallint not null,
  score      int not null,
  t          int not null,
  kills      int not null,
  cleared    boolean not null,
  hero       text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, chapter)
);
create index if not exists sv_best_rank on public.sv_best (chapter, score desc);

alter table public.sv_runs enable row level security;
alter table public.sv_best enable row level security;
drop policy if exists "sv_best is public" on public.sv_best;
create policy "sv_best is public" on public.sv_best for select using (true);
revoke all on public.sv_runs from anon, authenticated;
revoke insert, update, delete, truncate on public.sv_best from anon, authenticated;
grant select on public.sv_best to anon, authenticated;

-- ───────── 판 시작 ─────────
create or replace function public.sv_start(p_chapter int, p_hero text)
returns uuid language plpgsql security definer set search_path = public as $$
declare rid uuid; n int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_chapter is null or p_chapter not between 1 and 20 or p_hero is null or p_hero !~ '^[a-z]{2,16}$' then raise exception 'invalid'; end if;
  insert into public.profiles (id, nickname)
    values (auth.uid(), '플레이어' || substr(replace(auth.uid()::text, '-', ''), 1, 6)) on conflict (id) do nothing;
  select count(*) into n from public.sv_runs where user_id = auth.uid() and started_at > now() - interval '10 minutes';
  if n >= 30 then raise exception 'too_many'; end if;
  delete from public.sv_runs where user_id = auth.uid() and finished_at is null and started_at < now() - interval '1 day';
  insert into public.sv_runs (user_id, chapter, hero) values (auth.uid(), p_chapter, p_hero) returning id into rid;
  return rid;
end $$;

-- ───────── 판 종료: 점수는 서버가 계산 (앱과 같은 공식) ─────────
--   점수 = 10×min(생존초,600) + 처치 + 중간보스 1500 + 클리어 (5000 + max(0,180−보스처치초)×20)
create or replace function public.sv_finish(p_run uuid, p_t int, p_kills int, p_mid boolean, p_cleared boolean, p_boss_t int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r public.sv_runs; el numeric; sc int; b public.sv_best; improved boolean := false; rk int; tot int; best int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into r from public.sv_runs where id = p_run and user_id = auth.uid() for update;
  if not found then raise exception 'no_run'; end if;
  if r.finished_at is not null then raise exception 'already'; end if;
  el := extract(epoch from now() - r.started_at);
  p_mid := coalesce(p_mid, false); p_cleared := coalesce(p_cleared, false); p_boss_t := coalesce(p_boss_t, 0);
  if p_t is null or p_t < 0 or p_t > 3600 or p_kills is null or p_kills < 0 or p_kills > 15 * p_t + 50 then raise exception 'invalid'; end if;
  if p_t > el + 5 then raise exception 'time_mismatch'; end if;
  if p_mid and p_t < 300 then raise exception 'invalid'; end if;
  if p_cleared and (p_t < 600 or not p_mid or p_boss_t < 5 or p_boss_t > p_t - 600 + 2) then raise exception 'invalid'; end if;

  sc := 10 * least(p_t, 600) + p_kills + case when p_mid then 1500 else 0 end
        + case when p_cleared then 5000 + greatest(0, 180 - p_boss_t) * 20 else 0 end;

  update public.sv_runs set finished_at = now(), t = p_t, kills = p_kills, mid = p_mid, cleared = p_cleared, boss_t = p_boss_t, score = sc where id = r.id;

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

-- ───────── 내 순위 ─────────
create or replace function public.sv_my(p_chapter int)
returns jsonb language plpgsql security definer stable set search_path = public as $$
declare b public.sv_best; rk int; tot int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into b from public.sv_best where user_id = auth.uid() and chapter = p_chapter;
  select count(*) into tot from public.sv_best where chapter = p_chapter;
  if not found then return jsonb_build_object('score', 0, 'rank', null, 'total', tot); end if;
  select count(*) + 1 into rk from public.sv_best where chapter = p_chapter and score > b.score;
  return jsonb_build_object('score', b.score, 'rank', rk, 'total', tot, 'cleared', b.cleared);
end $$;

revoke all on function public.sv_start(int, text) from public, anon;
revoke all on function public.sv_finish(uuid, int, int, boolean, boolean, int) from public, anon;
revoke all on function public.sv_my(int) from public, anon;
grant execute on function public.sv_start(int, text) to authenticated;
grant execute on function public.sv_finish(uuid, int, int, boolean, boolean, int) to authenticated;
grant execute on function public.sv_my(int) to authenticated;
