alter table public.bubbles
  alter column features set default '{}'::jsonb,
  alter column config set default '{}'::jsonb;

update public.bubbles
set
  features = jsonb_build_object(
    'live', true,
    'community', true,
    'polls', true,
    'fanBattle', false,
    'rewards', true,
    'peopleHere', true,
    'sponsorCard', false
  ) || coalesce(features, '{}'::jsonb),
  config = jsonb_build_object(
    'headline', 'Willkommen in deiner Bubble',
    'subheadline', 'Scannen, beitreten, live dabei sein.',
    'eventTitle', 'Live-Aktion',
    'eventSubtitle', 'Mach mit und sichere dir Vorteile vor Ort.',
    'backgroundStyle', '',
    'score_mode', 'manual',
    'score_provider', '',
    'external_match_id', '',
    'homeTeamName', '',
    'awayTeamName', '',
    'homeScore', '0',
    'awayScore', '0',
    'scoreText', 'Live',
    'pollQuestion', 'Was denkst du?',
    'pollOptions', 'Option A\nOption B',
    'pollHint', '',
    'rewardLinked', false,
    'communityTitle', 'Community',
    'communitySubtitle', 'Schreib kurz etwas in die Bubble.',
    'communityPlaceholder', 'Dein Kommentar zum Moment ...',
    'challengeTitle', 'Live-Aktion',
    'challengeDescription', 'Mach mit und sichere dir Vorteile vor Ort.',
    'voteTitle', 'Was denkst du?',
    'rewardCta', 'Vorteil sichern',
    'rewardCode', 'BUBBLE',
    'sponsorName', '',
    'sponsorBannerUrl', '',
    'sponsorText', '',
    'sponsorCtaText', '',
    'sponsorCtaLink', ''
  ) || coalesce(config, '{}'::jsonb),
  updated_at = coalesce(updated_at, now());

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  bubble_id uuid not null references public.bubbles(id) on delete cascade,
  visitor_id uuid references public.visitors(id) on delete set null,
  session_id text,
  event_type text not null check (
    event_type in (
      'page_view',
      'enter_bubble',
      'anonymous_continue',
      'profile_create',
      'poll_vote',
      'community_post',
      'reward_view',
      'reward_claim',
      'sponsor_click',
      'module_click'
    )
  ),
  path text,
  metadata jsonb not null default '{}'::jsonb,
  device_type text not null default 'desktop' check (device_type in ('mobile', 'tablet', 'desktop')),
  created_at timestamptz not null default now()
);

create index if not exists analytics_events_bubble_created_idx
on public.analytics_events (bubble_id, created_at desc);

create index if not exists analytics_events_bubble_type_idx
on public.analytics_events (bubble_id, event_type, created_at desc);

create index if not exists analytics_events_session_idx
on public.analytics_events (bubble_id, session_id);

alter table public.analytics_events enable row level security;

drop policy if exists "anon can create analytics events for active bubbles" on public.analytics_events;
create policy "anon can create analytics events for active bubbles"
on public.analytics_events for insert
to anon
with check (
  exists (
    select 1
    from public.bubbles b
    where b.id = bubble_id
      and b.is_active = true
  )
  and (
    visitor_id is null
    or exists (
      select 1
      from public.visitors v
      where v.id = visitor_id
        and v.bubble_id = bubble_id
    )
  )
);

grant insert on public.analytics_events to anon;
