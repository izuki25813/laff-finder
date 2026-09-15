-- Fase 10.4 (correção): proteção de concorrência contra payments
-- pending/processing duplicados para a mesma matrícula.
-- Arquivo de referência para execução manual no Supabase.
-- Não executado automaticamente neste ambiente.
--
-- Escopo desta correção: SOMENTE o índice único parcial de concorrência
-- abaixo. Não altera status, constraints existentes, o trigger
-- payments_validate(), mark_payment_approved(), get_my_payments(), RLS,
-- catálogo ou qualquer outra coisa da Fase 10.2/10.1.
--
-- IMPORTANTE — LIMITAÇÃO DESTA AUDITORIA:
-- Esta sessão não tem conexão direta com o banco Supabase do projeto
-- (nenhuma ferramenta de banco de dados está disponível aqui). Por isso a
-- checagem de duplicidade pedida NÃO foi executada por mim contra os
-- dados reais — não posso afirmar se existem ou não duplicidades hoje.
-- Em vez de assumir uma resposta, o próprio script se protege: o bloco
-- abaixo verifica duplicidade NO MOMENTO DA EXECUÇÃO e ABORTA (RAISE
-- EXCEPTION, sem criar o índice e sem tocar em nenhuma linha) se
-- encontrar qualquer enrollment_id com mais de um payment
-- pending/processing simultâneo. Se você (ou quem for executar este
-- script no Supabase) rodar e ele abortar, a mensagem de erro vai listar
-- exatamente quais enrollment_id têm duplicidade e quantos payments cada
-- um tem — pare aí e decida manualmente o que fazer com cada duplicata
-- (cancelar/expirar os payments extras) antes de reexecutar.

DO $$
DECLARE
  v_duplicate_count integer;
  v_duplicates text;
BEGIN
  SELECT count(*) INTO v_duplicate_count
  FROM (
    SELECT enrollment_id
    FROM public.payments
    WHERE status IN ('pending', 'processing')
    GROUP BY enrollment_id
    HAVING count(*) > 1
  ) duplicated;

  IF v_duplicate_count > 0 THEN
    SELECT string_agg(enrollment_id::text || ' (' || cnt::text || ' payments)', ', ' ORDER BY enrollment_id)
      INTO v_duplicates
    FROM (
      SELECT enrollment_id, count(*) AS cnt
      FROM public.payments
      WHERE status IN ('pending', 'processing')
      GROUP BY enrollment_id
      HAVING count(*) > 1
    ) duplicated;

    RAISE EXCEPTION
      'Encontrado(s) % enrollment(s) com mais de um payment pending/processing simultâneo: %. '
      'O índice único NÃO foi criado. Resolva as duplicidades manualmente '
      '(decida qual payment cancelar/expirar por enrollment) antes de reexecutar este script.',
      v_duplicate_count, v_duplicates;
  END IF;
END $$;

-- Só chega aqui se o bloco acima NÃO abortou (nenhuma duplicidade
-- pending/processing encontrada no momento da execução).
--
-- No máximo 1 payment pending/processing por matrícula ("estados
-- operacionais"). Estados terminais (failed, cancelled, expired,
-- refunded, chargeback, approved) não entram nesta restrição — depois
-- que o payment operacional atual vai para um desses estados, um novo
-- payment pending pode ser criado normalmente para a mesma matrícula.
-- A garantia de "no máximo 1 approved por matrícula" já existente
-- (idx_payments_unique_approved_per_enrollment, Fase 10.2) continua
-- intacta e não é afetada por este índice.
create unique index if not exists idx_payments_unique_operational_per_enrollment
  on public.payments(enrollment_id)
  where status in ('pending', 'processing');
