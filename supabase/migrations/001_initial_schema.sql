-- ============================================================================
-- Ecotrax: Full Database Schema Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ─── 1. Profiles ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null,
  avatar_url  text,
  xp          integer not null default 0,
  home_latitude  numeric,
  home_longitude numeric,
  created_at  timestamptz not null default now()
);

-- ─── 2. Reports ──────────────────────────────────────────────────────────────
-- Sequence for human-readable reference codes
create sequence if not exists public.report_ref_seq start 1;

create table if not exists public.reports (
  id                uuid primary key default gen_random_uuid(),
  reference_code    text unique not null default '',
  user_id           uuid not null references public.profiles(id) on delete cascade,
  title             text not null,
  summary           text,
  description       text not null,
  category          text not null
                      check (category in ('air', 'water', 'garbage', 'noise')),
  status            text not null default 'Reported'
                      check (status in ('Reported', 'Resolved', 'open', 'in_progress', 'needs_verification', 'resolved', 'rejected', 'archived')),
  location_text     text not null,
  latitude          numeric not null,
  longitude         numeric not null,
  address_text      text,
  geolocation_source text,
  -- Images stored as JSONB array: [{storage_path, image_url, caption, is_primary}]
  images            jsonb not null default '[]'::jsonb,
  verification_count integer not null default 0,
  duplicate_count    integer not null default 0,
  is_verified       boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  resolved_at       timestamptz
);

-- Indexes for reports
create index if not exists idx_reports_status     on public.reports (status);
create index if not exists idx_reports_category   on public.reports (category);
create index if not exists idx_reports_created_at on public.reports (created_at desc);
create index if not exists idx_reports_coords     on public.reports (latitude, longitude);
create index if not exists idx_reports_user_id    on public.reports (user_id);

