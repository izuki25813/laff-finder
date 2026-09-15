-- Fase 6: índices mínimos recomendados para busca pública
-- Arquivo apenas de auditoria e preparação. Não executado neste ambiente.

create index if not exists idx_player_profiles_primary_role
  on public.player_profiles (primary_role);

create index if not exists idx_player_profiles_secondary_role
  on public.player_profiles (secondary_role);

create index if not exists idx_player_profiles_region
  on public.player_profiles (region);

create index if not exists idx_player_profiles_state
  on public.player_profiles (state);

create index if not exists idx_player_profiles_city
  on public.player_profiles (city);

create index if not exists idx_player_profiles_experience_level
  on public.player_profiles (experience_level);

create index if not exists idx_player_profiles_competitive_objective
  on public.player_profiles (competitive_objective);

create index if not exists idx_player_profiles_availability
  on public.player_profiles (availability);

create index if not exists idx_player_profiles_looking_for_team
  on public.player_profiles (looking_for_team);

-- Os índices da Fase 5 já existem para team_vacancies:
-- idx_team_vacancies_team_id
-- idx_team_vacancies_status
-- idx_team_vacancies_role

-- Os índices abaixo são recomendados apenas quando a consulta pública
-- de vagas começar a ser realmente pesada em produção.
create index if not exists idx_team_vacancies_experience_level
  on public.team_vacancies (experience_level);

create index if not exists idx_team_vacancies_competitive_objective
  on public.team_vacancies (competitive_objective);

create index if not exists idx_team_vacancies_availability
  on public.team_vacancies (availability);

create index if not exists idx_team_vacancies_city
  on public.team_vacancies (city);
