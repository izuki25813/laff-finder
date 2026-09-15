-- Fase 9B.1: Fundação de Matrícula da Mentoria
-- Arquivo de referência para execução manual no Supabase.
-- Não executado automaticamente neste ambiente.
--
-- Escopo desta fase: ALUNO -> PRODUTO/PLANO -> MATRÍCULA -> STATUS
-- Fora do escopo: pagamento, checkout, Stripe, Mercado Pago, Pix, agenda,
-- Google Calendar, notificações, WhatsApp, evolução, gamificação,
-- marketplace, sistema completo de mentor, diagnóstico completo.

create extension if not exists pgcrypto;

create table if not exists public.mentorship_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid references public.mentoring_products(id) on delete restrict,
  plan_id uuid references public.mentoring_plans(id) on delete restrict,
  mentor_id uuid references public.mentor_profiles(id) on delete restrict,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mentorship_enrollments
  drop constraint if exists mentorship_enrollments_status_check;

alter table public.mentorship_enrollments
  add constraint mentorship_enrollments_status_check
  check (status in ('pending', 'active', 'completed', 'cancelled'));

-- A matrícula representa ou um produto ou um plano, nunca os dois nem nenhum.
alter table public.mentorship_enrollments
  drop constraint if exists mentorship_enrollments_product_or_plan_check;

alter table public.mentorship_enrollments
  add constraint mentorship_enrollments_product_or_plan_check
  check (
    (product_id is not null and plan_id is null)
    or (product_id is null and plan_id is not null)
  );

create index if not exists idx_mentorship_enrollments_student_id
  on public.mentorship_enrollments(student_id);

create index if not exists idx_mentorship_enrollments_product_id
  on public.mentorship_enrollments(product_id);

create index if not exists idx_mentorship_enrollments_plan_id
  on public.mentorship_enrollments(plan_id);

create index if not exists idx_mentorship_enrollments_mentor_id
  on public.mentorship_enrollments(mentor_id);

create index if not exists idx_mentorship_enrollments_status
  on public.mentorship_enrollments(status);

-- Trigger idempotente de updated_at, reaproveitando a função existente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'mentorship_enrollments'
      AND t.tgname = 'mentorship_enrollments_updated_at'
  ) THEN
    CREATE TRIGGER mentorship_enrollments_updated_at
    BEFORE UPDATE ON public.mentorship_enrollments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Trigger de validação/segurança. Roda independentemente do RLS para que
-- nenhuma regra crítica dependa apenas de política ou do frontend.
create or replace function public.mentorship_enrollments_validate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
begin
  v_is_admin := exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'ADMIN'
  );

  if TG_OP = 'INSERT' then
    -- auth.uid() nulo indica contexto de service role (ex.: futura
    -- integração de pagamento). Nesse caso a checagem de "dono" não se
    -- aplica; caso contrário, um usuário comum só pode matricular a si
    -- mesmo, com status inicial pending.
    if auth.uid() is not null and not v_is_admin then
      if NEW.student_id is null or NEW.student_id <> auth.uid() then
        raise exception 'student_id precisa ser o usuário autenticado.';
      end if;

      if NEW.status is distinct from 'pending' then
        raise exception 'Matrícula só pode ser criada com status pending.';
      end if;
    end if;

    if NEW.student_id is null then
      raise exception 'student_id é obrigatório.';
    end if;

    if (NEW.product_id is null and NEW.plan_id is null)
       or (NEW.product_id is not null and NEW.plan_id is not null) then
      raise exception 'Informe exatamente product_id ou plan_id.';
    end if;

    if NEW.product_id is not null and not exists (
      select 1 from public.mentoring_products
      where id = NEW.product_id and active = true
    ) then
      raise exception 'product_id inválido ou inativo.';
    end if;

    if NEW.plan_id is not null and not exists (
      select 1 from public.mentoring_plans
      where id = NEW.plan_id and active = true
    ) then
      raise exception 'plan_id inválido ou inativo.';
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
    -- de pagamento/backend. Usuário autenticado sem role ADMIN nunca pode
    -- alterar uma matrícula por este caminho (nenhuma policy de UPDATE é
    -- concedida a alunos nesta fase, mas o trigger também bloqueia por
    -- segurança em profundidade).
    if auth.uid() is not null and not v_is_admin then
      raise exception 'Usuário não autorizado para alterar esta matrícula.';
    end if;

    -- Vínculos fundamentais da matrícula são imutáveis após a criação.
    -- mentor_id e status permanecem alteráveis (ADMIN/backend) para
    -- suportar atribuição futura de mentor e transições de status.
    if NEW.student_id <> OLD.student_id then
      raise exception 'student_id não pode ser alterado.';
    end if;

    if NEW.product_id is distinct from OLD.product_id then
      raise exception 'product_id não pode ser alterado.';
    end if;

    if NEW.plan_id is distinct from OLD.plan_id then
      raise exception 'plan_id não pode ser alterado.';
    end if;

    if (NEW.product_id is null and NEW.plan_id is null)
       or (NEW.product_id is not null and NEW.plan_id is not null) then
      raise exception 'Informe exatamente product_id ou plan_id.';
    end if;

    if NEW.product_id is not null and not exists (
      select 1 from public.mentoring_products where id = NEW.product_id
    ) then
      raise exception 'product_id inválido.';
    end if;

    if NEW.plan_id is not null and not exists (
      select 1 from public.mentoring_plans where id = NEW.plan_id
    ) then
      raise exception 'plan_id inválido.';
    end if;

    if NEW.mentor_id is not null and not exists (
      select 1 from public.mentor_profiles where id = NEW.mentor_id
    ) then
      raise exception 'mentor_id inválido.';
    end if;

    return NEW;
  end if;

  return NEW;
end;
$$;

drop trigger if exists mentorship_enrollments_validate on public.mentorship_enrollments;

create trigger mentorship_enrollments_validate
before insert or update on public.mentorship_enrollments
for each row execute function public.mentorship_enrollments_validate();

alter table public.mentorship_enrollments enable row level security;

drop policy if exists "mentorship_enrollments_select_own" on public.mentorship_enrollments;
create policy "mentorship_enrollments_select_own"
on public.mentorship_enrollments
for select
using (student_id = auth.uid());

drop policy if exists "mentorship_enrollments_insert_own" on public.mentorship_enrollments;
create policy "mentorship_enrollments_insert_own"
on public.mentorship_enrollments
for insert
with check (
  student_id = auth.uid()
  and status = 'pending'
);

drop policy if exists "mentorship_enrollments_admin_manage" on public.mentorship_enrollments;
create policy "mentorship_enrollments_admin_manage"
on public.mentorship_enrollments
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
-- 2. Não existe policy de UPDATE para alunos: o cliente nunca pode alterar
--    status, student_id, product_id, plan_id ou mentor_id da própria
--    matrícula. A transição de status (pending -> active -> completed /
--    cancelled) ficará a cargo de integrações futuras (pagamento, admin)
--    operando via service role ou via role ADMIN.
-- 3. Nenhuma policy pública é criada: sem select/insert/update para
--    usuários anônimos ou para outros alunos.
-- 4. Pagamento, checkout, agenda, notificações, evolução, gamificação,
--    marketplace, sistema completo de mentor e diagnóstico completo não
--    fazem parte desta fase.
