-- Fase 4: teams / LAFFs
-- Script mínimo, idempotente e sem operações destrutivas.

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  tag text,
  logo_url text,
  description text,
  region text,
  state text,
  city text,
  competitive_level text,
  main_game text not null default 'Free Fire',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_teams_owner_id on public.teams(owner_id);

create index if not exists idx_teams_status on public.teams(status);

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = 'teams'
      and t.tgname = 'teams_updated_at'
  ) then
    create trigger teams_updated_at
    before update on public.teams
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

alter table public.teams enable row level security;

create policy "teams_select_public_active" on public.teams
for select using (status = 'active');

create policy "teams_insert_own" on public.teams
for insert with check (
  auth.uid() = owner_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
  )
);

create policy "teams_update_own" on public.teams
for update using (auth.uid() = owner_id)
with check (
  auth.uid() = owner_id
);

create policy "teams_delete_own" on public.teams
for delete using (auth.uid() = owner_id);

-- Importante: a consulta pública só mostra times ativos.
-- Não expõe dados privados de profiles.
