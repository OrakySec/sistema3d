import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { OrcamentosFilters } from "./OrcamentosFilters";

export const metadata: Metadata = { title: "Orçamentos" };

const statusConfig = {
  DRAFT:    { label: "Rascunho", color: "text-text-muted bg-surface-hover border-border" },
  SENT:     { label: "Enviado",  color: "text-info bg-info-subtle border-info/20" },
  VIEWED:   { label: "Visualizado", color: "text-info bg-info-subtle border-info/20" },
  APPROVED: { label: "Aprovado", color: "text-success bg-success-subtle border-success/20" },
  REJECTED: { label: "Recusado", color: "text-error bg-error-subtle border-error/20" },
  EXPIRED:  { label: "Expirado", color: "text-warning bg-warning-subtle border-warning/20" },
};

interface Props {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function OrcamentosPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { q, status } = await searchParams;

  const quotes = await prisma.quote.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status: status as any } : {}),
      ...(q ? {
        OR: [
          { pieceName: { contains: q, mode: "insensitive" } },
          { client: { name: { contains: q, mode: "insensitive" } } },
        ],
      } : {}),
    },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Orçamentos</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {quotes.length} orçamento{quotes.length !== 1 ? "s" : ""} no total
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

      <OrcamentosFilters />

      {/* Tabela */}
      {quotes.length > 0 ? (
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
            {quotes.map((q, i) => {
              const status = statusConfig[q.status as keyof typeof statusConfig] ?? statusConfig.DRAFT;
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
                    <p className="text-sm font-medium text-text-primary truncate">{q.pieceName}</p>
                    <p className="text-xs text-text-muted">{q.client?.name ?? "Sem cliente"}</p>
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(q.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  <span className="text-sm font-semibold text-text-primary sm:text-right">
                    {q.totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </span>
                  <FileText className="hidden h-4 w-4 text-text-muted sm:block" />
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <FileText className="mb-4 h-10 w-10 text-text-muted" />
          <p className="font-display text-base font-semibold text-text-primary">
            {q || status ? "Nenhum orçamento encontrado" : "Nenhum orçamento ainda"}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {q || status
              ? "Tente ajustar os filtros de busca."
              : "Crie seu primeiro orçamento e envie para o cliente em minutos."}
          </p>
          {!q && !status && (
            <Link
              href="/orcamentos/novo"
              className="mt-6 flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Novo Orçamento
            </Link>
          )}
        </div>
      )}
    </>
  );
}
