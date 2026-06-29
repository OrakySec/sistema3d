import { StatCard } from "@/components/shared/StatCard";
import {
  DollarSign,
  FileText,
  Layers,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

// ─────────────────────────────────────────────────────────────
// Dados mock — serão substituídos por queries ao banco de dados
// ─────────────────────────────────────────────────────────────
const stats = {
  revenue: { value: "R$ 8.420", trend: 12.4, subtitle: "receita este mês" },
  quotes: { value: 23, trend: 5.1, subtitle: "orçamentos gerados" },
  printing: { value: 7, trend: 0, subtitle: "em produção agora" },
  stockAlert: { value: 3, trend: -2, subtitle: "itens em estoque baixo" },
};

const recentQuotes = [
  { id: "001", client: "Ana Lima", piece: "Suporte Mesa", value: "R$ 85,00", status: "APPROVED" },
  { id: "002", client: "Pedro Costa", piece: "Case Raspberry Pi 5", value: "R$ 120,00", status: "SENT" },
  { id: "003", client: "Mariana Silva", piece: "Organizador Gaveta (6x)", value: "R$ 340,00", status: "APPROVED" },
  { id: "004", client: "Carlos Mendes", piece: "Engrenagem Moto", value: "R$ 95,00", status: "DRAFT" },
  { id: "005", client: "Fernanda Rocha", piece: "Vaso Decorativo Voronoi", value: "R$ 65,00", status: "REJECTED" },
];

const statusConfig = {
  DRAFT:    { label: "Rascunho", color: "text-text-muted bg-surface-hover" },
  SENT:     { label: "Enviado",  color: "text-info bg-info-subtle" },
  APPROVED: { label: "Aprovado", color: "text-success bg-success-subtle" },
  REJECTED: { label: "Recusado", color: "text-error bg-error-subtle" },
  EXPIRED:  { label: "Expirado", color: "text-warning bg-warning-subtle" },
};

const printQueue = [
  { piece: "Case Raspberry Pi 5", client: "Pedro Costa", progress: 68, hours: "4h restantes", printer: "Bambu X1C" },
  { piece: "Organizador Gaveta", client: "Mariana Silva", progress: 23, hours: "11h restantes", printer: "Ender 3 V3" },
  { piece: "Suporte Mesa", client: "Ana Lima", progress: 91, hours: "< 1h", printer: "Bambu X1C" },
];

export default function DashboardPage() {
  return (
    <>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-text-primary">
          Bom dia! 👋
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Aqui está um resumo do que está acontecendo no seu negócio.
        </p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Receita do Mês"
          value={stats.revenue.value}
          subtitle={stats.revenue.subtitle}
          icon={DollarSign}
          iconColor="text-success"
          trend={{ value: stats.revenue.trend }}
          info="Soma de todas as receitas registradas no mês atual, incluindo pagamentos recebidos e a receber."
        />
        <StatCard
          title="Orçamentos"
          value={stats.quotes.value}
          subtitle={stats.quotes.subtitle}
          icon={FileText}
          iconColor="text-info"
          trend={{ value: stats.quotes.trend }}
          info="Número total de orçamentos criados neste mês, independente do status."
        />
        <StatCard
          title="Em Produção"
          value={stats.printing.value}
          subtitle={stats.printing.subtitle}
          icon={Layers}
          iconColor="text-primary"
          trend={{ value: stats.printing.trend }}
          info="Peças atualmente sendo impressas ou em pós-produção."
        />
        <StatCard
          title="Alertas de Estoque"
          value={stats.stockAlert.value}
          subtitle={stats.stockAlert.subtitle}
          icon={Package}
          iconColor="text-warning"
          trend={{ value: stats.stockAlert.trend, label: "vs semana passada" }}
          info="Filamentos abaixo do limite mínimo configurado. Clique para ver quais."
        />
      </div>

      {/* Grid de conteúdo */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">

        {/* Orçamentos recentes */}
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="font-display text-sm font-semibold text-text-primary">
                Orçamentos Recentes
              </h2>
              <p className="text-xs text-text-muted">Últimas 24 horas</p>
            </div>
            <a
              href="/orcamentos"
              className="text-xs font-medium text-primary hover:underline transition-colors"
            >
              Ver todos →
            </a>
          </div>

          <div className="divide-y divide-border">
            {recentQuotes.map((q) => {
              const status = statusConfig[q.status as keyof typeof statusConfig];
              return (
                <a
                  key={q.id}
                  href={`/orcamentos/${q.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-xs font-bold text-text-secondary">
                    #{q.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{q.piece}</p>
                    <p className="text-xs text-text-muted">{q.client}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-text-primary">{q.value}</p>
                    <span
                      className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}
                    >
                      {status.label}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>

        {/* Painel lateral direito */}
        <div className="flex flex-col gap-6">
          {/* Fila de impressão */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-display text-sm font-semibold text-text-primary">
                🖨️ Em Produção
              </h2>
              <a href="/producao" className="text-xs font-medium text-primary hover:underline">
                Gerenciar →
              </a>
            </div>
            <div className="flex flex-col gap-3 p-4">
              {printQueue.map((item, i) => (
                <div key={i} className="rounded-lg bg-surface-hover p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {item.piece}
                      </p>
                      <p className="text-xs text-text-muted">{item.client} · {item.printer}</p>
                    </div>
                    <span className="shrink-0 text-xs text-text-muted">{item.hours}</span>
                  </div>
                  {/* Barra de progresso */}
                  <div className="h-1.5 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-right text-xs font-medium text-text-secondary">
                    {item.progress}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Ações rápidas */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="mb-3 font-display text-sm font-semibold text-text-primary">
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Novo Orçamento", href: "/orcamentos/novo", icon: "📝" },
                { label: "Fila de Impressão", href: "/producao", icon: "🖨️" },
                { label: "Registrar Despesa", href: "/financeiro/nova-despesa", icon: "💸" },
                { label: "Adicionar Peça", href: "/orcamentos/biblioteca/nova", icon: "📦" },
              ].map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border p-3 text-center transition-all duration-150 hover:border-primary hover:bg-primary-subtle"
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-xs font-medium text-text-secondary">
                    {action.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
