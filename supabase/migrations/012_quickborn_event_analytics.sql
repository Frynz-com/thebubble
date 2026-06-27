create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  bubble_id uuid not null references public.bubbles(id) on delete cascade,
  visitor_id uuid references public.visitors(id) on delete set null,
  session_id text,
  anonymous_session_id text,
  event_type text not null,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  device_type text not null default 'desktop' check (device_type in ('mobile', 'tablet', 'desktop')),
  created_at timestamptz not null default now()
);

alter table public.analytics_events
  add column if not exists anonymous_session_id text;

update public.analytics_events
set anonymous_session_id = coalesce(anonymous_session_id, session_id)
where anonymous_session_id is null;

alter table public.analytics_events
  drop constraint if exists analytics_events_event_type_check;

alter table public.analytics_events
  add constraint analytics_events_event_type_check
  check (
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
      'module_click',
      'landing_view',
      'landing_cta_click',
      'privacy_open',
      'terms_open',
      'live_view',
      'score_input_start',
      'score_submit_attempt',
      'score_submit_success',
      'contact_modal_open',
      'contact_submit_attempt',
      'contact_submit_success',
      'benefits_view',
      'benefits_click',
      'community_view',
      'community_post_attempt',
      'community_post_success',
      'tab_live_click',
      'tab_community_click',
      'tab_benefits_click',
      'cta_community_click',
      'cta_benefits_click'
    )
  );

create index if not exists analytics_events_anonymous_session_idx
on public.analytics_events (bubble_id, anonymous_session_id);

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
