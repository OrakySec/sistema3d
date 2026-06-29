"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronLeft, Copy, CheckCircle2, Send, Trash2,
  Eye, Clock, User, Printer, Package, ExternalLink,
  FileText, Ban,
} from "lucide-react";
import { updateQuoteStatus, deleteQuote } from "@/lib/actions/quotes";
import { formatBRL } from "@/lib/calculations";

// ─── Tipos ───────────────────────────────────────────────────

interface Quote {
  id: string;
  pieceName: string;
  description?: string | null;
  status: string;
  publicToken?: string | null;
  expiresAt?: Date | null;
  approvedAt?: Date | null;
  rejectedAt?: Date | null;
  viewCount: number;
  lastViewedAt?: Date | null;
  filamentGrams: number;
  printHours: number;
  filamentCost: number;
  energyCost: number;
  printerCost: number;
  paintingCost: number;
  productionCost: number;
  profitAmount: number;
  totalPrice: number;
  profitMargin: number;
  createdAt: Date;
  client?: { id: string; name: string; whatsapp?: string | null } | null;
  printer?: { name: string } | null;
  filament?: { name: string; type: string; colorHex?: string | null } | null;
  versions: { id: string; label: string; totalPrice: number; description?: string | null }[];
  kanbanCard?: { id: string; column: string } | null;
}

// ─── Config de status ────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  DRAFT:    { label: "Rascunho",     color: "text-text-muted bg-surface-hover border-border",    dot: "bg-text-muted" },
  SENT:     { label: "Enviado",      color: "text-info bg-info-subtle border-info/20",            dot: "bg-info" },
  VIEWED:   { label: "Visualizado",  color: "text-info bg-info-subtle border-info/20",            dot: "bg-info animate-pulse" },
  APPROVED: { label: "Aprovado",     color: "text-success bg-success-subtle border-success/20",   dot: "bg-success" },
  REJECTED: { label: "Recusado",     color: "text-error bg-error-subtle border-error/20",         dot: "bg-error" },
  EXPIRED:  { label: "Expirado",     color: "text-warning bg-warning-subtle border-warning/20",   dot: "bg-warning" },
};

const KANBAN_LABELS: Record<string, string> = {
  WAITING: "Aguardando", APPROVED: "Aprovado", PRINTING: "Em Produção",
  POST_PROD: "Pós-Produção", READY: "Pronto", DELIVERED: "Entregue", CANCELLED: "Cancelado",
};

// ─── Componente ───────────────────────────────────────────────

