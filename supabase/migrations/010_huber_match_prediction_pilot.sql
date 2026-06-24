create table if not exists public.match_predictions (
  id uuid primary key default gen_random_uuid(),
  bubble_id uuid not null references public.bubbles(id) on delete cascade,
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  display_name text,
  contact_value text,
  outcome_pick text not null check (outcome_pick in ('deutschland', 'unentschieden', 'ecuador')),
  exact_score_text text not null default '',
  germany_score integer check (germany_score is null or germany_score >= 0),
  ecuador_score integer check (ecuador_score is null or ecuador_score >= 0),
  parsed_outcome text check (parsed_outcome is null or parsed_outcome in ('deutschland', 'unentschieden', 'ecuador')),
  parse_status text not null default 'unparsed' check (parse_status in ('parsed', 'unparsed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bubble_id, visitor_id)
);

create table if not exists public.bubble_match_state (
  id uuid primary key default gen_random_uuid(),
  bubble_id uuid not null references public.bubbles(id) on delete cascade,
  match_title text not null default 'Deutschland vs. Ecuador',
  team_home text not null default 'Deutschland',
  team_away text not null default 'Ecuador',
  current_germany_score integer check (current_germany_score is null or current_germany_score >= 0),
  current_ecuador_score integer check (current_ecuador_score is null or current_ecuador_score >= 0),
  final_germany_score integer check (final_germany_score is null or final_germany_score >= 0),
  final_ecuador_score integer check (final_ecuador_score is null or final_ecuador_score >= 0),
  match_status text not null default 'scheduled' check (match_status in ('scheduled', 'live', 'final')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bubble_id)
);

create index if not exists match_predictions_bubble_updated_idx
on public.match_predictions (bubble_id, updated_at desc);

create index if not exists match_predictions_bubble_outcome_idx
on public.match_predictions (bubble_id, outcome_pick);

alter table public.match_predictions enable row level security;
alter table public.bubble_match_state enable row level security;

drop policy if exists "anon can create match predictions for active bubbles" on public.match_predictions;
create policy "anon can create match predictions for active bubbles"
on public.match_predictions for insert
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

drop policy if exists "anon can update match predictions for active bubbles" on public.match_predictions;
create policy "anon can update match predictions for active bubbles"
on public.match_predictions for update
to anon
using (
  exists (
    select 1
    from public.visitors v
    join public.bubbles b on b.id = v.bubble_id
    where v.id = visitor_id
      and v.bubble_id = bubble_id
      and b.is_active = true
  )
)
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

drop policy if exists "match state in active bubbles is public" on public.bubble_match_state;
create policy "match state in active bubbles is public"
on public.bubble_match_state for select
to anon
using (exists (select 1 from public.bubbles b where b.id = bubble_id and b.is_active = true));

grant insert, update on public.match_predictions to anon;
grant select on public.bubble_match_state to anon;

insert into public.bubbles (
  slug,
  name,
  event_name,
  type,
  partner_name,
  description,
  reward_title,
  reward_description,
  reward_terms,
  features,
  config,
  is_active,
  updated_at
)
values (
  'huber-arena',
  'Huber Arena',
  'Public Viewing',
  'public_viewing',
  'Huber Arena',
  'Deutschland vs. Ecuador Tipp-Gewinnspiel',
  'Das kannst du gewinnen',
  '10x 15 € Verzehrkarte für die Huber Arena, 1x 20 % adidas Rabattgutschein, 1x 15 % JD Sports Rabattgutschein und 1x 15 % ABOUT YOU Rabattgutschein.',
  'Der Gewinner wird über die angegebene Telefonnummer oder E-Mail benachrichtigt.',
  '{"live":true,"community":true,"polls":false,"rewards":true,"peopleHere":true,"fanBattle":false,"sponsorCard":false}'::jsonb,
  '{
    "headline":"Deutschland vs. Ecuador",
    "subheadline":"Tipp abgeben & Gewinne sichern",
    "eventTitle":"Deutschland vs. Ecuador",
    "eventSubtitle":"Tipp abgeben & Gewinne sichern",
    "communityTitle":"Was ist eure Meinung?",
    "communitySubtitle":"Was geht heute? Schreib deinen Tipp oder deine Meinung in die Bubble.",
    "communityPlaceholder":"Dein Tipp oder deine Meinung zum Spiel ...",
    "communityRules":"Bleib freundlich. Posts sind öffentlich in dieser Bubble sichtbar.",
    "rewardLinked":true,
    "rewards":[
      {
        "active":true,
        "title":"Das kannst du gewinnen",
        "description":"10x 15 € Verzehrkarte für die Huber Arena, 1x 20 % adidas Rabattgutschein, 1x 15 % JD Sports Rabattgutschein und 1x 15 % ABOUT YOU Rabattgutschein.",
        "code":"",
        "buttonText":"Hinweis ansehen",
        "hint":"Der Gewinner wird über die angegebene Telefonnummer oder E-Mail benachrichtigt."
      }
    ]
  }'::jsonb,
  true,
  now()
)
on conflict (slug) do update set
  name = excluded.name,
  event_name = excluded.event_name,
  type = excluded.type,
  partner_name = excluded.partner_name,
  description = excluded.description,
  reward_title = excluded.reward_title,
  reward_description = excluded.reward_description,
  reward_terms = excluded.reward_terms,
  features = coalesce(public.bubbles.features, '{}'::jsonb) || excluded.features,
  config = coalesce(public.bubbles.config, '{}'::jsonb) || excluded.config,
  is_active = true,
  updated_at = now();

insert into public.bubble_match_state (
  bubble_id,
  match_title,
  team_home,
  team_away,
  match_status,
  updated_at
)
select
  id,
  'Deutschland vs. Ecuador',
  'Deutschland',
  'Ecuador',
  'scheduled',
  now()
from public.bubbles
where slug = 'huber-arena'
on conflict (bubble_id) do update set
  match_title = excluded.match_title,
  team_home = excluded.team_home,
  team_away = excluded.team_away,
  updated_at = now();

do $$
begin
  begin
    alter publication supabase_realtime add table public.match_predictions;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.bubble_match_state;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
