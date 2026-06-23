alter table public.bubbles
  add column if not exists type text,
  add column if not exists partner_name text,
  add column if not exists description text,
  add column if not exists logo_url text,
  add column if not exists hero_image_url text,
  add column if not exists primary_color text,
  add column if not exists accent_color text,
  add column if not exists reward_title text,
  add column if not exists reward_description text,
  add column if not exists reward_terms text,
  add column if not exists features jsonb not null default '{}'::jsonb,
  add column if not exists config jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz;

create index if not exists bubbles_slug_idx on public.bubbles (slug);
create index if not exists bubbles_type_idx on public.bubbles (type);

update public.bubbles
set
  type = coalesce(type, event_name),
  partner_name = coalesce(partner_name, name),
  features = case
    when features = '{}'::jsonb then
      jsonb_build_object(
        'community', true,
        'polls', true,
        'fanBattle', true,
        'rewards', true,
        'peopleHere', true,
        'sponsorCard', true
      )
    else features
  end,
  config = case
    when config = '{}'::jsonb then
      jsonb_build_object(
        'headline', 'Willkommen in deiner Matchday Bubble',
        'subheadline', 'Kein Download. Dauert 5 Sekunden.',
        'eventTitle', 'Live-Aktion',
        'eventSubtitle', 'Mach mit und sichere dir Vorteile vor Ort.',
        'challengeTitle', 'Zeig deinen Fanmoment',
        'challengeDescription', 'Poste deinen besten Moment und sichere dir deine Gewinnchance.',
        'voteTitle', 'Wer gewinnt heute?',
        'rewardCta', 'Einlösen',
        'rewardCode', 'BUBBLE'
      )
    else config
  end,
  updated_at = coalesce(updated_at, now());
