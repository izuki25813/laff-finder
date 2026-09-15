# LAFF Finder

Aplicativo de comunidade e matchmaking de Free Fire, com MVP funcional, integração com Google Apps Script e evolução para autenticação real com Supabase.

## Stack atual

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- App Router
- Google Apps Script como camada de compatibilidade temporária
- Supabase Auth + PostgreSQL para identidade e perfis

## Fluxo de desenvolvimento recomendado

1. Manter o MVP público funcionando sem alterações destrutivas.
2. Usar variáveis de ambiente para todas as integrações externas.
3. Preparar a base do Supabase antes de mover regras de negócio críticas.
4. Proteger rotas privadas no servidor e nunca confiar no client para autorização.
5. Mantenha a compatibilidade com o Apps Script legado até que a migração esteja concluída.

## Variáveis de ambiente

Crie um arquivo `.env.local` baseado em `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
LEGACY_APPS_SCRIPT_URL=https://script.google.com/macros/s/your-script/exec
```

> Nenhuma chave sensível deve ser exposta no cliente. Apenas as chaves públicas do Supabase e a URL da aplicação devem ficar em `NEXT_PUBLIC_*`.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run lint
```

## Fase 2: identidade e autorização

A implementação atual inclui:

- cadastro com email/senha usando Supabase Auth
- login e logout
- recuperação de senha
- sessão persistente via `@supabase/ssr`
- middleware para bloquear rotas privadas
- dashboard e perfil protegidos no servidor
- área administrativa somente para `ADMIN`
- criação automática de perfil vinculado a `auth.users.id`
- políticas de RLS para acesso próprio e controle de role

## Como funciona a autenticação

- O cadastro cria um usuário em `auth.users`.
- O trigger de banco cria ou atualiza o registro em `public.profiles`.
- O perfil usa o `id` do usuário do Supabase como referência principal.
- Todo novo usuário entra com `role = 'USER'` por padrão.
- Somente o banco ou um fluxo administrativo seguro pode promover um usuário para `ADMIN`.

## Proteção de rotas

- `/dashboard`, `/perfil` e `/admin` são protegidas no servidor.
- Se a sessão não existe, o usuário é redirecionado para `/login`.
- A área `/admin` também valida o perfil do usuário no banco e exige `role = 'ADMIN'`.
- O cliente nunca decide autorização: o backend e o middleware fazem a validação final.

## Role e admin

- Padrão: `USER`
- `ADMIN` deve ser concedido apenas por um processo confiável no Supabase/SQL.
- O frontend não pode alterar a própria role.
- Usuários comuns que tentarem acessar `/admin` são redirecionados para `/dashboard`.

## Processo seguro para primeiro ADMIN

1. Criar um usuário normal pelo fluxo de cadastro.
2. Acessar o painel do Supabase.
3. Verificar a tabela `public.profiles`.
4. Alterar manualmente `role` para `ADMIN` no banco, preservando a regra de segurança e o vínculo com `auth.users.id`.
5. Validar a sessão e acessar `/admin`.

> Evite criar ADMIN via cliente ou pela UI pública.

## RLS e privacidade

- Usuários só podem ler/editar o próprio perfil.
- A role não pode ser alterada por um usuário comum.
- Políticas administrativas são restritas a usuários com `role = 'ADMIN'`.
- `USING (true)` para dados privados não deve ser usado em tabelas sensíveis.

## Estrutura relevante

- `lib/auth.ts` — helpers de sessão, perfil e autorização
- `lib/supabase/config.ts` — configuração pública do Supabase
- `lib/supabase/client.ts` — cliente browser
- `lib/supabase/server.ts` — cliente server-side
- `proxy.ts` — proteção de rotas privadas no padrão atual do Next.js
- `docs/supabase/schema.sql` — schema base de banco e RLS
- `app/dashboard/page.tsx` — área privada principal
- `app/admin/page.tsx` — área administrativa
- `app/perfil/page.tsx` — página de perfil do usuário

## Compatibilidade

O Apps Script continua em uso como camada de compatibilidade temporária para o MVP público. Isso preserva feedback, waitlist, oportunidades, mentorias e demais páginas públicas sem quebrar o app existente.
