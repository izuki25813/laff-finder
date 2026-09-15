# LAFF Finder - Auditoria da base atual e estratégia de evolução incremental

## 1. Stack confirmada

A stack real do projeto foi confirmada por leitura dos arquivos do repositório e do `package.json`:

- Next.js 16.3.4
- React 19.2.8
- TypeScript 5
- Tailwind CSS 4
- App Router do Next.js
- Vercel como destino de deploy natural (porque o projeto é Next.js e foi gerado com template do Vercel)
- Sem autenticação nativa
- Sem banco oficial no repositório
- Sem server actions ou API local em Next
- Integração externa via Google Apps Script

## 2. Estrutura atual

Principais diretórios e arquivos:

- `app/` - páginas e componentes do App Router
  - `app/page.tsx` - home
  - `app/cadastro/page.tsx` + `CadastroClient.tsx` - cadastro
  - `app/feedback/page.tsx` + `FeedbackClient.tsx` - feedback
  - `app/lista-espera/page.tsx` + `ListaEsperaClient.tsx` - waitlist/VIP
  - `app/complet/page.tsx` + `CompletClient.tsx` - vagas/complet
  - `app/procurar/page.tsx` + `ProcurarClient.tsx` - busca de jogadores
  - `app/mentoria/page.tsx` - mentoria
  - `app/oportunidades/page.tsx` - oportunidades
  - `app/em-breve/page.tsx` - placeholder
  - `app/layout.tsx` - layout raiz
  - `app/globals.css` - estilos globais
- `lib/config.ts` - configuração central da URL do Apps Script
- `public/` - vazio ou sem conteúdo relevante no momento
- `package.json` - stack e scripts

## 3. Arquitetura atual

Arquitetura predominante:

- Front-end em Next.js App Router
- Componentes client-side em páginas com `"use client"`
- Dados e ações enviadas para Apps Script via `fetch`
- Sem camada de backend em Node/Next; a persistência está no Google Apps Script
- Estrutura funcional e orientada a páginas, não a módulos de domínio

## 4. Funcionalidades já funcionando e que devem ser preservadas

- Navegação e landing page principal
- Cadastro de jogador
- Envio de feedback
- Listagem de feedbacks
- Votação de feedbacks
- Lista de espera VIP
- Publicação de posts de complet e divulgação
- Busca de jogadores (página funcional)
- Estrutura de rota e navegação por páginas
- Integração do Apps Script para persistência/consulta

## 5. Integrações externas confirmadas

- Google Apps Script Web App
  - URL centralizada em `lib/config.ts`
  - usada por:
    - `app/cadastro/CadastroClient.tsx`
    - `app/feedback/FeedbackClient.tsx`
    - `app/complet/CompletClient.tsx`
    - `app/lista-espera/ListaEsperaClient.tsx`
- WhatsApp links externos
  - grupo de ZK
  - botão de apoio/contato
- YouTube links externos
  - canal e vídeos
- Instagram links externos em feedbacks

## 6. Sistema de autenticação, banco e usuários

O projeto não possui:

- autenticação real
- sessão do usuário
- JWT / cookies / NextAuth / Clerk / Supabase Auth
- banco relacional ou NoSQL do próprio app
- modelos de usuário em um backend interno
- roles, permissões ou dashboard de admin

O que existe hoje é principalmente um fluxo front-end + Apps Script, sem identidade consolidada do usuário.

## 7. Sistema de times / LAFF / busca / vagas / mentoria / pagamentos / agenda

Esses aspectos existem como conceitos e fluxos visuais, mas ainda não possuem uma estrutura robusta e integrada de domínio:

- busca de jogadores: funcional, mas sem filtros profundos e sem banco interno
- vagas/complet: funcional como publicação, sem regra de negócio mais elaborada
- mentoria: página de apresentação, sem painel, sem autenticação e sem cobrança real
- waitlist VIP: fluxo de inscrição, mas sem autenticação/controle administrativo estrutural
- pagamento: presença de copy, mas sem gateway real e sem persistência de pagamento
- agenda: não há mecanismo formal de calendarização/agenda real
- area administrativa: não existe ainda de forma robusta

