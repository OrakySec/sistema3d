# Handoff de Desenvolvimento — 3D Print Manager

Este documento serve como um guia completo do estado atual do projeto **3D Print Manager** para que outra IA possa continuar o desenvolvimento exatamente de onde parou, sem perda de contexto.

---

## 1. Visão Geral do Projeto
Um sistema SaaS profissional para gestão de impressão 3D (makers). O sistema inclui gestão de clientes (CRM), calculadora de orçamentos complexa, fila de impressão Kanban, integração com WhatsApp (Evolution API), controle de estoque de filamentos e financeiro.

O foco do design é premium, moderno e ágil, utilizando o tema personalizado **Forge Dark**.

---

## 2. Stack Tecnológica
- **Framework:** Next.js 16 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS v4 + variáveis CSS nativas
- **Componentes:** Shadcn/UI (Preset Nova + Radix Primitives)
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma v5.22.0 *(Nota: Usando v5 localmente devido à versão do Node 20.13.1 da máquina host)*
- **Autenticação:** NextAuth.js v5 (beta)
- **Background Jobs:** BullMQ + Redis
- **Storage:** MinIO (S3 compatible)
- **WhatsApp:** Evolution API v2
- **Pagamentos:** Stripe (Assinaturas SaaS) + InfinityPay (Cobrança de clientes via links)

---

## 3. Infraestrutura & Setup Atual
O projeto está preparado para deploy utilizando Docker e Traefik.
- **`docker-compose.yml`**: Configurado com os serviços `app`, `postgres`, `redis`, `minio`, e `evolution-api`. Todos os serviços possuem labels do Traefik para roteamento reverso e certificados SSL automáticos.
- **`Dockerfile`**: Multi-stage build otimizado para Next.js (standalone).
- **`.env.example`**: Todas as variáveis de ambiente necessárias estão mapeadas e documentadas.

---

## 4. O Que Já Foi Concluído (Fase 0 e Base da Fase 1)

### Banco de Dados (Schema)
- O arquivo `prisma/schema.prisma` está **100% completo e modelado**.
- Inclui modelos para: `User`, `Plan`, `Client`, `Quote`, `QuoteItem`, `Printer`, `Filament`, `CostConfig`, `Invoice`, `Expense`, etc.

### Design System & Componentes Base
- **Tema Forge Dark**: Implementado via `app/globals.css`. Fundo super escuro (`#09090B`), acentos em laranja vibrante (`#F97316`) e elementos translúcidos (glassmorphism).
- **Fontes**: Inter (corpo) e Outfit (títulos/display) configuradas no `layout.tsx`.
- **Componentes Customizados Criados:**
  - `Sidebar.tsx`: Menu lateral recolhível com animações suaves.
  - `Header.tsx`: Topbar com busca, notificações e menu do usuário.
  - `StatCard.tsx`: Card de estatísticas com indicadores de tendência para o dashboard.
  - `InfoTip.tsx`: Ícone ⓘ de ajuda contextual (Hover no Desktop, Modal no Mobile). *Funcionalidade inovadora solicitada pelo usuário.*
  - `SettingToggle.tsx`: Switch de configurações expansível e explicativo. *Funcionalidade inovadora solicitada pelo usuário.*
- **Shadcn UI**: Inicializado corretamente e componentes básicos instalados (`button`, `input`, `dialog`, `dropdown-menu`, etc.).

### Páginas & Rotas
- **Rotas estruturadas**: `(auth)`, `(dashboard)`, `(public)`.
- **`app/(dashboard)/dashboard/page.tsx`**: Tela inicial do Dashboard construída (com dados mockados), incluindo grid de cards, tabela de orçamentos recentes, fila de impressão em andamento e ações rápidas.
- **`app/(auth)/login/page.tsx`**: Página de login construída com formulário, layout split-screen (com depoimento e features do lado esquerdo) e validação usando `zod` + `react-hook-form`.

---

## 5. Inovações Específicas Solicitadas (Atenção a estes pontos)
O usuário pediu inovações específicas que devem ser seguidas nas próximas implementações:
1. **Prazo de Validade em Orçamentos:** Ao criar um orçamento, o maker deve definir um prazo máximo para o cliente aprovar o link.
2. **Controle Total da Fila de Impressão:** O sistema não pode ser apenas "Em andamento". Precisa ter botões de "Impressão Iniciada", "Pausada", "Retomada" e "Cancelada" (com log de motivos) para o sistema não bugar se houver falhas na impressora real.
3. **Link de Pagamento Embutido:** O link de aprovação do orçamento deve oferecer a opção de pagamento integrado via InfinityPay.
4. **Toggles de Funcionalidades:** O usuário deve poder ativar/desativar recursos (como o link de pagamento) nas configurações.
5. **Tooltips Contextuais:** Telas de configuração devem usar o componente `InfoTip` (já criado) para explicar conceitos.
6. **Follow-ups Customizáveis:** Mensagens do WhatsApp para pós-venda/cobrança devem ter templates padrão, mas permitir que o usuário as edite antes/durante o envio.

---

## 6. O Que Falta Fazer (Próximos Passos)

O desenvolvimento deve ser retomado a partir da **Autenticação**, pois o resto do sistema depende dela.

### Passo 1: Autenticação & Proteção (NextAuth)
- Concluir a página de Cadastro (`app/(auth)/register`).
- Configurar o `auth.ts` (NextAuth v5) com o `PrismaAdapter` e provedor de Credentials (bcrypt).
- Criar o `middleware.ts` para proteger todas as rotas do `(dashboard)`.

### Passo 2: Funcionalidades Core (Calculadora e Kanban)
- **Calculadora de Orçamentos:** Criar a interface de precificação. A lógica matemática base já existe em `lib/utils.ts` (`calculateQuote`). Incluir geração do Link Público (Fase 4).
- **Kanban de Produção:** Implementar o board usando `@dnd-kit/core`. Adicionar os controles granulares de pausa/retomada de impressão (Fase 5).

### Passo 3: WhatsApp e Infraestrutura Externa
- Integração de Webhooks do Stripe para liberar acesso SaaS.
- Integração com Evolution API (envio de QR Code na tela de configs, disparo de mensagens via BullMQ).
- Integração com a API da InfinityPay para links de pagamento.

### Passo 4: Cadastros e Relatórios
- CRUDs base (Clientes, Impressoras, Filamentos).
- Módulo financeiro (Gráficos com `recharts`).

---

## 7. Dicas para a Próxima IA
- **Node e Prisma:** O ambiente local está rodando Node `20.13.1`. Por isso, o Prisma instalado foi fixado na `^5.22.0` (o Prisma 6+ e 7 exigem Node mais recente). Ao gerar o cliente, use `npx prisma generate`.
- **Estilização:** Estamos usando Tailwind v4. O arquivo CSS principal é o `app/globals.css`, que usa a nova sintaxe `@theme inline`. Evite sobrepor configurações de tema a menos que necessário, pois o "Forge Dark" já está bem definido.
- **Componentização:** Reutilize os componentes customizados (ex: `InfoTip` e `StatCard`) e componentes do `shadcn/ui` já instalados na pasta `components/ui`.
- **Ícones:** Estamos usando `lucide-react`.

**Bom código! 🚀**
