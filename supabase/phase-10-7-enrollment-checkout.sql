-- Fase 10.7: Fluxo comercial — criação segura de enrollment pending
-- Arquivo de referência para execução manual no Supabase.
-- Não executado automaticamente neste ambiente.
--
-- Escopo desta fase: fechar o gap encontrado na Fase 10.6 — hoje não
-- existe nenhum caminho de autoatendimento para um aluno criar sua
-- própria matrícula (mentorship_enrollments) pending para o diagnóstico;
-- isso dependia de um INSERT manual no banco. Esta migration NÃO altera
-- pagamento, webhook, aprovação nem ativação — só a criação segura do
-- enrollment pending que antecede o checkout já existente (Fase 10.4+).
--
-- Idempotente: pode ser executada mais de uma vez sem efeito colateral
-- (create index if not exists / create or replace function). Não apaga
-- dados, não recria tabelas, não altera histórico existente.

-- =========================================================
-- 1. PROTEÇÃO DE CONCORRÊNCIA NO BANCO
-- =========================================================
-- Impede duas matrículas "operacionais" (pending OU active) simultâneas
-- para o mesmo aluno + mesmo produto. Não afeta:
-- - enrollments de PLANO (plan_id preenchido, product_id null) — a
--   condição "product_id is not null" exclui essas linhas do índice,
--   então esta fase não muda nada para mentoria por plano;
-- - histórico de enrollments 'cancelled'/'completed' — só 'pending' e
--   'active' entram no filtro parcial, então um aluno pode iniciar uma
--   nova compra depois de cancelar ou concluir uma matrícula anterior.
create unique index if not exists idx_mentorship_enrollments_unique_operational_per_student_product
  on public.mentorship_enrollments(student_id, product_id)
  where status in ('pending', 'active') and product_id is not null;

-- =========================================================
-- 2. FUNÇÃO: ensure_diagnostic_enrollment()
-- =========================================================
-- Único caminho de autoatendimento para criar/recuperar a matrícula do
-- diagnóstico do próprio usuário autenticado. Não aceita NENHUM
-- parâmetro do cliente: student_id vem de auth.uid(), o produto é
-- resolvido inteiramente no servidor (slug fixo 'diagnostico'),
-- preço/moeda/status nunca são aceitos de fora.
--
-- Comportamento (idempotente por chamada):
-- - já existe enrollment 'active' ou 'pending' para este aluno+produto
--   -> retorna essa linha, não cria nada novo;
-- - não existe -> cria uma nova linha com status 'pending'.
--
-- Concorrência: duas chamadas simultâneas da mesma pessoa (duplo clique,
-- duas abas) podem colidir no INSERT — o índice único da seção 1 rejeita
-- a segunda com unique_violation, capturada abaixo para retornar o
-- enrollment que "venceu" a corrida em vez de estourar erro para o
-- cliente (mesmo padrão já usado em lib/mercado-pago-checkout.ts para o
-- insert de payments concorrente).
create or replace function public.ensure_diagnostic_enrollment()
returns public.mentorship_enrollments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_product_id uuid;
  v_enrollment public.mentorship_enrollments%rowtype;
begin
  if v_student_id is null then
    raise exception 'Usuário não autenticado.';
  end if;

  -- Produto resolvido inteiramente no servidor: slug fixo, precisa estar
  -- ativo, ser do tipo certo e ter preço válido (> 0). Nenhum desses
  -- critérios vem do cliente. SECURITY DEFINER bypassa a RLS de
  -- mentoring_products, então os filtros abaixo são a única barreira
  -- aqui — por isso são explícitos e completos.
  select id into v_product_id
  from public.mentoring_products
  where slug = 'diagnostico'
    and product_type = 'diagnostic'
    and active = true
    and price is not null
    and price > 0
  limit 1;

  if v_product_id is null then
    raise exception 'Produto de diagnóstico indisponível para matrícula no momento.';
  end if;

  select * into v_enrollment
  from public.mentorship_enrollments
  where student_id = v_student_id
    and product_id = v_product_id
    and status in ('pending', 'active')
  order by created_at desc
  limit 1;

  if v_enrollment.id is not null then
    return v_enrollment;
  end if;

  begin
    insert into public.mentorship_enrollments (student_id, product_id, plan_id, status)
    values (v_student_id, v_product_id, null, 'pending')
    returning * into v_enrollment;

    return v_enrollment;
  exception
    when unique_violation then
      select * into v_enrollment
      from public.mentorship_enrollments
      where student_id = v_student_id
        and product_id = v_product_id
        and status in ('pending', 'active')
      order by created_at desc
      limit 1;

      if v_enrollment.id is null then
        raise;
      end if;

      return v_enrollment;
  end;
end;
$$;

revoke all on function public.ensure_diagnostic_enrollment() from public;
grant execute on function public.ensure_diagnostic_enrollment() to authenticated;

-- =========================================================
-- Observações
-- =========================================================
-- 1. A função só pode resultar em status = 'pending' (nova matrícula) ou
--    retornar uma linha já existente ('pending' ou 'active') — nunca cria
--    uma linha 'active' diretamente. A única transição pending -> active
--    continua sendo mark_payment_approved() (Fase 10.2/10.5), chamada
--    exclusivamente pelo webhook confirmado. Esta função não altera isso
--    nem tem qualquer caminho para aprovar payment ou ativar matrícula.
-- 2. GRANT restrito a `authenticated` — nem `anon` nem `public` podem
--    executá-la; sem sessão, auth.uid() é null e a função recusa com
--    "Usuário não autenticado." antes de tocar qualquer tabela.
-- 3. RLS de mentorship_enrollments NÃO foi alterada nesta fase: a policy
--    "mentorship_enrollments_insert_own" (Fase 9B.1) continua cobrindo
--    um insert direto na tabela (fora desta função) com as mesmas regras
--    (student_id = auth.uid() e status = 'pending'). Esta função só
--    adiciona um caminho atômico e protegido contra corrida para o
--    mesmo resultado, sem abrir nenhuma permissão nova na tabela.
-- 4. O trigger mentorship_enrollments_validate (Fase 9B.1) continua
--    rodando normalmente sobre o INSERT feito dentro desta função —
--    SECURITY DEFINER muda o papel usado para checagem de privilégio na
--    função em si, não desliga triggers da tabela.
-- 5. Nenhuma tabela foi recriada, nenhum dado existente foi apagado ou
--    alterado por esta migration — apenas um índice novo (idempotente)
--    e uma função nova (idempotente via create or replace).
