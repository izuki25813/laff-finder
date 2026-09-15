-- Fase 9A: Fundação Comercial da Mentoria
-- Arquivo de referência para execução manual no Supabase.
-- Não executado automaticamente neste ambiente.

create extension if not exists pgcrypto;

create table if not exists public.mentor_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  display_name text,
  bio text,
  specialties text[] default array[]::text[],
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentoring_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  modality text not null,
  tier integer not null check (tier between 1 and 3),
  description text,
  short_description text,
  price numeric(10,2),
  currency text not null default 'BRL',
  sessions_included integer,
  duration_days integer,
  active boolean not null default true,
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentoring_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  product_type text not null check (product_type in ('diagnostic', 'mentoring')),
  description text,
  price numeric(10,2),
  currency text not null default 'BRL',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mentor_profiles_active on public.mentor_profiles(active);
create index if not exists idx_mentor_profiles_profile_id on public.mentor_profiles(profile_id);
create index if not exists idx_mentoring_plans_active on public.mentoring_plans(active);
create index if not exists idx_mentoring_plans_modality on public.mentoring_plans(modality);
create index if not exists idx_mentoring_plans_tier on public.mentoring_plans(tier);
create index if not exists idx_mentoring_products_active on public.mentoring_products(active);
create index if not exists idx_mentoring_products_type on public.mentoring_products(product_type);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'mentor_profiles'
      AND t.tgname = 'mentor_profiles_updated_at'
  ) THEN
    CREATE TRIGGER mentor_profiles_updated_at
    BEFORE UPDATE ON public.mentor_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'mentoring_plans'
      AND t.tgname = 'mentoring_plans_updated_at'
  ) THEN
    CREATE TRIGGER mentoring_plans_updated_at
    BEFORE UPDATE ON public.mentoring_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    WHERE c.relname = 'mentoring_products'
      AND t.tgname = 'mentoring_products_updated_at'
  ) THEN
    CREATE TRIGGER mentoring_products_updated_at
    BEFORE UPDATE ON public.mentoring_products
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

alter table public.mentor_profiles enable row level security;
alter table public.mentoring_plans enable row level security;
alter table public.mentoring_products enable row level security;

create policy "mentor_profiles_select_public_active"
on public.mentor_profiles
for select
using (active = true);

create policy "mentor_profiles_select_own"
on public.mentor_profiles
for select
using (profile_id = auth.uid());

create policy "mentor_profiles_admin_manage"
on public.mentor_profiles
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

create policy "mentoring_plans_select_public_active"
on public.mentoring_plans
for select
using (active = true);

create policy "mentoring_plans_admin_manage"
on public.mentoring_plans
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

create policy "mentoring_products_select_public_active"
on public.mentoring_products
for select
using (active = true);

create policy "mentoring_products_admin_manage"
on public.mentoring_products
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
-- 1. Não existe criação de role MENTOR em public.profiles.
-- 2. Mentor_profiles serve como entidade separada para futura gestão de mentores.
-- 3. Pagamentos, agenda, dashboard, evolução e notificações não fazem parte desta fase.
