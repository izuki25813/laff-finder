# FINDER — STATUS DO PROJETO

## Última fase concluída

Fase 9B.3 — Fluxo Funcional do Diagnóstico

## Fase em desenvolvimento

Nenhuma. Fase 9B.4 ainda NÃO iniciada.

## Fases concluídas

1. Fundação
2. Auth + Segurança
3. Perfil competitivo
4. Times/LAFFs
5. Vagas
6. Busca + filtros
7. Candidaturas
8. Treinos
9. Fase 9A — Fundação Comercial da Mentoria
10. Fase 9B.1 — Fundação de Matrícula da Mentoria
11. Fase 9B.2 — Fundação do Diagnóstico
12. Fase 9B.3 — Fluxo Funcional do Diagnóstico

## Estado da Fase 9A

Fase 9A concluída com sucesso.

- mentor_profiles criada
- mentoring_plans criada
- mentoring_products criada
- RLS configurada
- triggers configurados
- pgcrypto habilitado
- SQL executado com sucesso no Supabase
- catálogo público ainda utiliza TypeScript nesta fase
- Supabase deverá se tornar a fonte da verdade antes da integração de pagamento
- Fase 9B ainda NÃO iniciada

## Estado da Fase 9B.1

Fase 9B.1 concluída com sucesso.

- mentorship_enrollments criada em `supabase/phase-9b1-enrollments.sql`
- estrutura ALUNO -> PRODUTO/PLANO -> MATRÍCULA -> STATUS criada
- status permitidos: pending, active, completed, cancelled
- RLS configurada: aluno vê apenas suas próprias matrículas; ADMIN visualiza e administra todas
- trigger de validação (insert/update) e trigger de updated_at configurados, ambos idempotentes
- student_id, product_id e plan_id imutáveis após a criação (inclusive para ADMIN/service role)
- nenhuma role MENTOR criada em profiles
- SQL executado com sucesso no Supabase
- pagamento, checkout, agenda, notificações, diagnóstico completo, evolução, gamificação e marketplace ainda NÃO implementados

## Estado da Fase 9B.2

Fase 9B.2 concluída com sucesso.

- diagnostic_requests criada e executada com sucesso no Supabase, em `supabase/phase-9b2-diagnostics.sql`
- diagnóstico associado à matrícula (enrollment_id -> mentorship_enrollments), com índice único por enrollment_id
- validação de matrícula ativa e de produto do tipo `diagnostic` (mentoring_products) na criação
- status permitidos: pending, awaiting_info, in_review, completed, cancelled
- RLS configurada: aluno vê e cria apenas seus próprios diagnósticos; ADMIN administra todos
- id, created_at, student_id e enrollment_id imutáveis após a criação (inclusive para ADMIN/service role)
- resultado do diagnóstico (result jsonb), status, mentor_id e completed_at protegidos contra alteração pelo aluno
- aluno pode atualizar apenas gameplay_url, gameplay_title e context, enquanto status estiver em pending ou awaiting_info
- mentor_id precisa apontar para mentor ativo em mentor_profiles, na criação e em qualquer atualização
- completed_at preenchido automaticamente ao status entrar em completed
- nenhuma role MENTOR criada em profiles
- nenhuma página, API ou componente de frontend foi criada nesta fase (fundação apenas no banco)
- pagamento, checkout, agenda, notificações, evolução, gamificação e marketplace ainda NÃO implementados

## Estado da Fase 9B.3

Fase 9B.3 concluída com sucesso.

- rota funcional `/mentoria/diagnostico` (estática, com prioridade sobre `/mentoria/[slug]`)
- API `app/api/diagnosticos` (POST, criação) e `app/api/diagnosticos/[id]` (POST, atualização de material)
- tipos e helpers em `lib/diagnostics.ts` (status, parsing tolerante do `result` jsonb)
- fluxo: verifica login -> verifica mentorship_enrollment ACTIVE do produto `diagnostic` -> permite criar/editar diagnostic_request -> exibe status e resultado
- enrollment_id é sempre determinado pelo servidor a partir do usuário autenticado; o cliente nunca envia enrollment_id, student_id, mentor_id, result, completed_at ou status
- proteção em duas camadas: checagens explícitas na API + RLS/trigger do banco (Fase 9B.2) como autoridade final
- corrida de duplicidade (unique index em enrollment_id) tratada explicitamente (erro 23505 -> mensagem "já existe")
- estados exibidos ao aluno: sem login, sem matrícula ativa, formulário de envio, pending, awaiting_info (editável), in_review (somente leitura), completed (com/sem result), cancelled
- pequeno link adicionado no dashboard (`/mentoria/diagnostico`); `/mentoria` e `/mentoria/[slug]` não precisaram de alteração (CTA já apontava para a rota correta)
- catálogo estático (`lib/mentorship.ts`) preservado; usado apenas para copy/preço, sem migração ampla
- Fase 9B.4 ainda NÃO iniciada

## IMPORTANTE

Pagamento ainda não implementado.
Checkout, Stripe, Mercado Pago e Pix ainda não implementados.
Agenda/Google Calendar ainda não implementada.
Notificações/WhatsApp ainda não implementadas.
Dashboard completo ainda não implementado.
Evolução, gamificação e marketplace ainda não implementados.
Upload/armazenamento de vídeo e IA de análise ainda não implementados (aluno só informa um link).
`mentoring_products` ainda não possui nenhuma linha inserida no Supabase (Fase 9A criou apenas a estrutura) — até um ADMIN cadastrar o produto `diagnostic` e ativar uma matrícula manualmente, todo aluno verá "sem matrícula ativa", por design.
Fase 9B.4 ainda NÃO iniciada.

## Banco

Supabase configurado e validado para as Fases 9A, 9B.1 e 9B.2. Nenhuma alteração de banco foi feita na Fase 9B.3.

Fases 1–8 possuem estrutura de banco correspondente.

O SQL das Fases 9A, 9B.1 e 9B.2 foi executado com sucesso no Supabase.

## Estado do código

Resultado real registrado no fechamento da Fase 9B.3:

- build: OK
- lint: OK
- git status: em estado de fechamento da fase 9B.3
- commit: feat: implement phase 9b3 diagnostic flow
- push: realizado
- deploy: não validado automaticamente neste ambiente

## Observações

- O catálogo público de mentoria continua em TypeScript nesta fase (lib/mentorship.ts) para copy/preço; a verificação de matrícula/diagnóstico já consulta o Supabase diretamente.
- A base de dados no Supabase foi criada conforme a fundação comercial aprovada (9A), a fundação de matrícula (9B.1) e a fundação de diagnóstico (9B.2); a 9B.3 não alterou o schema.
- Fase 9B.4 não foi iniciada.
- Nenhuma alteração de arquitetura foi feita além do planejado para cada fase.
