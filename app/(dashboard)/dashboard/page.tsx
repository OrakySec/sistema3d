import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatCard } from "@/components/shared/StatCard";
import Link from "next/link";
import {
  DollarSign, FileText, Layers, Package,
  FilePlus, Printer, UserPlus, Receipt,
  Hand,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

const statusConfig = {
  DRAFT:    { label: "Rascunho", color: "text-text-muted bg-surface-hover" },
  SENT:     { label: "Enviado",  color: "text-info bg-info-subtle" },
  VIEWED:   { label: "Visualizado", color: "text-info bg-info-subtle" },
  APPROVED: { label: "Aprovado", color: "text-success bg-success-subtle" },
  REJECTED: { label: "Recusado", color: "text-error bg-error-subtle" },
  EXPIRED:  { label: "Expirado", color: "text-warning bg-warning-subtle" },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const [recentQuotes, printingCount, lowStockCount, revenues] = await Promise.all([
    prisma.quote.findMany({
      where:   { userId },
      orderBy: { createdAt: "desc" },
      take:    5,
      include: { client: { select: { name: true } } },
    }),
    prisma.kanbanCard.count({
      where: { userId, column: { in: ["PRINTING", "POST_PROD"] } },
    }),
    prisma.filament.findMany({
      where: { userId, active: true },
      select: { currentGrams: true, lowStockAlert: true },
    }).then((fs) => fs.filter((f) => f.currentGrams <= f.lowStockAlert).length),
    prisma.revenue.findMany({
      where: { userId, date: { gte: start } },
    }),
  ]);

  const monthRevenue    = revenues.reduce((a, r) => a + r.grossAmount, 0);
  const monthQuoteCount = await prisma.quote.count({ where: { userId, createdAt: { gte: start } } });

  const firstName = session.user.name?.split(" ")[0] ?? "Maker";

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
          Olá, {firstName}!
          <Hand className="h-6 w-6 text-warning" />
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Aqui está um resumo do que está acontecendo no seu negócio.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Receita do Mês"
          value={monthRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          subtitle="receita este mês"
          icon={DollarSign}
          iconColor="text-success"
          info="Soma de todas as receitas registradas no mês atual."
        />
        <StatCard
          title="Orçamentos"
          value={monthQuoteCount}
          subtitle="criados este mês"
          icon={FileText}
          iconColor="text-info"
          info="Número total de orçamentos criados neste mês."
        />
        <StatCard
          title="Em Produção"
          value={printingCount}
          subtitle="peças em produção"
          icon={Layers}
          iconColor="text-primary"
          info="Peças atualmente sendo impressas ou em pós-produção."
        />
        <StatCard
          title="Alertas de Estoque"
          value={lowStockCount}
          subtitle="filamentos em baixa"
          icon={Package}
          iconColor="text-warning"
          info="Filamentos abaixo do limite mínimo configurado."
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Orçamentos recentes */}
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-sm font-semibold text-text-primary">Orçamentos Recentes</h2>
              <p className="text-xs text-text-muted">Últimos 5</p>
            </div>
            <Link href="/orcamentos" className="text-xs font-medium text-primary hover:underline">
              Ver todos →
            </Link>
          </div>

          {recentQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="mb-3 h-8 w-8 text-text-muted" />
              <p className="text-sm font-medium text-text-primary">Nenhum orçamento ainda</p>
              <p className="mt-1 text-xs text-text-muted">Crie seu primeiro orçamento para começar.</p>
              <Link href="/orcamentos/novo"
                className="mt-4 rounded-lg gradient-primary px-4 py-2 text-xs font-semibold text-white">
                Novo Orçamento
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentQuotes.map((q) => {
                const status = statusConfig[q.status as keyof typeof statusConfig] ?? statusConfig.DRAFT;
                return (
                  <Link key={q.id} href={`/orcamentos/${q.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-hover">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{q.pieceName}</p>
                      <p className="text-xs text-text-muted">{q.client?.name ?? "Sem cliente"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-text-primary">
                        {q.totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                      <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="rounded-xl border border-border bg-surface p-4 h-fit">
          <h2 className="mb-3 font-display text-sm font-semibold text-text-primary">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Novo Orçamento",    href: "/orcamentos/novo", Icon: FilePlus  },
              { label: "Fila de Impressão", href: "/producao",        Icon: Printer   },
              { label: "Novo Cliente",      href: "/clientes",        Icon: UserPlus  },
              { label: "Registrar Despesa", href: "/financeiro",      Icon: Receipt   },
            ].map(({ label, href, Icon }) => (
              <Link key={href} href={href}
                className="flex flex-col items-center gap-2 rounded-lg border border-border p-3 text-center transition-all hover:border-primary hover:bg-primary-subtle">
                <Icon className="h-5 w-5 text-text-secondary" />
                <span className="text-xs font-medium text-text-secondary">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
