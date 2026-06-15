-- Seed a second internal test bubble for deployment and multi-bubble checks.

insert into public.bubbles (slug, name, event_name, is_active)
values ('testbubble', 'Test Bubble', 'Internal Test', true)
on conflict (slug) do update set
  name = excluded.name,
  event_name = excluded.event_name,
  is_active = excluded.is_active;

insert into public.polls (bubble_id, question, options, is_active)
select id, 'Wer gewinnt heute?', '[{"key":"home","label":"Team Blau"},{"key":"draw","label":"Unentschieden"},{"key":"away","label":"Team Weiss"}]'::jsonb, true
from public.bubbles
where slug = 'testbubble'
and not exists (
  select 1 from public.polls where bubble_id = public.bubbles.id and is_active = true
);

insert into public.fan_battles (bubble_id, home_team, away_team, home_taps, away_taps, is_active)
select id, 'Team Blau', 'Team Weiss', 0, 0, true
from public.bubbles
where slug = 'testbubble'
and not exists (
  select 1 from public.fan_battles where bubble_id = public.bubbles.id and is_active = true
);
