create extension if not exists pgcrypto;

insert into public.bubbles (slug, name, event_name, is_active)
values ('demo', 'TSV Stuttgart', 'Matchday', true)
on conflict (slug) do update set
  name = excluded.name,
  event_name = excluded.event_name,
  is_active = true;

grant usage on schema public to anon;
grant select on public.bubbles to anon;
grant select, insert, update on public.visitors to anon;
grant select on public.posts to anon;
grant insert on public.posts to anon;
grant select on public.polls to anon;
grant select, insert on public.poll_votes to anon;
grant select on public.fan_battles to anon;
grant select, insert on public.fan_battle_entries to anon;
grant execute on function public.submit_fan_battle_entry(uuid, uuid, text, integer) to anon;

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
using (
  exists (
    select 1
    from public.bubbles b
    where b.id = bubble_id
      and b.is_active = true
  )
);

drop policy if exists "anon can create visitors for active bubbles" on public.visitors;
create policy "anon can create visitors for active bubbles"
on public.visitors for insert
to anon
with check (
  exists (
    select 1
    from public.bubbles b
    where b.id = bubble_id
      and b.is_active = true
  )
);

drop policy if exists "anon can update visitors in active bubbles" on public.visitors;
create policy "anon can update visitors in active bubbles"
on public.visitors for update
to anon
using (
  exists (
    select 1
    from public.bubbles b
    where b.id = bubble_id
      and b.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.bubbles b
    where b.id = bubble_id
      and b.is_active = true
  )
);

drop policy if exists "posts in active bubbles are public" on public.posts;
create policy "posts in active bubbles are public"
on public.posts for select
to anon
using (
  exists (
    select 1
    from public.bubbles b
    where b.id = bubble_id
      and b.is_active = true
  )
);

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
using (
  exists (
    select 1
    from public.bubbles b
    where b.id = bubble_id
      and b.is_active = true
  )
);

drop policy if exists "poll votes in active bubbles are public" on public.poll_votes;
create policy "poll votes in active bubbles are public"
on public.poll_votes for select
to anon
using (
  exists (
    select 1
    from public.polls p
    join public.bubbles b on b.id = p.bubble_id
    where p.id = poll_id
      and p.is_active = true
      and b.is_active = true
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
using (
  exists (
    select 1
    from public.bubbles b
    where b.id = bubble_id
      and b.is_active = true
  )
);

drop policy if exists "fan battle entries in active bubbles are public" on public.fan_battle_entries;
create policy "fan battle entries in active bubbles are public"
on public.fan_battle_entries for select
to anon
using (
  exists (
    select 1
    from public.fan_battles fb
    join public.bubbles b on b.id = fb.bubble_id
    where fb.id = fan_battle_id
      and fb.is_active = true
      and b.is_active = true
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
