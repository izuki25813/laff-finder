-- Fase 8: treinos do LAFF Finder
-- Arquivo de referência para execução manual no Supabase.

create table if not exists public.training_sessions (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id) on delete cascade,
  team_id uuid null references public.teams(id) on delete cascade,
  title text not null,
  description text,
  training_type text not null,
  competitive_level text,
  region text,
  state text,
  city text,
  scheduled_at timestamptz not null,
  duration_minutes integer,
  max_participants integer not null default 4,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.training_sessions'::regclass
      and c.conname = 'training_sessions_status_check'
  ) then
    alter table public.training_sessions
      add constraint training_sessions_status_check
      check (status in ('open', 'full', 'cancelled', 'completed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.training_sessions'::regclass
      and c.conname = 'training_sessions_max_participants_check'
  ) then
    alter table public.training_sessions
      add constraint training_sessions_max_participants_check
      check (max_participants > 0);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.training_sessions'::regclass
      and c.conname = 'training_sessions_duration_minutes_check'
  ) then
    alter table public.training_sessions
      add constraint training_sessions_duration_minutes_check
      check (duration_minutes is null or duration_minutes > 0);
  end if;
end $$;

create index if not exists idx_training_sessions_created_by on public.training_sessions(created_by);
create index if not exists idx_training_sessions_team_id on public.training_sessions(team_id);
create index if not exists idx_training_sessions_status on public.training_sessions(status);
create index if not exists idx_training_sessions_scheduled_at on public.training_sessions(scheduled_at);
create index if not exists idx_training_sessions_training_type on public.training_sessions(training_type);
create index if not exists idx_training_sessions_region on public.training_sessions(region);
create index if not exists idx_training_sessions_state on public.training_sessions(state);
create index if not exists idx_training_sessions_city on public.training_sessions(city);

create table if not exists public.training_participants (
  id uuid primary key default gen_random_uuid(),
  training_id uuid not null references public.training_sessions(id) on delete cascade,
  player_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_training_participants_unique_participation
  on public.training_participants(training_id, player_id);

create index if not exists idx_training_participants_training_id on public.training_participants(training_id);
create index if not exists idx_training_participants_player_id on public.training_participants(player_id);

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = 'training_sessions'
      and t.tgname = 'training_sessions_updated_at'
  ) then
    create trigger training_sessions_updated_at
    before update on public.training_sessions
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

create or replace function public.validate_training_status_transition()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_participant_count integer;
  v_team_owner uuid;
begin
  if TG_OP = 'INSERT' then
    if NEW.created_by is null then
      raise exception 'created_by é obrigatório.';
    end if;

    if NEW.team_id is not null then
      select owner_id into v_team_owner
      from public.teams
      where id = NEW.team_id;

      if v_team_owner is null then
        raise exception 'Time não encontrado ou não pertence a um owner válido.';
      end if;

      if v_team_owner <> NEW.created_by then
        raise exception 'Somente o owner do time pode criar treinos para esse time.';
      end if;
    end if;

    if NEW.max_participants is null or NEW.max_participants <= 0 then
      raise exception 'max_participants deve ser maior que zero.';
    end if;

    if NEW.status is null then
      NEW.status := 'open';
    end if;

    if NEW.status <> 'open' then
      raise exception 'Treino novo só pode iniciar com status open.';
    end if;

    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    if NEW.created_by is distinct from OLD.created_by then
      raise exception 'created_by não pode ser alterado.';
    end if;

    if NEW.team_id is not null then
      select owner_id into v_team_owner
      from public.teams
      where id = NEW.team_id;

      if v_team_owner is null then
        raise exception 'Time não encontrado ou não pertence a um owner válido.';
      end if;

      if v_team_owner <> NEW.created_by then
        raise exception 'Somente o owner do time pode vincular esse time ao treino.';
      end if;
    end if;

    if NEW.max_participants is null or NEW.max_participants <= 0 then
      raise exception 'max_participants deve ser maior que zero.';
    end if;

    select count(*) into v_participant_count
    from public.training_participants
    where training_id = NEW.id;

    if NEW.max_participants < v_participant_count then
      raise exception 'max_participants não pode ser menor que a quantidade atual de participantes.';
    end if;

    if NEW.max_participants is distinct from OLD.max_participants and OLD.status = 'full' and v_participant_count < NEW.max_participants then
      NEW.status := 'open';
    end if;

    if NEW.status is null then
      NEW.status := OLD.status;
    end if;

    if NEW.status = OLD.status then
      return NEW;
    end if;

    if OLD.status in ('cancelled', 'completed') then
      raise exception 'Treinos cancelados ou concluídos não podem ter seu status alterado.';
    end if;

    if NEW.status = 'cancelled' then
      if OLD.status not in ('open', 'full') then
        raise exception 'Só treinos abertos ou lotados podem ser cancelados.';
      end if;
      return NEW;
    end if;

    if NEW.status = 'completed' then
      if OLD.status not in ('open', 'full') then
        raise exception 'Só treinos abertos ou lotados podem ser concluídos.';
      end if;
      return NEW;
    end if;

    if NEW.status = 'full' then
      if v_participant_count < NEW.max_participants then
        raise exception 'Treino só pode entrar em full quando atingir o limite de participantes.';
      end if;

      return NEW;
    end if;

    if NEW.status = 'open' then
      if v_participant_count >= NEW.max_participants then
        raise exception 'Não é permitido reabrir um treino lotado sem remover participantes.';
      end if;

      return NEW;
    end if;

    raise exception 'Transição de status inválida para training_sessions.';
  end if;

  return NEW;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    where c.relname = 'training_sessions'
      and t.tgname = 'training_sessions_status_guard'
  ) then
    create trigger training_sessions_status_guard
    before insert or update on public.training_sessions
    for each row execute function public.validate_training_status_transition();
  end if;
