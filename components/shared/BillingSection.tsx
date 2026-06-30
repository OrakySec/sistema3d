"use client";

import { useState } from "react";
import { Zap, CreditCard, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { PLAN_LIMITS, PLAN_NAMES, PLAN_PRICES, type Plan } from "@/lib/plans";
type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID";

interface Props {
  plan:               Plan;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd:   string | null;
  hasStripeId:        boolean;
}

const STATUS_LABELS: Record<SubscriptionStatus, { label: string; color: string }> = {
  TRIAL:    { label: "Trial",       color: "text-warning bg-warning-subtle" },
  ACTIVE:   { label: "Ativo",       color: "text-success bg-success-subtle" },
  PAST_DUE: { label: "Em atraso",   color: "text-error bg-error-subtle" },
  CANCELED: { label: "Cancelado",   color: "text-text-muted bg-surface-hover" },
  UNPAID:   { label: "Não pago",    color: "text-error bg-error-subtle" },
};

export function BillingSection({ plan, subscriptionStatus, currentPeriodEnd, hasStripeId }: Props) {
  const [loading, setLoading] = useState<"PRO" | "STUDIO" | "portal" | null>(null);

  const limits  = PLAN_LIMITS[plan];
  const status  = STATUS_LABELS[subscriptionStatus];
  const periodEnd = currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString("pt-BR") : null;

  async function handleUpgrade(targetPlan: "PRO" | "STUDIO") {
    setLoading(targetPlan);
    const res  = await fetch("/api/billing/checkout", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ plan: targetPlan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(null);
  }

  async function handlePortal() {
    setLoading("portal");
    const res  = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(null);
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Plano atual */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle border border-primary/20">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-display text-sm font-semibold text-text-primary">
                Plano {PLAN_NAMES[plan]}
              </p>
              <p className="text-xs text-text-muted">{PLAN_PRICES[plan]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>

        {periodEnd && (
          <p className="text-xs text-text-muted mb-4 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            Próxima cobrança: {periodEnd}
          </p>
        )}

        {/* Limites atuais */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Orçamentos/mês", val: limits.quotesPerMonth },
            { label: "Clientes",       val: limits.clients        },
            { label: "Impressoras",    val: limits.printers       },
            { label: "Filamentos",     val: limits.filaments      },
          ].map(({ label, val }) => (
            <div key={label} className="rounded-lg bg-surface-hover px-3 py-2">
              <p className="text-xs text-text-muted">{label}</p>
              <p className="text-sm font-semibold text-text-primary">
                {val === -1 ? "Ilimitado" : val}
              </p>
            </div>
          ))}
        </div>

        {hasStripeId && (
          <button
            onClick={handlePortal}
            disabled={!!loading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-60"
          >
            {loading === "portal" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CreditCard className="h-4 w-4" /> Gerenciar assinatura</>}
          </button>
        )}
      </div>

      {/* Upgrade — só mostra se não é Estúdio */}
      {plan !== "STUDIO" && (
        <div className="rounded-xl border border-primary/20 bg-primary-subtle p-5">
          <div className="flex items-start gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-text-primary">Faça upgrade do seu plano</p>
              <p className="text-xs text-text-secondary mt-0.5">
                90% de desconto no primeiro mês — aplicado automaticamente
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {plan === "FREE" && (
              <button
                onClick={() => handleUpgrade("PRO")}
                disabled={!!loading}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface py-2.5 text-sm font-semibold text-text-primary hover:border-primary hover:bg-primary-subtle transition-all disabled:opacity-60"
              >
                {loading === "PRO" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="h-4 w-4 text-primary" /> Upgrade para Pro — R$ 4,90 no 1º mês</>}
              </button>
            )}
            <button
              onClick={() => handleUpgrade("STUDIO")}
              disabled={!!loading}
              className="flex items-center justify-center gap-2 rounded-lg gradient-primary py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading === "STUDIO" ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="h-4 w-4" /> Upgrade para Estúdio — R$ 9,90 no 1º mês</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
