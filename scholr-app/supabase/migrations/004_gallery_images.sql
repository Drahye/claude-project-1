-- Gallery images table
-- Replaces the localStorage approach so images persist across devices/browsers

create table if not exists gallery_images (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references schools(id) on delete cascade,
  storage_path text not null,           -- e.g. gallery/school-id/1234567890.jpg
  url         text not null,            -- public CDN URL
  name        text not null,            -- original filename
  uploaded_by uuid references profiles(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

-- Index for fast school-scoped queries
create index if not exists gallery_images_school_id_idx on gallery_images(school_id);

-- RLS
alter table gallery_images enable row level security;

-- Admins of the school can read/insert/delete
create policy "school admins can manage gallery"
  on gallery_images
  for all
  using (
    school_id in (
      select school_id from profiles
      where id = auth.uid()
        and role in ('admin', 'super_admin')
    )
  );

-- Any authenticated member of the school can view (for public school page use)
create policy "school members can view gallery"
  on gallery_images
  for select
  using (
    school_id in (
      select school_id from profiles where id = auth.uid()
    )
  );
