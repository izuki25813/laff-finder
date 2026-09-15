-- Fase 3: player profile
-- Script mínimo, idempotente e sem operações destrutivas.

create extension if not exists "pgcrypto";

create table if not exists public.player_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  nickname text,
  free_fire_id text,
  full_name text,
  avatar_url text,
  region text,
  state text,
  city text,
  primary_role text,
  secondary_role text,
  competitive_objective text,
  experience_level text,
  availability text,
  looking_for_team boolean not null default false,
  bio text,
  youtube_url text,
  instagram_url text,
  tiktok_url text,
  twitch_url text,
  discord_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = 'player_profiles'
      and t.tgname = 'player_profiles_updated_at'
  ) then
    create trigger player_profiles_updated_at
    before update on public.player_profiles
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

alter table public.player_profiles enable row level security;

create policy "player_profiles_select_public" on public.player_profiles
for select using (true);

create policy "player_profiles_insert_own" on public.player_profiles
for insert with check (
  auth.uid() = id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "player_profiles_update_own" on public.player_profiles
for update using (auth.uid() = id)
with check (
  auth.uid() = id
);

-- A política de delete não foi incluída para manter o escopo mínimo da Fase 3.
-- O objetivo desta etapa é somente criar e editar o próprio perfil competitivo.

-- Importante: o perfil público é somente leitura e não expõe email, role ou dados privados de profiles.