end $$;

alter table public.training_sessions enable row level security;
alter table public.training_participants enable row level security;

create policy "training_sessions_select_public" on public.training_sessions
for select using (
  status in ('open', 'full')
  or auth.uid() = created_by
);

create policy "training_sessions_insert_own" on public.training_sessions
for insert with check (
  auth.uid() is not null
  and created_by = auth.uid()
);

create policy "training_sessions_update_own" on public.training_sessions
for update using (
  auth.uid() = created_by
)
with check (
  auth.uid() = created_by
);

create policy "training_sessions_delete_own" on public.training_sessions
for delete using (
  auth.uid() = created_by
);

create policy "training_participants_select_own" on public.training_participants
for select using (
  player_id = auth.uid()
  or exists (
    select 1
    from public.training_sessions ts
    where ts.id = training_id
      and ts.created_by = auth.uid()
  )
);

create policy "training_participants_insert_via_rpc" on public.training_participants
for insert with check (
  false
);

create policy "training_participants_delete_own" on public.training_participants
for delete using (
  player_id = auth.uid()
  or exists (
    select 1
    from public.training_sessions ts
    where ts.id = training_id
      and ts.created_by = auth.uid()
  )
);

create or replace function public.join_training_session(p_training_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_training public.training_sessions%rowtype;
  v_participant_count integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_training_id is null then
    raise exception 'Treino inválido.';
  end if;

  select *
    into v_training
  from public.training_sessions ts
  where ts.id = p_training_id
  for update;

  if not found then
    raise exception 'Treino não encontrado.';
  end if;

  if v_training.status in ('cancelled', 'completed') then
    raise exception 'Treino não está aberto para participação.';
  end if;

  if v_training.status not in ('open', 'full') then
    raise exception 'Treino não está aberto para participação.';
  end if;

  if exists (
    select 1
    from public.training_participants tp
    where tp.training_id = p_training_id
      and tp.player_id = v_user_id
  ) then
    raise exception 'Você já participa deste treino.';
  end if;

  select count(*)
    into v_participant_count
  from public.training_participants tp
  where tp.training_id = p_training_id;

  if v_participant_count >= v_training.max_participants then
    update public.training_sessions
    set status = 'full',
        updated_at = now()
    where id = p_training_id;

    raise exception 'Treino está lotado.';
  end if;

  insert into public.training_participants (training_id, player_id)
  values (p_training_id, v_user_id);

  v_participant_count := v_participant_count + 1;

  update public.training_sessions
  set status = case
      when v_participant_count >= max_participants then 'full'
      else 'open'
    end,
      updated_at = now()
  where id = p_training_id;

  return jsonb_build_object(
    'success', true,
    'training_id', p_training_id,
    'player_id', v_user_id
  );
end;
$$;

create or replace function public.leave_training_session(p_training_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_training public.training_sessions%rowtype;
  v_participant_count integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_training_id is null then
    raise exception 'Treino inválido.';
  end if;

  select *
    into v_training
  from public.training_sessions ts
  where ts.id = p_training_id
  for update;

  if not found then
    raise exception 'Treino não encontrado.';
  end if;

  if v_training.status in ('cancelled', 'completed') then
    raise exception 'Treino não pode ter participação alterada após cancelamento/conclusão.';
  end if;

  if not exists (
    select 1
    from public.training_participants tp
    where tp.training_id = p_training_id
      and tp.player_id = v_user_id
  ) then
    raise exception 'Você não participa deste treino.';
  end if;

  delete from public.training_participants
  where training_id = p_training_id
    and player_id = v_user_id;

  select count(*)
    into v_participant_count
  from public.training_participants tp
  where tp.training_id = p_training_id;

  update public.training_sessions
  set status = case
      when v_participant_count >= max_participants then 'full'
      else 'open'
    end,
      updated_at = now()
  where id = p_training_id;

  return jsonb_build_object(
    'success', true,
    'training_id', p_training_id,
    'player_id', v_user_id
  );
end;
$$;

revoke all on function public.join_training_session(uuid) from public;
revoke all on function public.leave_training_session(uuid) from public;
revoke all on function public.join_training_session(uuid) from anon;
revoke all on function public.leave_training_session(uuid) from anon;

grant execute on function public.join_training_session(uuid) to authenticated;
grant execute on function public.leave_training_session(uuid) to authenticated;

-- Observação: o limite de participantes é protegido de forma atômica pela linha
-- de training_sessions bloqueada com FOR UPDATE, e o status é recalculado em
-- open/full de acordo com a contagem atual. A regra de time e max_participants
-- também é validada no banco para bloquear alterações inconsistentes.
