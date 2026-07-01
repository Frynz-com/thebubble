create table if not exists public.demo_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  mode text null check (mode is null or mode in ('visitor', 'dashboard')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.demo_events
  drop constraint if exists demo_events_event_name_check;

alter table public.demo_events
  add constraint demo_events_event_name_check
  check (
    event_name in (
      'demo_view',
      'demo_choose_visitor',
      'demo_choose_dashboard',
      'visitor_home_view',
      'visitor_action_view',
      'visitor_tip_submit',
      'visitor_reward_view',
      'reward_coupon_click',
      'reward_wallet_save',
      'dashboard_home_view',
      'dashboard_create_view',
      'dashboard_setup_view',
      'dashboard_contact_click',
      'demo_showcase_view',
      'demo_contact_click'
    )
  );

create index if not exists demo_events_created_idx
on public.demo_events (created_at desc);

create index if not exists demo_events_name_created_idx
on public.demo_events (event_name, created_at desc);

create index if not exists demo_events_mode_created_idx
on public.demo_events (mode, created_at desc);

alter table public.demo_events enable row level security;

comment on table public.demo_events is 'Anonymous The Bubble demo interaction events without personal data.';
