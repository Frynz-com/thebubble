-- Allow iPhone Safari/WebKit JPEG fallback for profile image uploads.

drop policy if exists "anon can upload visitor profile images" on storage.objects;
create policy "anon can upload visitor profile images"
on storage.objects for insert
to anon
with check (
  bucket_id = 'profile-images'
  and split_part(name, '/', 1) <> ''
  and split_part(name, '/', 2) <> ''
  and split_part(name, '/', 3) in ('avatar.webp', 'avatar.jpg')
  and (
    lower(name) like '%.webp'
    or lower(name) like '%.jpg'
  )
  and exists (
    select 1
    from public.visitors v
    join public.bubbles b on b.id = v.bubble_id
    where v.bubble_id::text = split_part(name, '/', 1)
      and v.id::text = split_part(name, '/', 2)
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
    where v.bubble_id::text = split_part(name, '/', 1)
      and v.id::text = split_part(name, '/', 2)
      and b.is_active = true
  )
)
with check (
  bucket_id = 'profile-images'
  and split_part(name, '/', 1) <> ''
  and split_part(name, '/', 2) <> ''
  and split_part(name, '/', 3) in ('avatar.webp', 'avatar.jpg')
  and (
    lower(name) like '%.webp'
    or lower(name) like '%.jpg'
  )
  and exists (
    select 1
    from public.visitors v
    join public.bubbles b on b.id = v.bubble_id
    where v.bubble_id::text = split_part(name, '/', 1)
      and v.id::text = split_part(name, '/', 2)
      and b.is_active = true
  )
);
