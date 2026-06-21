-- ─── Storage buckets ─────────────────────────────────────────────────────────
-- Run this in the Supabase SQL editor or via: supabase db push

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('school-assets', 'school-assets', true,  5242880, array['image/jpeg','image/png','image/webp','image/gif']),
  ('avatars',        'avatars',        true,  5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- ─── Storage policies ─────────────────────────────────────────────────────────

-- Admins can upload logos and gallery images to school-assets
create policy "admins_upload_school_assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'school-assets'
    and (storage.foldername(name))[1] in ('logos', 'gallery')
  );

-- Anyone (authenticated) can read school assets (logos, gallery)
create policy "public_read_school_assets" on storage.objects
  for select using (bucket_id = 'school-assets');

-- Users can upload their own avatar
create policy "users_upload_own_avatar" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'avatars'
  );

-- Anyone can read avatars
create policy "public_read_avatars" on storage.objects
  for select using (bucket_id = 'avatars');

-- Service role bypasses all policies (used by upload API route)
