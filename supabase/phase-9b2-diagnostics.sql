-- Fase 9B.2: Fundação do Diagnóstico (produto de entrada, R$39)
-- Arquivo de referência para execução manual no Supabase.
-- Não executado automaticamente neste ambiente.
--
-- Escopo desta fase: DIAGNÓSTICO como entidade própria, associada à
-- matrícula (mentorship_enrollments) criada na Fase 9B.1.
-- Fora do escopo: pagamento, checkout, Stripe, Mercado Pago, Pix, agenda,
-- Google Calendar, notificações, WhatsApp, evolução, gamificação,
-- marketplace, sistema completo de mentor, assinatura, recorrência.

create extension if not exists pgcrypto;

create table if not exists public.diagnostic_requests (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.mentorship_enrollments(id) on delete restrict,
  student_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid references public.mentor_profiles(id) on delete restrict,
  gameplay_url text,
  gameplay_title text,
  context text,
  status text not null default 'pending',
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

-- Status do diagnóstico:
-- pending         -> aguardando o aluno enviar/completar o material.
-- awaiting_info   -> mentor/admin pediu mais informação ao aluno.
-- in_review       -> em análise pelo mentor/admin.
-- completed       -> diagnóstico concluído, resultado disponível.
-- cancelled       -> diagnóstico cancelado.
alter table public.diagnostic_requests
  drop constraint if exists diagnostic_requests_status_check;

alter table public.diagnostic_requests
  add constraint diagnostic_requests_status_check
  check (status in ('pending', 'awaiting_info', 'in_review', 'completed', 'cancelled'));

-- Cada matrícula de diagnóstico gera no máximo um diagnostic_request.
-- Um novo diagnóstico exige uma nova matrícula (nova compra futura),
-- evitando ambiguidade sobre qual é o resultado válido de uma matrícula.
create unique index if not exists idx_diagnostic_requests_unique_enrollment
  on public.diagnostic_requests(enrollment_id);

create index if not exists idx_diagnostic_requests_student_id
  on public.diagnostic_requests(student_id);

create index if not exists idx_diagnostic_requests_mentor_id
  on public.diagnostic_requests(mentor_id);

create index if not exists idx_diagnostic_requests_status
  on public.diagnostic_requests(status);

-- Trigger idempotente de updated_at, reaproveitando a função existente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'diagnostic_requests'
      AND t.tgname = 'diagnostic_requests_updated_at'
  ) THEN
    CREATE TRIGGER diagnostic_requests_updated_at
    BEFORE UPDATE ON public.diagnostic_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger de validação/segurança. Roda independentemente do RLS para que
-- nenhuma regra crítica dependa apenas de política ou do frontend.
create or replace function public.diagnostic_requests_validate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_enrollment_student_id uuid;
  v_enrollment_status text;
  v_product_type text;
begin
  v_is_admin := exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
  );

  if TG_OP = 'INSERT' then
    -- auth.uid() nulo indica contexto de service role (ex.: futura
    -- integração de pagamento/backend). Nesse caso a checagem de "dono" não
    -- se aplica; caso contrário, um usuário comum só pode abrir um
    -- diagnóstico para si mesmo, sem definir resultado ou mentor.
    if auth.uid() is not null and not v_is_admin then
      if NEW.student_id is null or NEW.student_id <> auth.uid() then
        raise exception 'student_id precisa ser o usuário autenticado.';
      end if;

      if NEW.status is distinct from 'pending' then
        raise exception 'Diagnóstico só pode ser criado com status pending.';
      end if;

      if NEW.result is not null then
        raise exception 'Usuário não pode definir o resultado do diagnóstico.';
      end if;

      if NEW.mentor_id is not null then
        raise exception 'Usuário não pode definir mentor_id diretamente.';
      end if;

      if NEW.completed_at is not null then
        raise exception 'Usuário não pode definir completed_at diretamente.';
      end if;
    end if;

    if NEW.student_id is null then
      raise exception 'student_id é obrigatório.';
    end if;

    if NEW.enrollment_id is null then
      raise exception 'enrollment_id é obrigatório.';
    end if;

    select e.student_id, e.status
      into v_enrollment_student_id, v_enrollment_status
    from public.mentorship_enrollments e
    where e.id = NEW.enrollment_id;

    if v_enrollment_student_id is null then
      raise exception 'enrollment_id inválido.';
    end if;

    if v_enrollment_student_id <> NEW.student_id then
      raise exception 'enrollment_id precisa pertencer ao mesmo student_id.';
    end if;

    if v_enrollment_status <> 'active' then
      raise exception 'A matrícula precisa estar ativa para solicitar o diagnóstico.';
    end if;

    select pr.product_type
      into v_product_type
    from public.mentorship_enrollments e
    join public.mentoring_products pr on pr.id = e.product_id
    where e.id = NEW.enrollment_id;

    if v_product_type is distinct from 'diagnostic' then
      raise exception 'enrollment_id precisa corresponder a um produto do tipo diagnostic.';
    end if;

    if NEW.mentor_id is not null and not exists (
      select 1 from public.mentor_profiles
      where id = NEW.mentor_id and active = true
    ) then
      raise exception 'mentor_id inválido ou inativo.';
    end if;

    return NEW;
  end if;

  if TG_OP = 'UPDATE' then
    -- auth.uid() nulo (service role) fica reservado para futura integração
    -- de pagamento/backend. Usuário autenticado sem role ADMIN só pode
    -- atualizar material de entrada (gameplay_url, gameplay_title, context)
    -- enquanto o diagnóstico ainda está em pending/awaiting_info, e nunca
    -- pode tocar em status, result, mentor_id ou completed_at.
    if auth.uid() is not null and not v_is_admin then
      if OLD.student_id <> auth.uid() then
        raise exception 'Usuário não autorizado para alterar este diagnóstico.';
      end if;

      if OLD.status not in ('pending', 'awaiting_info') then
        raise exception 'Diagnóstico não pode mais ser alterado pelo aluno nesta etapa.';
      end if;

      if NEW.status is distinct from OLD.status then
        raise exception 'status não pode ser alterado pelo aluno.';
      end if;

      if NEW.result is distinct from OLD.result then
        raise exception 'O resultado do diagnóstico não pode ser alterado pelo aluno.';
      end if;

      if NEW.mentor_id is distinct from OLD.mentor_id then
        raise exception 'mentor_id não pode ser alterado pelo aluno.';
      end if;

      if NEW.completed_at is distinct from OLD.completed_at then
        raise exception 'completed_at não pode ser alterado pelo aluno.';
      end if;
    end if;

    -- Vínculos fundamentais são imutáveis para qualquer chamador, inclusive
    -- ADMIN/service role: um diagnóstico nunca troca de aluno ou de matrícula,
    -- e nem seu identificador ou data de criação podem ser reescritos.
    if NEW.id <> OLD.id then
      raise exception 'id não pode ser alterado.';
    end if;

    if NEW.created_at <> OLD.created_at then
      raise exception 'created_at não pode ser alterado.';
    end if;

    if NEW.student_id <> OLD.student_id then
      raise exception 'student_id não pode ser alterado.';
    end if;

    if NEW.enrollment_id <> OLD.enrollment_id then
      raise exception 'enrollment_id não pode ser alterado.';
    end if;

    if NEW.mentor_id is distinct from OLD.mentor_id
       and NEW.mentor_id is not null
       and not exists (
         select 1 from public.mentor_profiles
         where id = NEW.mentor_id and active = true
       ) then
      raise exception 'mentor_id inválido ou inativo.';
    end if;

    if NEW.status = 'completed'
       and OLD.status is distinct from 'completed'
       and NEW.completed_at is null then
      NEW.completed_at := now();
    end if;

    return NEW;
  end if;

  return NEW;
