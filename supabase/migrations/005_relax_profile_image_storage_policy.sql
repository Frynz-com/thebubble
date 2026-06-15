-- Relax profile image Storage RLS for the unauthenticated MVP.
-- Scope stays limited to the profile-images bucket and avatar-like object paths.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-images',
  'profile-images',
  true,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile images are public" on storage.objects;
drop policy if exists "anon can upload visitor profile images" on storage.objects;
drop policy if exists "anon can update visitor profile images" on storage.objects;
drop policy if exists "anon can read profile images" on storage.objects;
drop policy if exists "anon can insert profile images" on storage.objects;
drop policy if exists "anon can update profile images" on storage.objects;

create policy "anon can read profile images"
on storage.objects for select
to anon
using (bucket_id = 'profile-images');

create policy "anon can insert profile images"
on storage.objects for insert
to anon
with check (
  bucket_id = 'profile-images'
  and split_part(name, '/', 1) <> ''
  and split_part(name, '/', 2) <> ''
  and split_part(name, '/', 3) <> ''
  and split_part(name, '/', 4) = ''
  and split_part(name, '/', 3) in ('avatar.jpg', 'avatar.jpeg', 'avatar.png', 'avatar.webp')
  and (
    lower(name) like '%.jpg'
    or lower(name) like '%.jpeg'
    or lower(name) like '%.png'
    or lower(name) like '%.webp'
  )
);

create policy "anon can update profile images"
on storage.objects for update
to anon
using (
  bucket_id = 'profile-images'
  and split_part(name, '/', 1) <> ''
  and split_part(name, '/', 2) <> ''
  and split_part(name, '/', 3) <> ''
  and split_part(name, '/', 4) = ''
  and split_part(name, '/', 3) in ('avatar.jpg', 'avatar.jpeg', 'avatar.png', 'avatar.webp')
  and (
    lower(name) like '%.jpg'
    or lower(name) like '%.jpeg'
    or lower(name) like '%.png'
    or lower(name) like '%.webp'
  )
)
with check (
  bucket_id = 'profile-images'
  and split_part(name, '/', 1) <> ''
  and split_part(name, '/', 2) <> ''
  and split_part(name, '/', 3) <> ''
  and split_part(name, '/', 4) = ''
  and split_part(name, '/', 3) in ('avatar.jpg', 'avatar.jpeg', 'avatar.png', 'avatar.webp')
  and (
    lower(name) like '%.jpg'
    or lower(name) like '%.jpeg'
    or lower(name) like '%.png'
    or lower(name) like '%.webp'
  )
);
