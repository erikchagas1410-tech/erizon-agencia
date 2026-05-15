# AI Agency OS

SaaS multiagente para operação criativa. O usuário cadastra a identidade completa de cada cliente uma única vez e depois só precisa escrever pedidos simples como `crie um carrossel de dicas` para disparar uma squad com 5 especialistas de IA: estratégia, copy, direção de arte, tráfego e análise.

## Stack

- Next.js 14 com App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres + RLS
- Groq API com modelo `llama-3.3-70b-versatile`
- Deploy pronto para Vercel

## O que está pronto

- Login com Google OAuth e magic link via Supabase
- Middleware protegendo páginas e APIs
- Gestão completa de clientes com CRUD
- Fluxo principal de produção com 5 agentes executados em paralelo
- Histórico de campanhas por cliente
- Exportação de resultados em `.md`
- Botão de cópia por agente
- Busca rápida no Canva a partir da resposta do Art Director
- Interface responsiva em PT-BR, dark theme e cards em glassmorphism

## Estrutura

```text
app/
  (protected)/
    page.tsx
    clientes/page.tsx
    layout.tsx
  api/
    agency/route.ts
    clients/route.ts
    clients/[id]/route.ts
  auth/
    callback/route.ts
    signout/route.ts
  login/page.tsx
components/
  auth/
  clients/
  dashboard/
  layout/
lib/
  brand-theme.ts
  groq.ts
  language.ts
  markdown.ts
  prompts.ts
  serializers.ts
  supabase/
supabase/
  migrations/001_init.sql
```

## 1. Instalação

```bash
npm install
```

## 2. Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```env
ANTHROPIC_API_KEY=
GROQ_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_NAME=AI Agency OS
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Observações

- `ANTHROPIC_API_KEY` fica exclusivamente no servidor e alimenta o editor visual com IA.
- `GROQ_API_KEY` fica exclusivamente no servidor.
- `SUPABASE_SERVICE_ROLE_KEY` também é server-side only.
- `NEXT_PUBLIC_APP_URL` deve refletir a URL atual do app local ou de produção.

## 3. Configuração do Supabase

### Banco e RLS

Execute a migration em `supabase/migrations/001_init.sql`.

Se estiver usando Supabase CLI:

```bash
npx supabase db push
```

Ou copie o SQL para o SQL Editor do projeto no painel do Supabase.

### Auth

No Supabase, habilite:

- Google OAuth
- Magic Link

Configure também:

- `Site URL`: `http://localhost:3000` no desenvolvimento
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://seu-dominio.com/auth/callback`

### Template do Magic Link

Para o fluxo SSR funcionar bem com o endpoint `/auth/callback`, ajuste o template de e-mail do Supabase para enviar `token_hash`.

Use uma URL no formato:

```text
{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
```

Se quiser manter redirecionamentos adicionais, adapte esse template conforme a sua estratégia de `next`.

## 4. Desenvolvimento

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

## 5. Deploy na Vercel

1. Suba o projeto para um repositório Git.
2. Importe o repositório na Vercel.
3. Configure as mesmas variáveis do `.env.local`.
4. Ajuste `NEXT_PUBLIC_APP_URL` para a URL real da aplicação.
5. No Supabase Auth, adicione a URL final da Vercel em `Site URL` e `Redirect URLs`.
6. Faça o deploy.

## Fluxo de uso

1. Cadastre um cliente completo em `/clientes`.
2. Vá para `/`.
3. Selecione o cliente.
4. Digite um pedido curto.
5. Clique em `Rodar time de 5 agentes`.
6. Consulte os cards gerados, copie, exporte ou reabra campanhas do histórico.

## Como os agentes funcionam

O endpoint `app/api/agency/route.ts`:

1. Recebe `clientId` e `request`
2. Carrega a identidade completa do cliente no Supabase
3. Detecta o idioma predominante da marca
4. Dispara 5 chamadas paralelas para a Groq API
5. Salva o resultado em `campaigns`
6. Retorna a campanha pronta para a UI

## Observações de produção

- O Groq é chamado apenas no servidor.
- O acesso a `clients` e `campaigns` está protegido por RLS.
- As campanhas são removidas automaticamente quando um cliente é excluído, via `ON DELETE CASCADE`.
- O tema visual da interface muda de forma sutil a partir da estética do cliente selecionado.

## Scripts úteis

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
```
