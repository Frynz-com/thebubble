create extension if not exists pgcrypto;

create table if not exists public.bubbles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  event_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  bubble_id uuid not null references public.bubbles(id) on delete cascade,
  session_id text not null,
  nickname text not null,
  avatar_url text,
  is_guest boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (bubble_id, session_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  bubble_id uuid not null references public.bubbles(id) on delete cascade,
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 180),
  created_at timestamptz not null default now()
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  bubble_id uuid not null references public.bubbles(id) on delete cascade,
  question text not null,
  options jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  option_key text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, visitor_id)
);

create table if not exists public.fan_battles (
  id uuid primary key default gen_random_uuid(),
  bubble_id uuid not null references public.bubbles(id) on delete cascade,
  home_team text not null,
  away_team text not null,
  home_taps integer not null default 0 check (home_taps >= 0),
  away_taps integer not null default 0 check (away_taps >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.fan_battle_entries (
  id uuid primary key default gen_random_uuid(),
  fan_battle_id uuid not null references public.fan_battles(id) on delete cascade,
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  selected_team text not null check (selected_team in ('home', 'away')),
  taps integer not null check (taps >= 0 and taps <= 1000),
  created_at timestamptz not null default now(),
  unique (fan_battle_id, visitor_id)
);

create index if not exists visitors_bubble_last_seen_idx on public.visitors (bubble_id, last_seen_at desc);
create index if not exists posts_bubble_created_idx on public.posts (bubble_id, created_at desc);
create index if not exists poll_votes_poll_idx on public.poll_votes (poll_id);
create index if not exists fan_battle_entries_battle_idx on public.fan_battle_entries (fan_battle_id);

insert into public.bubbles (slug, name, event_name, is_active)
values ('demo', 'TSV Stuttgart', 'Matchday', true)
on conflict (slug) do update set
  name = excluded.name,
  event_name = excluded.event_name,
  is_active = excluded.is_active;

insert into public.polls (bubble_id, question, options, is_active)
select id, 'Wer gewinnt heute?', '[{"key":"home","label":"TSV Stuttgart"},{"key":"draw","label":"Unentschieden"},{"key":"away","label":"SV Cannstatt"}]'::jsonb, true
from public.bubbles
where slug = 'demo'
and not exists (
  select 1 from public.polls where bubble_id = public.bubbles.id and is_active = true
);

insert into public.fan_battles (bubble_id, home_team, away_team, home_taps, away_taps, is_active)
select id, 'TSV Stuttgart', 'SV Cannstatt', 124, 96, true
from public.bubbles
where slug = 'demo'
and not exists (
  select 1 from public.fan_battles where bubble_id = public.bubbles.id and is_active = true
);

create or replace function public.submit_fan_battle_entry(
  p_fan_battle_id uuid,
  p_visitor_id uuid,
  p_selected_team text,
  p_taps integer
)
returns public.fan_battles
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_entry_id uuid;
  updated_battle public.fan_battles;
begin
  if p_selected_team not in ('home', 'away') then
    raise exception 'invalid selected_team';
  end if;

  if p_taps < 0 or p_taps > 1000 then
    raise exception 'invalid taps';
  end if;

  if not exists (
    select 1
    from public.fan_battles fb
    join public.bubbles b on b.id = fb.bubble_id
    join public.visitors v on v.bubble_id = fb.bubble_id
    where fb.id = p_fan_battle_id
      and fb.is_active = true
      and b.is_active = true
      and v.id = p_visitor_id
  ) then
    raise exception 'fan battle is not active or visitor is invalid';
  end if;

  insert into public.fan_battle_entries (fan_battle_id, visitor_id, selected_team, taps)
  values (p_fan_battle_id, p_visitor_id, p_selected_team, p_taps)
  on conflict (fan_battle_id, visitor_id) do nothing
  returning id into inserted_entry_id;

  if inserted_entry_id is not null then
    update public.fan_battles
    set
      home_taps = case when p_selected_team = 'home' then home_taps + p_taps else home_taps end,
      away_taps = case when p_selected_team = 'away' then away_taps + p_taps else away_taps end
    where id = p_fan_battle_id
    returning * into updated_battle;
  else
    select * into updated_battle
    from public.fan_battles
    where id = p_fan_battle_id;
  end if;

  return updated_battle;
end;
$$;

alter table public.bubbles enable row level security;
alter table public.visitors enable row level security;
alter table public.posts enable row level security;
alter table public.polls enable row level security;
alter table public.poll_votes enable row level security;
alter table public.fan_battles enable row level security;
alter table public.fan_battle_entries enable row level security;

drop policy if exists "active bubbles are public" on public.bubbles;
create policy "active bubbles are public"
on public.bubbles for select
to anon
using (is_active = true);

drop policy if exists "visitors in active bubbles are public" on public.visitors;
create policy "visitors in active bubbles are public"
on public.visitors for select
to anon
using (exists (select 1 from public.bubbles b where b.id = bubble_id and b.is_active = true));

drop policy if exists "anon can create visitors for active bubbles" on public.visitors;
create policy "anon can create visitors for active bubbles"
on public.visitors for insert
to anon
with check (exists (select 1 from public.bubbles b where b.id = bubble_id and b.is_active = true));

drop policy if exists "anon can update visitors in active bubbles" on public.visitors;
create policy "anon can update visitors in active bubbles"
on public.visitors for update
to anon
using (exists (select 1 from public.bubbles b where b.id = bubble_id and b.is_active = true))
with check (exists (select 1 from public.bubbles b where b.id = bubble_id and b.is_active = true));

drop policy if exists "posts in active bubbles are public" on public.posts;
create policy "posts in active bubbles are public"
on public.posts for select
to anon
using (exists (select 1 from public.bubbles b where b.id = bubble_id and b.is_active = true));

drop policy if exists "valid visitors can create posts" on public.posts;
create policy "valid visitors can create posts"
on public.posts for insert
to anon
with check (
  exists (
    select 1
    from public.visitors v
    join public.bubbles b on b.id = v.bubble_id
    where v.id = visitor_id
      and v.bubble_id = bubble_id
      and b.is_active = true
  )
);

drop policy if exists "polls in active bubbles are public" on public.polls;
create policy "polls in active bubbles are public"
on public.polls for select
to anon
using (exists (select 1 from public.bubbles b where b.id = bubble_id and b.is_active = true));

drop policy if exists "poll votes in active bubbles are public" on public.poll_votes;
create policy "poll votes in active bubbles are public"
on public.poll_votes for select
to anon
using (
  exists (
    select 1
    from public.polls p
    join public.bubbles b on b.id = p.bubble_id
    where p.id = poll_id and p.is_active = true and b.is_active = true
  )
);

drop policy if exists "valid visitors can vote once" on public.poll_votes;
create policy "valid visitors can vote once"
on public.poll_votes for insert
to anon
with check (
  exists (
    select 1
    from public.polls p
    join public.bubbles b on b.id = p.bubble_id
    join public.visitors v on v.bubble_id = p.bubble_id
    where p.id = poll_id
      and p.is_active = true
      and b.is_active = true
      and v.id = visitor_id
  )
);

drop policy if exists "fan battles in active bubbles are public" on public.fan_battles;
create policy "fan battles in active bubbles are public"
on public.fan_battles for select
to anon
using (exists (select 1 from public.bubbles b where b.id = bubble_id and b.is_active = true));

drop policy if exists "fan battle entries in active bubbles are public" on public.fan_battle_entries;
create policy "fan battle entries in active bubbles are public"
on public.fan_battle_entries for select
to anon
using (
  exists (
    select 1
    from public.fan_battles fb
    join public.bubbles b on b.id = fb.bubble_id
    where fb.id = fan_battle_id and fb.is_active = true and b.is_active = true
  )
);

drop policy if exists "valid visitors can create fan battle entries" on public.fan_battle_entries;
create policy "valid visitors can create fan battle entries"
on public.fan_battle_entries for insert
to anon
with check (
  exists (
    select 1
    from public.fan_battles fb
    join public.bubbles b on b.id = fb.bubble_id
    join public.visitors v on v.bubble_id = fb.bubble_id
    where fb.id = fan_battle_id
      and fb.is_active = true
      and b.is_active = true
      and v.id = visitor_id
  )
);

grant execute on function public.submit_fan_battle_entry(uuid, uuid, text, integer) to anon;

do $$
begin
  alter publication supabase_realtime add table public.visitors;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.poll_votes;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.fan_battles;
exception when duplicate_object then null;
end $$;