## 8. Backup/versionamento

Existe backup/versionamento via Git, com histórico local e remote GitHub. Isso é bom para evolução incremental, mas não substitui:

- backup dos dados de Apps Script
- export de planilhas/coleções
- snapshots do ambiente de produção
- backup dos arquivos de configuração e variáveis sensíveis

## 9. Validações, segurança, performance e UX

### Validações
- há validação básica de formulário
- há lógica de tratamento de erro em alguns clientes
- ainda faltam validações mais fortes em vários fluxos

### Segurança
- faltam regras de autorização/admin
- faltam limites para entradas e ações sensíveis
- faltam variáveis de ambiente para segredos
- faltam controles para impedir abuso em endpoints públicos
- há risco de ações administrativas executadas com base em prompts ou senhas frágeis

### Performance
- renderização simples e boa para MVP
- sem grandes cargas de dados
- mas o uso de fetch direto em cliente sem caching pode ficar frágil em escala

### UX
- visual forte e coerente com branding
- páginas tem boa camada visual, mas algumas áreas ainda parecem protótipo ou mockadas

## 10. Problemas identificados

### Problema 1: ausência de backend próprio
- Arquivo: `package.json`, `app/*/*.tsx`, `lib/config.ts`
- Localização aproximada: toda a app e a URL centralizada
- Problema: o projeto depende de Apps Script como backend, sem uma camada própria de domínio e persistência
- Impacto: alta dificuldade de manutenção, escalabilidade e autenticação
- Solução recomendada: manter Apps Script como compatibilidade e criar uma camada de backend real em paralelo quando necessário
- Prioridade: ALTA

### Problema 2: sem autenticação real de usuários
- Arquivo: `app/*/*.tsx`
- Localização aproximada: páginas de cadastro/feedback/lista-espera
- Problema: não há identidade real do usuário, sessão, permissão ou papel
- Impacto: risco de abuso, segurança fraca e dificuldade para evoluir admin e dashboard
- Solução recomendada: introduzir autenticação em uma etapa posterior, preservando os fluxos atuais
- Prioridade: CRÍTICA

### Problema 3: risco de ações administrativas fracas
- Arquivo: `app/feedback/FeedbackClient.tsx`, `app/complet/CompletClient.tsx`, `app/lista-espera/ListaEsperaClient.tsx`
- Localização aproximada: funções de delete/vote/admin
- Problema: ações sensíveis dependem de prompt e lógica client-side com pouca validação real
- Impacto: abuso, manipulação, conflitos de dados e vulnerabilidades de integridade
- Solução recomendada: mover ações admin para backend autenticado e com autorização real
- Prioridade: CRÍTICA

### Problema 4: dados e lógica fortemente acoplados ao Apps Script
- Arquivo: `lib/config.ts`, `app/**/*.tsx`
- Localização aproximada: todos os clientes front-end
- Problema: a regra de negócio e persistência estão espalhadas em vários clientes
- Impacto: baixa manutenibilidade e alta fragilidade de evolução
- Solução recomendada: implementar uma camada de adapter e manter compatibilidade com o endpoint atual
- Prioridade: ALTA

### Problema 5: ausência de variáveis de ambiente e de segurança operacional
- Arquivo: `lib/config.ts`, `README.md`, configuração do projeto
- Localização aproximada: raiz e arquivos de configuração
- Problema: URL e configurações sensíveis estão em código e não em ambiente externo
- Impacto: risco de exposição e dificuldade de deploy em múltiplos ambientes
- Solução recomendada: mover secrets e endpoints para variáveis de ambiente e usar `.env*` com regras de segurança
- Prioridade: ALTA

