-- Fase 7: candidaturas de jogadores para vagas de time
-- Arquivo de referência apenas. Não executado neste ambiente.

create table if not exists public.team_applications (
  id uuid primary key default gen_random_uuid(),
  vacancy_id uuid not null references public.team_vacancies(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_applications
  add constraint team_applications_status_check
  check (status in ('pending', 'accepted', 'rejected', 'cancelled'));

create unique index if not exists idx_team_applications_unique_vacancy_player
  on public.team_applications(vacancy_id, player_id);

create index if not exists idx_team_applications_vacancy_id
  on public.team_applications(vacancy_id);

create index if not exists idx_team_applications_team_id
  on public.team_applications(team_id);

create index if not exists idx_team_applications_player_id
  on public.team_applications(player_id);

create index if not exists idx_team_applications_status
  on public.team_applications(status);

-- Trigger para atualizar updated_at no update.
do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = 'team_applications'
      and t.tgname = 'team_applications_updated_at'
  ) then
    create trigger team_applications_updated_at
    before update on public.team_applications
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

alter table public.team_applications enable row level security;

create policy "team_applications_select_own" on public.team_applications
for select using (
  player_id = auth.uid()
);

create policy "team_applications_select_team_owner" on public.team_applications
for select using (
  exists (
    select 1
    from public.teams t
    where t.id = team_id
      and t.owner_id = auth.uid()
  )
);

create policy "team_applications_insert_own" on public.team_applications
for insert with check (
  player_id = auth.uid()
  and exists (
    select 1
    from public.team_vacancies v
    where v.id = vacancy_id
      and v.status = 'open'
  )
  and exists (
    select 1
    from public.teams t
    where t.id = team_id
      and t.id = (
        select v.team_id
        from public.team_vacancies v
        where v.id = vacancy_id
      )
  )
  and not exists (
    select 1
    from public.teams t
    where t.id = (
      select v.team_id
      from public.team_vacancies v
      where v.id = vacancy_id
    )
      and t.owner_id = auth.uid()
  )
);

create or replace function public.team_applications_validate_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vacancy_team_id uuid;
  v_vacancy_owner_id uuid;
begin
  if TG_OP = 'INSERT' then
    if NEW.player_id is null or NEW.player_id <> auth.uid() then
      raise exception 'O jogador precisa ser o usuário autenticado.';
    end if;

    if NEW.vacancy_id is null or NEW.team_id is null then
      raise exception 'Vacancy_id e team_id são obrigatórios.';
    end if;

    if NEW.status is null or NEW.status <> 'pending' then
      raise exception 'A candidatura só pode ser criada com status pending.';
    end if;

    if not exists (
      select 1
      from public.team_vacancies v
      where v.id = NEW.vacancy_id
        and v.status = 'open'
    ) then
      raise exception 'A vaga precisa existir e estar aberta.';
    end if;

    select v.team_id into v_vacancy_team_id
    from public.team_vacancies v
    where v.id = NEW.vacancy_id;

    if v_vacancy_team_id is null then
      raise exception 'A vaga precisa pertencer a um time válido.';
    end if;

    if NEW.team_id <> v_vacancy_team_id then
      raise exception 'team_id precisa corresponder ao time da vaga.';
    end if;

    if exists (
      select 1
      from public.teams t
      where t.id = NEW.team_id
        and t.owner_id = NEW.player_id
    ) then
      raise exception 'O jogador não pode se candidatar ao próprio time.';
    end if;

    if exists (
      select 1
      from public.team_applications a
      where a.vacancy_id = NEW.vacancy_id
        and a.player_id = NEW.player_id
    ) then
      raise exception 'O jogador não pode se candidatar duas vezes à mesma vaga.';
    end if;

    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    if NEW.vacancy_id <> OLD.vacancy_id then
      raise exception 'vacancy_id não pode ser alterado.';
    end if;

    if NEW.team_id <> OLD.team_id then
      raise exception 'team_id não pode ser alterado.';
    end if;

    if NEW.player_id <> OLD.player_id then
      raise exception 'player_id não pode ser alterado.';
    end if;

    if OLD.status <> 'pending' then
      raise exception 'Somente candidaturas pendentes podem ser alteradas.';
    end if;

    select v.team_id, t.owner_id
      into v_vacancy_team_id, v_vacancy_owner_id
    from public.team_vacancies v
    join public.teams t on t.id = v.team_id
    where v.id = NEW.vacancy_id;

    if NEW.team_id <> v_vacancy_team_id then
      raise exception 'A relação entre vacancy_id e team_id precisa permanecer consistente.';
    end if;

    if auth.uid() = OLD.player_id then
      if NEW.status <> 'cancelled' then
        raise exception 'O jogador só pode cancelar uma candidatura pendente.';
      end if;

      return NEW;
    end if;

    if v_vacancy_owner_id = auth.uid() then
      if NEW.status not in ('accepted', 'rejected') then
        raise exception 'O dono do time só pode aceitar ou recusar uma candidatura pendente.';
      end if;

      return NEW;
    end if;

    raise exception 'Usuário não autorizado para alterar essa candidatura.';
  end if;

  return NEW;
end;
$$;

create trigger team_applications_validate_transition
before insert or update on public.team_applications
for each row execute function public.team_applications_validate_transition();

create policy "team_applications_update_player_cancel" on public.team_applications
for update using (
  player_id = auth.uid()
  and status = 'pending'
)
with check (
  player_id = auth.uid()
  and status = 'cancelled'
);

create policy "team_applications_update_team_owner" on public.team_applications
for update using (
  exists (
    select 1
    from public.team_vacancies v
    join public.teams t on t.id = v.team_id
    where v.id = vacancy_id
      and t.owner_id = auth.uid()
  )
  and status = 'pending'
)
with check (
  exists (
    select 1
    from public.team_vacancies v
    join public.teams t on t.id = v.team_id
    where v.id = vacancy_id
      and t.owner_id = auth.uid()
  )
  and status in ('accepted', 'rejected')
);

-- DELETE não é criado propositalmente nesta fase.

-- Observação importante:
-- A validação final de transição, da relação vacancy_id/team_id/player_id e da autorização
-- é executada no trigger PostgreSQL para garantir proteção mesmo contra manipulação direta
-- via Supabase/API. O RLS e o trigger trabalham em conjunto, sem depender do frontend.
