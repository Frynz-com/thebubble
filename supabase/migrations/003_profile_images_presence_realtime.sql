-- Profile images and explicit presence fields for the public MVP.

alter table public.visitors
  add column if not exists joined_at timestamptz not null default now(),
  add column if not exists left_at timestamptz,
  add column if not exists is_active boolean not null default true;

update public.visitors
set
  joined_at = coalesce(joined_at, created_at),
  is_active = coalesce(is_active, true)
where joined_at is null
   or is_active is null;

create index if not exists visitors_bubble_active_seen_idx
on public.visitors (bubble_id, is_active, last_seen_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile images are public" on storage.objects;
create policy "profile images are public"
on storage.objects for select
to anon
using (bucket_id = 'profile-images');

drop policy if exists "anon can upload visitor profile images" on storage.objects;
create policy "anon can upload visitor profile images"
on storage.objects for insert
to anon
with check (
  bucket_id = 'profile-images'
  and (storage.foldername(name))[1] is not null
  and (storage.foldername(name))[2] is not null
  and lower(name) like '%.webp'
  and exists (
    select 1
    from public.visitors v
    join public.bubbles b on b.id = v.bubble_id
    where v.bubble_id::text = (storage.foldername(name))[1]
      and v.id::text = (storage.foldername(name))[2]
      and b.is_active = true
  )
);

drop policy if exists "anon can update visitor profile images" on storage.objects;
create policy "anon can update visitor profile images"
on storage.objects for update
to anon
using (
  bucket_id = 'profile-images'
  and exists (
    select 1
    from public.visitors v
    join public.bubbles b on b.id = v.bubble_id
    where v.bubble_id::text = (storage.foldername(name))[1]
      and v.id::text = (storage.foldername(name))[2]
      and b.is_active = true
  )
)
with check (
  bucket_id = 'profile-images'
  and lower(name) like '%.webp'
  and exists (
    select 1
    from public.visitors v
    join public.bubbles b on b.id = v.bubble_id
    where v.bubble_id::text = (storage.foldername(name))[1]
      and v.id::text = (storage.foldername(name))[2]
      and b.is_active = true
  )
);

drop policy if exists "anon can upsert active visitors" on public.visitors;
drop policy if exists "anon can update visitors in active bubbles" on public.visitors;
create policy "anon can update visitors in active bubbles"
on public.visitors for update
to anon
using (exists (select 1 from public.bubbles b where b.id = bubble_id and b.is_active = true))
with check (exists (select 1 from public.bubbles b where b.id = bubble_id and b.is_active = true));

do $$
begin
  alter publication supabase_realtime add table public.fan_battle_entries;
exception when duplicate_object then null;
end $$;