export function QuoteDetail({ quote }: { quote: Quote }) {
  const [pending, startTransition] = useTransition();
  const [copied, setCopied]        = useState(false);

  const status   = STATUS_CONFIG[quote.status] ?? STATUS_CONFIG.DRAFT;
  const publicUrl = quote.publicToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/q/${quote.publicToken}`
    : null;

  function copyLink() {
    if (!publicUrl) return;
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleStatus(s: "SENT" | "APPROVED" | "REJECTED" | "EXPIRED") {
    startTransition(() => updateQuoteStatus(quote.id, s));
  }

  function handleDelete() {
    if (!confirm(`Remover o orçamento "${quote.pieceName}"? Esta ação não pode ser desfeita.`)) return;
    startTransition(() => deleteQuote(quote.id));
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Topbar */}
      <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/orcamentos"
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft className="h-4 w-4" /> Orçamentos
          </Link>
          <span className="text-text-muted">/</span>
          <span className="text-sm font-medium text-text-primary truncate max-w-[200px]">{quote.pieceName}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copiar link */}
          {publicUrl && (
            <button onClick={copyLink}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary/50 hover:text-primary">
              {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          )}
          {publicUrl && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary/50 hover:text-primary">
              <ExternalLink className="h-4 w-4" /> Ver link
            </a>
          )}
          {quote.status === "DRAFT" && (
            <button onClick={() => handleStatus("SENT")} disabled={pending}
              className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
              <Send className="h-4 w-4" /> Enviar para cliente
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Coluna principal */}
        <div className="flex flex-col gap-5">

          {/* Card do orçamento */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="border-b border-border p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="font-display text-2xl font-bold text-text-primary">{quote.pieceName}</h1>
                  {quote.description && (
                    <p className="mt-1.5 text-sm text-text-secondary leading-relaxed">{quote.description}</p>
                  )}
                </div>
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${status.color}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                  {status.label}
                </span>
              </div>

              {/* Metadados */}
              <div className="mt-4 flex flex-wrap gap-3">
                {quote.client && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-xs text-text-secondary">
                    <User className="h-3.5 w-3.5 text-text-muted" />
                    {quote.client.name}
                  </div>
                )}
                {quote.printer && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-xs text-text-secondary">
                    <Printer className="h-3.5 w-3.5 text-text-muted" />
                    {quote.printer.name}
                  </div>
                )}
                {quote.filament && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-xs text-text-secondary">
                    {quote.filament.colorHex && (
                      <span className="h-3 w-3 rounded-full border border-border"
                        style={{ backgroundColor: quote.filament.colorHex }} />
                    )}
                    <Package className="h-3.5 w-3.5 text-text-muted" />
                    {quote.filament.name}
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-xs text-text-secondary">
                  <Clock className="h-3.5 w-3.5 text-text-muted" />
                  {new Date(quote.createdAt).toLocaleDateString("pt-BR")}
                </div>
                {quote.expiresAt && (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-hover px-3 py-1.5 text-xs text-text-secondary">
                    Expira: {new Date(quote.expiresAt).toLocaleDateString("pt-BR")}
                  </div>
                )}
              </div>
            </div>

            {/* Breakdown de custos */}
            <div className="p-6">
              <h2 className="mb-4 font-display text-sm font-semibold text-text-primary">Detalhamento de Custos</h2>
              <div className="flex flex-col gap-3">
                {[
                  { label: "Filamento",          value: quote.filamentCost,  sub: `${quote.filamentGrams}g` },
                  { label: "Energia elétrica",    value: quote.energyCost,    sub: `${quote.printHours}h` },
                  { label: "Desgaste impressora", value: quote.printerCost,   sub: `${quote.printHours}h` },
                  ...(quote.paintingCost > 0 ? [{ label: "Pintura / pós-produção", value: quote.paintingCost, sub: "" }] : []),
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="text-text-secondary">{row.label}</span>
                      {row.sub && <span className="ml-2 text-xs text-text-muted">({row.sub})</span>}
                    </div>
                    <span className="font-medium text-text-primary">{formatBRL(row.value)}</span>
                  </div>
                ))}

                <div className="my-1 border-t border-border" />

                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Custo de produção</span>
                  <span className="font-semibold text-text-primary">{formatBRL(quote.productionCost)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-success">Lucro ({quote.profitMargin}%)</span>
                  <span className="font-semibold text-success">{formatBRL(quote.profitAmount)}</span>
                </div>

                <div className="mt-2 rounded-xl gradient-primary p-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-white/80">Total</span>
                  <span className="font-display text-2xl font-bold text-white">{formatBRL(quote.totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Versões */}
            {quote.versions.length > 0 && (
              <div className="border-t border-border p-6">
                <h2 className="mb-3 font-display text-sm font-semibold text-text-primary">Versões do Orçamento</h2>
                <div className="flex flex-col gap-2">
                  {quote.versions.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-lg border border-border bg-surface-hover px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{v.label}</p>
                        {v.description && <p className="text-xs text-text-muted">{v.description}</p>}
                      </div>
                      <p className="text-sm font-bold text-text-primary">{formatBRL(v.totalPrice)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Link público */}
          {publicUrl && (
            <div className="rounded-xl border border-border bg-surface p-5">
              <h2 className="mb-3 font-display text-sm font-semibold text-text-primary">Link do Cliente</h2>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                <span className="flex-1 text-sm text-text-secondary truncate font-mono text-xs">{publicUrl}</span>
                <button onClick={copyLink}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
              </div>
              {quote.viewCount > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                  <Eye className="h-3.5 w-3.5" />
                  Visualizado {quote.viewCount}× {quote.lastViewedAt && `· Última vez: ${new Date(quote.lastViewedAt).toLocaleString("pt-BR")}`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-4">
          {/* Status e Kanban */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 font-display text-sm font-semibold text-text-primary">Status</h2>

            <div className={`mb-4 flex items-center gap-2 rounded-lg border px-3 py-2.5 ${status.color}`}>
              <span className={`h-2 w-2 rounded-full ${status.dot}`} />
              <span className="text-sm font-semibold">{status.label}</span>
            </div>

            {quote.kanbanCard && (
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-text-muted">Kanban</span>
                <Link href="/producao" className="flex items-center gap-1 font-medium text-primary hover:underline">
                  {KANBAN_LABELS[quote.kanbanCard.column] ?? quote.kanbanCard.column}
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {quote.status !== "APPROVED" && (
                <button onClick={() => handleStatus("APPROVED")} disabled={pending}
                  className="flex items-center justify-center gap-2 rounded-lg border border-success/30 bg-success-subtle py-2.5 text-sm font-medium text-success transition-colors hover:bg-success hover:text-white disabled:opacity-60">
                  <CheckCircle2 className="h-4 w-4" /> Marcar como aprovado
                </button>
              )}
              {quote.status !== "REJECTED" && quote.status !== "APPROVED" && (
                <button onClick={() => handleStatus("REJECTED")} disabled={pending}
                  className="flex items-center justify-center gap-2 rounded-lg border border-error/30 bg-error-subtle py-2.5 text-sm font-medium text-error transition-colors hover:bg-error hover:text-white disabled:opacity-60">
                  <Ban className="h-4 w-4" /> Marcar como recusado
                </button>
              )}
            </div>
          </div>

          {/* Métricas */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 font-display text-sm font-semibold text-text-primary">Métricas</h2>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Visualizações</span>
                <span className="font-semibold text-text-primary">{quote.viewCount}</span>
              </div>
              {quote.approvedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Aprovado em</span>
                  <span className="font-semibold text-success">{new Date(quote.approvedAt).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
              {quote.rejectedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Recusado em</span>
                  <span className="font-semibold text-error">{new Date(quote.rejectedAt).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Custo de produção</span>
                <span className="font-semibold text-text-primary">{formatBRL(quote.productionCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Margem de lucro</span>
                <span className="font-semibold text-success">{quote.profitMargin}%</span>
              </div>
            </div>
          </div>

          {/* Ações destrutivas */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <h2 className="mb-3 font-display text-sm font-semibold text-text-primary">Ações</h2>
            <div className="flex flex-col gap-2">
              <Link href={`/orcamentos/${quote.id}/editar`}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary/50 hover:text-primary">
                <FileText className="h-4 w-4" /> Editar orçamento
              </Link>
              <button onClick={handleDelete} disabled={pending}
                className="flex items-center justify-center gap-2 rounded-lg border border-error/30 bg-error-subtle py-2.5 text-sm font-medium text-error transition-colors hover:bg-error hover:text-white disabled:opacity-60">
                <Trash2 className="h-4 w-4" /> Excluir orçamento
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