end;
$$;

drop trigger if exists diagnostic_requests_validate on public.diagnostic_requests;

create trigger diagnostic_requests_validate
before insert or update on public.diagnostic_requests
for each row execute function public.diagnostic_requests_validate();

alter table public.diagnostic_requests enable row level security;

drop policy if exists "diagnostic_requests_select_own" on public.diagnostic_requests;
create policy "diagnostic_requests_select_own"
on public.diagnostic_requests
for select
using (student_id = auth.uid());

drop policy if exists "diagnostic_requests_insert_own" on public.diagnostic_requests;
create policy "diagnostic_requests_insert_own"
on public.diagnostic_requests
for insert
with check (
  student_id = auth.uid()
  and status = 'pending'
);

drop policy if exists "diagnostic_requests_update_own" on public.diagnostic_requests;
create policy "diagnostic_requests_update_own"
on public.diagnostic_requests
for update
using (
  student_id = auth.uid()
  and status in ('pending', 'awaiting_info')
)
with check (
  student_id = auth.uid()
  and status in ('pending', 'awaiting_info')
);

drop policy if exists "diagnostic_requests_admin_manage" on public.diagnostic_requests;
create policy "diagnostic_requests_admin_manage"
on public.diagnostic_requests
for all
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
  )
);

-- Observações de implementação:
-- 1. Nenhuma role MENTOR é criada em public.profiles.
-- 2. O aluno só pode alterar material de entrada (gameplay_url,
--    gameplay_title, context) enquanto o diagnóstico está em pending ou
--    awaiting_info. id, created_at, status, result, mentor_id,
--    completed_at, student_id e enrollment_id são protegidos pelo trigger
--    contra alteração pelo aluno, independentemente do que a RLS permitir.
-- 3. id, created_at, student_id e enrollment_id são imutáveis após a
--    criação, inclusive para ADMIN/service role: um diagnóstico nunca
--    troca de identificador, de data de criação, de aluno ou de matrícula.
--    mentor_id, quando alterado por ADMIN/service role, também precisa
--    apontar para um mentor ativo (mesma exigência da criação).
-- 4. Um diagnóstico só pode ser criado sobre uma matrícula (enrollment)
--    já com status 'active' e cujo produto seja do tipo 'diagnostic' em
--    mentoring_products. Como a Fase 9B.1 não implementa pagamento, hoje
--    isso só é possível via ADMIN/service role marcando a matrícula como
--    ativa manualmente — o que é intencional: o fluxo real (pagamento ->
--    matrícula ativa -> diagnóstico) só se completa quando o pagamento for
--    implementado em fase futura.
-- 5. Nenhuma policy pública é criada: sem select/insert/update para
--    usuários anônimos ou para outros alunos.
-- 6. O resultado do diagnóstico (strengths, main_errors, decision_making,
--    positioning, game_reading, exercises, checklist, conclusão) é
--    armazenado em um único campo jsonb (`result`) em vez de várias
--    colunas de texto, para permitir evoluir o formato do resultado
--    (ex.: adicionar campos, mudar estrutura de checklist/exercícios) sem
--    exigir nova migração de schema. O trigger protege esse campo como um
--    bloco único contra alteração pelo aluno.
-- 7. Pagamento, checkout, agenda, notificações, evolução, gamificação,
--    marketplace, sistema completo de mentor, assinatura e recorrência
--    não fazem parte desta fase.
