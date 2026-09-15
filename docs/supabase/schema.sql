-- Base schema for LAFF Finder evolution.
-- This keeps the public MVP working while preparing a secure auth layer.

create extension if not exists "uuid-ossp";

create type user_role as enum ('USER', 'ADMIN');

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  nickname text,
  avatar_url text,
  role user_role not null default 'USER',
  ff_id text,
  main_role text,
  secondary_role text,
  region text,
  competitive_goal text,
  experience text,
  availability text,
  description text,
  social_links jsonb default '{}'::jsonb,
  gameplay_links jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  short_name text,
  owner_id uuid references profiles(id) on delete set null,
  description text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists player_profiles (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  platform text,
  rank text,
  preferred_role text,
  availability text,
  bio text,
  discord text,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists waitlist_entries (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete set null,
  source text not null default 'legacy',
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists feedback_items (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references profiles(id) on delete set null,
  title text,
  content text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
before update on profiles
for each row execute function update_updated_at_column();

create trigger player_profiles_updated_at
before update on player_profiles
for each row execute function update_updated_at_column();

alter table profiles enable row level security;
alter table teams enable row level security;
alter table player_profiles enable row level security;
alter table waitlist_entries enable row level security;
alter table feedback_items enable row level security;

create policy "profiles_select_own" on profiles
for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
for insert with check (
  auth.uid() = id
  and role = 'USER'
);

create policy "profiles_update_own" on profiles
for update using (auth.uid() = id) with check (
  auth.uid() = id
  and role = (select p.role from public.profiles p where p.id = auth.uid())
);

create policy "profiles_admin_read_all" on profiles
for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'ADMIN'
  )
);

create policy "teams_select_public" on teams
for select using (true);

create policy "teams_manage_own" on teams
for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "player_profiles_select_own" on player_profiles
for select using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.id = player_profiles.profile_id
  )
);

create policy "player_profiles_update_own" on player_profiles
for update using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.id = player_profiles.profile_id
  )
) with check (
  exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.id = player_profiles.profile_id
  )
);

create policy "waitlist_read_public" on waitlist_entries
for select using (true);

create policy "waitlist_manage_own" on waitlist_entries
for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create policy "feedback_read_public" on feedback_items
for select using (true);

create policy "feedback_manage_own" on feedback_items
for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'USER'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(excluded.full_name, profiles.full_name),
      updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
