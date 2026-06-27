insert into public.bubbles (
  slug,
  name,
  event_name,
  type,
  partner_name,
  description,
  logo_url,
  hero_image_url,
  primary_color,
  accent_color,
  reward_title,
  reward_description,
  reward_terms,
  features,
  config,
  is_active,
  updated_at
)
values (
  'public-viewing-quickborn',
  'Public Viewing Quickborn',
  'Public Viewing',
  'public_viewing',
  'Public Viewing Quickborn',
  'Deutschland vs. Paraguay Tipp-Gewinnspiel',
  '/public-viewing-quickborn/logo.jpg',
  '/public-viewing-quickborn/cover.png',
  '#dd0000',
  '#f7c800',
  'Das kannst du gewinnen',
  'Gib deinen genauen Ergebnistipp für Deutschland gegen Paraguay ab und nimm automatisch am Gewinnspiel teil. Exakte Treffer werden nach dem Spiel ausgewertet.',
  'Gewinner werden über die angegebene Telefonnummer oder E-Mail benachrichtigt.',
  '{"live":true,"community":true,"polls":false,"rewards":true,"peopleHere":true,"fanBattle":false,"sponsorCard":false}'::jsonb,
  '{
    "headline":"Deutschland vs. Paraguay",
    "subheadline":"Tipp abgeben & Gewinne sichern",
    "eventTitle":"Deutschland vs. Paraguay",
    "eventSubtitle":"Public Viewing Quickborn",
    "homeTeamName":"Deutschland",
    "awayTeamName":"Paraguay",
    "score_mode":"manual",
    "score_provider":"",
    "external_match_id":"",
    "actionBadge":"Tippspiel",
    "actionButtonText":"Tipp einreichen",
    "actionHint":"Tippe den exakten Spielstand.",
    "communityTitle":"Was ist eure Meinung?",
    "communitySubtitle":"Was geht heute? Schreib deinen Tipp oder deine Meinung in die Bubble.",
    "communityPlaceholder":"Dein Tipp oder deine Meinung zum Spiel ...",
    "communityRules":"Bleib freundlich. Posts sind öffentlich in dieser Bubble sichtbar.",
    "rewardLinked":true,
    "logoShape":"round",
    "logoFit":"contain",
    "logoBackground":"transparent",
    "logoSize":"large",
    "heroFit":"cover",
    "heroPositionX":"center",
    "heroPositionY":"top",
    "heroHeight":"large",
    "heroOverlay":"medium",
    "rewards":[
      {
        "active":true,
        "title":"Das kannst du gewinnen",
        "description":"2× 20 € Gutschein zum direkten Einlösen auf der Veranstaltung.",
        "code":"",
        "buttonText":"Hinweis ansehen",
        "hint":"Gewinner werden über die angegebene Telefonnummer oder E-Mail benachrichtigt."
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
  logo_url = excluded.logo_url,
  hero_image_url = excluded.hero_image_url,
  primary_color = excluded.primary_color,
  accent_color = excluded.accent_color,
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
  'Deutschland vs. Paraguay',
  'Deutschland',
  'Paraguay',
  'scheduled',
  now()
from public.bubbles
where slug = 'public-viewing-quickborn'
on conflict (bubble_id) do update set
  match_title = excluded.match_title,
  team_home = excluded.team_home,
  team_away = excluded.team_away,
  updated_at = now();
