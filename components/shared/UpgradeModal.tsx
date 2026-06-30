"use client";

import { useState } from "react";
import { X, Zap, Check, Loader2 } from "lucide-react";
import { PLAN_LIMITS, LIMIT_LABELS, type LimitKey, type Plan } from "@/lib/plans";

interface Props {
  open:    boolean;
  onClose: () => void;
  limitKey: LimitKey;
  currentPlan: Plan;
  isFirstSubscriber?: boolean;
}

const FEATURES = [
  { key: "quotesPerMonth", label: "Orçamentos/mês" },
  { key: "clients",        label: "Clientes"        },
  { key: "printers",       label: "Impressoras"     },
  { key: "quoteVersions",  label: "Versões/orçamento"},
  { key: "filaments",      label: "Filamentos"      },
  { key: "whatsapp",       label: "WhatsApp auto"   },
  { key: "payment",        label: "Pagamento no link"},
] as const;

function fmt(val: number | boolean) {
  if (typeof val === "boolean") return val ? "✓" : "—";
  if (val === -1) return "Ilimitado";
  return String(val);
}

export function UpgradeModal({ open, onClose, limitKey, currentPlan, isFirstSubscriber }: Props) {
  const [loading, setLoading] = useState<"PRO" | "STUDIO" | null>(null);

  if (!open) return null;

  async function handleUpgrade(plan: "PRO" | "STUDIO") {
    setLoading(plan);
    try {
      const res  = await fetch("/api/billing/checkout", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  }

  const limitLabel = LIMIT_LABELS[limitKey];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface shadow-lg">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-display text-base font-semibold text-text-primary">
                Limite atingido
              </span>
            </div>
            <p className="text-sm text-text-secondary">
              Você atingiu o limite de <span className="font-medium text-text-primary">{limitLabel}</span> do plano {currentPlan === "FREE" ? "Grátis" : currentPlan}. Faça upgrade para continuar.
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-text-muted hover:bg-surface-hover transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabela de planos */}
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3 mb-2 text-xs font-medium text-text-muted px-1">
            <span>Recurso</span>
            <span className="text-center">Pro — R$49/mês</span>
            <span className="text-center">Estúdio — R$99/mês</span>
          </div>
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {FEATURES.map(({ key, label }) => (
              <div key={key} className={`grid grid-cols-3 gap-3 px-3 py-2.5 text-sm ${key === limitKey ? "bg-primary-subtle" : "bg-surface"}`}>
                <span className={key === limitKey ? "font-medium text-primary" : "text-text-secondary"}>{label}</span>
                <span className="text-center font-medium text-text-primary">{fmt(PLAN_LIMITS.PRO[key] as number | boolean)}</span>
                <span className="text-center font-medium text-text-primary">{fmt(PLAN_LIMITS.STUDIO[key] as number | boolean)}</span>
              </div>
            ))}
          </div>

          {isFirstSubscriber && (
            <div className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary-subtle px-3 py-2">
              <Zap className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-xs font-medium text-primary">
                🎉 Você tem 90% de desconto no primeiro mês — cupom aplicado automaticamente!
              </p>
            </div>
          )}
        </div>

        {/* Botões */}
        <div className="grid grid-cols-2 gap-3 px-6 pb-6">
          <button
            onClick={() => handleUpgrade("PRO")}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface py-3 text-sm font-semibold text-text-primary transition-all hover:border-primary hover:bg-primary-subtle disabled:opacity-60"
          >
            {loading === "PRO" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4 text-primary" /> Assinar Pro</>}
          </button>
          <button
            onClick={() => handleUpgrade("STUDIO")}
            disabled={!!loading}
            className="flex items-center justify-center gap-2 rounded-xl gradient-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading === "STUDIO" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="h-4 w-4" /> Assinar Estúdio</>}
          </button>
        </div>
      </div>
    </div>
  );
}
