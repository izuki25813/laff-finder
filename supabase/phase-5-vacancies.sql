-- Fase 5: team vacancies
-- Script mínimo, idempotente e sem operações destrutivas.

create table if not exists public.team_vacancies (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  role text not null,
  secondary_role text,
  experience_level text,
  competitive_objective text,
  region text,
  state text,
  city text,
  availability text,
  requirements text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_team_vacancies_team_id on public.team_vacancies(team_id);
create index if not exists idx_team_vacancies_status on public.team_vacancies(status);
create index if not exists idx_team_vacancies_role on public.team_vacancies(role);

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = 'team_vacancies'
      and t.tgname = 'team_vacancies_updated_at'
  ) then
    create trigger team_vacancies_updated_at
    before update on public.team_vacancies
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

alter table public.team_vacancies enable row level security;

create policy "team_vacancies_select_public_open" on public.team_vacancies
for select using (status = 'open');

create policy "team_vacancies_insert_own_team" on public.team_vacancies
for insert with check (
  auth.uid() = created_by
  and exists (
    select 1
    from public.teams t
    where t.id = team_id
      and t.owner_id = auth.uid()
  )
);

create policy "team_vacancies_update_own_team" on public.team_vacancies
for update using (
  exists (
    select 1
    from public.teams t
    where t.id = team_id
      and t.owner_id = auth.uid()
  )
)
with check (
  auth.uid() = created_by
  and exists (
    select 1
    from public.teams t
    where t.id = team_id
      and t.owner_id = auth.uid()
  )
);

create policy "team_vacancies_delete_own_team" on public.team_vacancies
for delete using (
  exists (
    select 1
    from public.teams t
    where t.id = team_id
      and t.owner_id = auth.uid()
  )
);

-- Importante: vagas públicas só aparecem em status 'open'.
-- Não expõe dados privados de profiles ou teams.
