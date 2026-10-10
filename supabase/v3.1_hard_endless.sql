-- v3.1: 어려움 백귀야행 주간 랭킹(5000+주번호) 허용. Supabase SQL Editor에서 이 파일만 실행하면 됩니다.
-- ───────── 판 시작 ─────────
create or replace function public.sv_start(p_chapter int, p_hero text)
returns uuid language plpgsql security definer set search_path = public as $$
declare rid uuid; n int;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if p_chapter is null or p_hero is null or p_hero !~ '^[a-z]{2,16}$'
     or not (p_chapter between 1 and 5 or p_chapter between 11 and 15 or p_chapter = 1000 + public.sv_week() or p_chapter = 5000 + public.sv_week()) then raise exception 'invalid'; end if;
  insert into public.profiles (id, nickname)
    values (auth.uid(), '플레이어' || substr(replace(auth.uid()::text, '-', ''), 1, 6)) on conflict (id) do nothing;
  select count(*) into n from public.sv_runs where user_id = auth.uid() and started_at > now() - interval '10 minutes';
  if n >= 30 then raise exception 'too_many'; end if;
  delete from public.sv_runs where user_id = auth.uid() and finished_at is null and started_at < now() - interval '1 day';
  insert into public.sv_runs (user_id, chapter, hero) values (auth.uid(), p_chapter, p_hero) returning id into rid;
  return rid;
end $$;

grant execute on function public.sv_start(int, text) to authenticated;