### Problema 6: páginas em estado de protótipo/placeholder
- Arquivo: `app/em-breve/page.tsx`, `app/mentoria/page.tsx`, `app/oportunidades/page.tsx`
- Localização aproximada: páginas de conteúdo e marketing
- Problema: algumas páginas parecem prontas, mas ainda estão em estado conceitual ou incompleto
- Impacto: sensação de produto inacabado
- Solução recomendada: definir status e foco por página antes de evoluir
- Prioridade: MÉDIA

### Problema 7: dependência de Apps Script como backend único
- Arquivo: `lib/config.ts` e todos os clientes que o usam
- Localização aproximada: clientes que fazem fetch
- Problema: o projeto está preso ao contrato externo do Apps Script
- Impacto: risco de quebra por qualquer mudança externa no contrato
- Solução recomendada: introduzir um layer de compatibilidade para abstrair a integração
- Prioridade: ALTA

### Problema 8: ausência de dashboard real e área administrativa
- Arquivo: `app/*` em geral
- Localização aproximada: ausência de rota de admin e de painel
- Problema: não existe área para moderar conteúdo, usuários, waitlist ou dados sensíveis
- Impacto: baixa governança e baixa capacidade operacional
- Solução recomendada: planejar um painel administrativo depois da base funcional estar protegida
- Prioridade: MÉDIA

## 11. O que está funcionando hoje

- Next.js e páginas renderizando normalmente
- navegação e landing page
- integração externa do Apps Script funcionando para feedback e cadastro
- build passando
- fluxo principal de interação está operacional

## 12. O que está incompleto / parcialmente funcional

- autenticação
- dashboard/admin
- pagamentos e cobrancas reais
- agenda de mentoria
- busca de jogadores com regras mais robustas
- controle de usuários e perfis
- dados persistidos em banco próprio
- regras de negócio mais sofisticadas

## 13. Recomendação de arquitetura para evolução incremental

Sem quebrar o que já funciona, a recomendação é:

1. Manter o Apps Script atual como camada de compatibilidade e fallback
2. Proteger as ações críticas por um backend próprio futuro
3. Centralizar integrações em adapters e constantes de configuração
4. Adotar variáveis de ambiente para URLs e chaves
5. Documentar contratos de payload e respostas do Apps Script
6. Avaliar gradualmente migração de dados para banco real
7. Adotar autenticação somente quando a base estiver estabilizada
8. Criar dashboard admin com leitura/separação dos dados já existentes

## 14. Roadmap recomendado

### Fase 1 - proteção da base atual
- documentar arquitetura atual
- documentar integracoes externas
- centralizar e proteger configurações
- validar contratos e payloads
- evitar alterações em UX funcional já validada

### Fase 2 - estabilização operacional
- melhorar validações e mensagens de erro
- revisar permissões e ações sensíveis
- limpar rotas e revisar páginas placeholders
- preparar ambiente para autenticação futura

### Fase 3 - preparação para migração suave
- definir banco de dados alvo
- definir modelo de usuário, time, vaga e mentoria
- planejar importação de dados do Apps Script
- definir compatibilidade temporária entre entorno antigo e novo

### Fase 4 - autenticação e painel admin
- login de usuários/admin
- administração de feedbacks e cadastros
- dashboard de dados e métricas

### Fase 5 - escala e monetização
- mentoria e pagamento de verdade
- agenda e acompanhamento
- busca e time match mais avançados

## 15. Ordem de implementação recomendada para minimizar risco

1. Documentar arquitetura atual e contratos de integração
2. Proteger URLs, configs e dados sensíveis
3. Revisar fluxos de admin e segurança
4. Validar e estabilizar formulários existentes
5. Preparar camada de compatibilidade antes de qualquer refactor
6. Só então introduzir autenticação e estrutura maior
7. Depois, migrar dados e expandir banco/serviços

## 16. Conclusão

O projeto encontra-se em um estado funcional de MVP, com base sólida para evolução incremental. O maior risco não é a interface, mas a arquitetura de persistência, autorização e integração externa que ainda não estão separadas em camadas fortes. A evolução deve ser incremental, não destrutiva.
