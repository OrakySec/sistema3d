import Link from "next/link";
import { Plus, FileText, Search } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orçamentos" };

const mockQuotes = [
  { id: "q1", piece: "Suporte Mesa", client: "Ana Lima", total: 85, status: "APPROVED", createdAt: "28/06/2026" },
  { id: "q2", piece: "Case Raspberry Pi 5", client: "Pedro Costa", total: 120, status: "SENT", createdAt: "27/06/2026" },
  { id: "q3", piece: "Organizador Gaveta (6x)", client: "Mariana Silva", total: 340, status: "APPROVED", createdAt: "26/06/2026" },
  { id: "q4", piece: "Engrenagem Moto", client: "Carlos Mendes", total: 95, status: "DRAFT", createdAt: "25/06/2026" },
  { id: "q5", piece: "Vaso Decorativo Voronoi", client: "Fernanda Rocha", total: 65, status: "REJECTED", createdAt: "24/06/2026" },
  { id: "q6", piece: "Protetor de Canto (10x)", client: "João Batista", total: 180, status: "EXPIRED", createdAt: "18/06/2026" },
];

const statusConfig = {
  DRAFT:    { label: "Rascunho", color: "text-text-muted bg-surface-hover border-border" },
  SENT:     { label: "Enviado",  color: "text-info bg-info-subtle border-info/20" },
  VIEWED:   { label: "Visualizado", color: "text-info bg-info-subtle border-info/20" },
  APPROVED: { label: "Aprovado", color: "text-success bg-success-subtle border-success/20" },
  REJECTED: { label: "Recusado", color: "text-error bg-error-subtle border-error/20" },
  EXPIRED:  { label: "Expirado", color: "text-warning bg-warning-subtle border-warning/20" },
};

export default function OrcamentosPage() {
  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Orçamentos</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {mockQuotes.length} orçamentos no total
          </p>
        </div>
        <Link
          href="/orcamentos/novo"
          className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Link>
      </div>

      {/* Filtros e busca */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Buscar por peça ou cliente..."
            className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2">
          {(["Todos", "Aprovado", "Enviado", "Rascunho", "Expirado"] as const).map((f) => (
            <button
              key={f}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                f === "Todos"
                  ? "border-primary bg-primary-subtle text-primary"
                  : "border-border bg-surface text-text-secondary hover:border-primary/50 hover:text-text-primary"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="hidden grid-cols-[auto_1fr_1fr_120px_120px_40px] items-center gap-4 border-b border-border px-5 py-3 sm:grid">
          <span className="text-xs font-medium text-text-muted">#</span>
          <span className="text-xs font-medium text-text-muted">Peça / Cliente</span>
          <span className="text-xs font-medium text-text-muted">Data</span>
          <span className="text-xs font-medium text-text-muted">Status</span>
          <span className="text-xs font-medium text-text-muted text-right">Total</span>
          <span />
        </div>

        <div className="divide-y divide-border">
          {mockQuotes.map((q, i) => {
            const status = statusConfig[q.status as keyof typeof statusConfig];
            return (
              <Link
                key={q.id}
                href={`/orcamentos/${q.id}`}
                className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-surface-hover sm:grid sm:grid-cols-[auto_1fr_1fr_120px_120px_40px] sm:items-center sm:gap-4"
              >
                <span className="text-xs text-text-muted font-mono">
                  {String(i + 1).padStart(3, "0")}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{q.piece}</p>
                  <p className="text-xs text-text-muted">{q.client}</p>
                </div>
                <span className="text-xs text-text-muted">{q.createdAt}</span>
                <span
                  className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color}`}
                >
                  {status.label}
                </span>
                <span className="text-sm font-semibold text-text-primary sm:text-right">
                  {q.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
                <FileText className="hidden h-4 w-4 text-text-muted sm:block" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Empty state (oculto com mock) */}
      {mockQuotes.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <FileText className="mb-4 h-10 w-10 text-text-muted" />
          <p className="font-display text-base font-semibold text-text-primary">
            Nenhum orçamento ainda
          </p>
          <p className="mt-1 text-sm text-text-muted">
            Crie seu primeiro orçamento e envie para o cliente em minutos.
          </p>
          <Link
            href="/orcamentos/novo"
            className="mt-6 flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Link>
        </div>
      )}
    </>
  );
}