-- ─── 3. Report Duplicates ────────────────────────────────────────────────────
create table if not exists public.report_duplicates (
  id               uuid primary key default gen_random_uuid(),
  report_id        uuid not null references public.reports(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  description      text,
  latitude         numeric,
  longitude        numeric,
  match_confidence numeric,
  created_at       timestamptz not null default now()
);

-- ─── 4. Report Updates ──────────────────────────────────────────────────────
create table if not exists public.report_updates (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  update_type text not null
                check (update_type in ('verified', 'edited', 'resolved', 'reopened')),
  note        text,
  image_url   text,
  created_at  timestamptz not null default now()
);

-- ─── 5. Verification Prompts ────────────────────────────────────────────────
create table if not exists public.verification_prompts (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'pending'
                check (status in ('pending', 'accepted', 'ignored', 'completed', 'expired')),
  sent_at     timestamptz,
  responded_at timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- ─── 6. Activities ──────────────────────────────────────────────────────────
create table if not exists public.activities (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  description      text not null,
  category         text not null,
  image_url        text,
  latitude         numeric,
  longitude        numeric,
  location_text    text,
  start_time       timestamptz not null,
  end_time         timestamptz,
  xp_reward        integer not null default 0,
  max_participants integer,
  created_by       uuid not null references public.profiles(id) on delete cascade,
  status           text not null default 'upcoming'
                     check (status in ('upcoming', 'active', 'completed', 'cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_activities_status     on public.activities (status);
-- ─── 8. Global Stats ──────────────────────────────────────────────────────────
create table if not exists public.stats (
  id               text primary key,
  total_reports    integer not null default 0,
  total_users      integer not null default 0,
  lifetime_visits  integer not null default 0,
  updated_at       timestamptz not null default now()
);

-- Insert initial global stats row
insert into public.stats (id, total_reports, total_users, lifetime_visits)
values ('global', 0, 0, 0)
on conflict (id) do nothing;

-- ─── 7. Activity Participants ───────────────────────────────────────────────
create table if not exists public.activity_participants (
  id                uuid primary key default gen_random_uuid(),
  activity_id       uuid not null references public.activities(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  joined_at         timestamptz not null default now(),
  attendance_status text not null default 'joined',
  xp_awarded        boolean not null default false,
  unique (activity_id, user_id)
);

create index if not exists idx_activity_participants_user on public.activity_participants (user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- ─── Auto-create profile on signup ──────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  );
  return new;
end;
$$;

-- Drop if exists to allow re-running
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Auto-generate reference code ──────────────────────────────────────────
create or replace function public.generate_reference_code()
returns trigger
language plpgsql
as $$
begin
  new.reference_code := 'ECO-' || lpad(nextval('public.report_ref_seq')::text, 5, '0');
  return new;
end;
$$;

-- Drop if exists to allow re-running
drop trigger if exists trg_generate_reference_code on public.reports;
create trigger trg_generate_reference_code
  before insert on public.reports
  for each row execute function public.generate_reference_code();

-- ─── Auto-update updated_at ────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Drop if exists to allow re-running
drop trigger if exists trg_reports_updated_at on public.reports;
create trigger trg_reports_updated_at
  before update on public.reports
  for each row execute function public.set_updated_at();

drop trigger if exists trg_activities_updated_at on public.activities;
create trigger trg_activities_updated_at
  before update on public.activities
  for each row execute function public.set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- ─── Profiles ───────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ─── Reports ────────────────────────────────────────────────────────────────
alter table public.reports enable row level security;

create policy "Reports are viewable by everyone"
  on public.reports for select
  using (true);

create policy "Authenticated users can create reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reports"
  on public.reports for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Report Duplicates ─────────────────────────────────────────────────────
alter table public.report_duplicates enable row level security;

create policy "Report duplicates are viewable by everyone"
  on public.report_duplicates for select
  using (true);

create policy "Authenticated users can create duplicate confirmations"
  on public.report_duplicates for insert
  with check (auth.uid() = user_id);

-- ─── Report Updates ────────────────────────────────────────────────────────
alter table public.report_updates enable row level security;

create policy "Report updates are viewable by everyone"
  on public.report_updates for select
  using (true);

create policy "Authenticated users can create report updates"
  on public.report_updates for insert
  with check (auth.uid() = user_id);

-- ─── Verification Prompts ──────────────────────────────────────────────────
alter table public.verification_prompts enable row level security;

create policy "Users can view their own verification prompts"
  on public.verification_prompts for select
  using (auth.uid() = user_id);

create policy "Authenticated users can respond to prompts"
  on public.verification_prompts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Activities ─────────────────────────────────────────────────────────────
alter table public.activities enable row level security;

create policy "Activities are viewable by everyone"
  on public.activities for select
  using (true);

create policy "Authenticated users can create activities"
  on public.activities for insert
  with check (auth.uid() = created_by);

create policy "Activity creators can update their activities"
  on public.activities for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- ─── Activity Participants ──────────────────────────────────────────────────
alter table public.activity_participants enable row level security;

create policy "Activity participants are viewable by everyone"
  on public.activity_participants for select
  using (true);

create policy "Authenticated users can join activities"
  on public.activity_participants for insert
  with check (auth.uid() = user_id);

create policy "Users can leave activities"
  on public.activity_participants for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- HELPER RPC FUNCTIONS
-- ============================================================================

-- Find nearby reports of same category for duplicate detection (bounding box)
create or replace function public.find_nearby_duplicates(
  p_lat numeric,
  p_lng numeric,
  p_category text,
  p_radius_km numeric default 0.5
)
returns setof public.reports
language sql
stable
as $$
  -- Approximate: 1 degree latitude ≈ 111km
  select *
  from public.reports
  where category = p_category
    and status in ('Reported', 'open', 'in_progress')
    and latitude  between p_lat - (p_radius_km / 111.0)
                      and p_lat + (p_radius_km / 111.0)
    and longitude between p_lng - (p_radius_km / (111.0 * cos(radians(p_lat))))
                      and p_lng + (p_radius_km / (111.0 * cos(radians(p_lat))))
  order by created_at desc
  limit 10;
$$;

-- Fetch reports within a map viewport with optional category filter
create or replace function public.get_reports_for_map(
  p_min_lat numeric,
  p_max_lat numeric,
  p_min_lng numeric,
  p_max_lng numeric,
  p_category text default null
)
returns setof public.reports
language sql
stable
as $$
  select *
  from public.reports
  where latitude  between p_min_lat and p_max_lat
    and longitude between p_min_lng and p_max_lng
    and (p_category is null or category = p_category)
  order by created_at desc
  limit 200;
$$;

-- Atomically increment user XP
create or replace function public.increment_xp(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set xp = xp + p_amount
  where id = p_user_id;
end;
$$;

-- ─── 9. Lifetime Visits RPC ──────────────────────────────────────────────────
create or replace function public.increment_lifetime_visits()
returns void
language plpgsql
security definer
as $$
begin
  update public.stats
  set lifetime_visits = lifetime_visits + 1
  where id = 'global';
end;
$$;

-- ─── 10. Auto-update stats on data changes ──────────────────────────────────
create or replace function public.update_global_stats_on_report()
returns trigger 
language plpgsql 
security definer 
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.stats set total_reports = total_reports + 1 where id = 'global';
  elsif (TG_OP = 'DELETE') then
    update public.stats set total_reports = total_reports - 1 where id = 'global';
  end if;
  return null;
end; 
$$;

create trigger trg_update_stats_on_report
after insert or delete on public.reports
for each row execute function public.update_global_stats_on_report();

create or replace function public.update_global_stats_on_user()
returns trigger 
language plpgsql 
security definer 
as $$
begin
  if (TG_OP = 'INSERT') then
    update public.stats set total_users = total_users + 1 where id = 'global';
  elsif (TG_OP = 'DELETE') then
    update public.stats set total_users = total_users - 1 where id = 'global';
  end if;
  return null;
end; 
$$;

create trigger trg_update_stats_on_user
after insert or delete on public.profiles
for each row execute function public.update_global_stats_on_user();