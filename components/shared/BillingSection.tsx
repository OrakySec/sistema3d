"use client";

import { useState } from "react";
import {
  Zap, CreditCard, Loader2, CheckCircle2, X,
  FileText, Users, Printer, Package, MessageCircle,
  DollarSign, Image, Infinity,
} from "lucide-react";
import { PLAN_LIMITS, PLAN_NAMES, PLAN_PRICES, type Plan } from "@/lib/plans";

type SubscriptionStatus = "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED" | "UNPAID";

interface Props {
  plan:               Plan;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd:   string | null;
  hasStripeId:        boolean;
}

const STATUS_LABELS: Record<SubscriptionStatus, { label: string; color: string }> = {
  TRIAL:    { label: "Trial",     color: "text-warning bg-warning-subtle" },
  ACTIVE:   { label: "Ativo",     color: "text-success bg-success-subtle" },
  PAST_DUE: { label: "Em atraso", color: "text-error bg-error-subtle" },
  CANCELED: { label: "Cancelado", color: "text-text-muted bg-surface-hover" },
  UNPAID:   { label: "Não pago",  color: "text-error bg-error-subtle" },
};

interface PlanFeature {
  icon: React.ElementType;
  label: string;
  pro: string | boolean;
  studio: string | boolean;
}

const FEATURES: PlanFeature[] = [
  { icon: FileText,     label: "Orçamentos/mês",        pro: "Ilimitados",  studio: "Ilimitados"  },
  { icon: Users,        label: "Clientes cadastrados",   pro: "20",          studio: "Ilimitados"  },
  { icon: Printer,      label: "Impressoras",            pro: "3",           studio: "Ilimitadas"  },
  { icon: Package,      label: "Filamentos no estoque",  pro: "10",          studio: "Ilimitados"  },
  { icon: FileText,     label: "Versões por orçamento",  pro: "2",           studio: "Ilimitadas"  },
  { icon: MessageCircle,label: "WhatsApp automático",    pro: false,         studio: true          },
  { icon: DollarSign,   label: "Link de pagamento",      pro: false,         studio: true          },
  { icon: Image,        label: "Portfólio público",      pro: false,         studio: true          },
  { icon: Infinity,     label: "Tudo ilimitado",         pro: false,         studio: true          },
];

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === false) return <X className="h-4 w-4 text-text-muted" />;
  if (value === true)  return <CheckCircle2 className="h-4 w-4 text-success" />;
  return <span className="text-sm font-semibold text-text-primary">{value}</span>;
}

export function BillingSection({ plan, subscriptionStatus, currentPeriodEnd, hasStripeId }: Props) {
  const [loading, setLoading] = useState<"PRO" | "STUDIO" | "portal" | null>(null);

  const limits    = PLAN_LIMITS[plan];
  const status    = STATUS_LABELS[subscriptionStatus];
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

      {/* ── Plano atual ─────────────────────────────────────── */}
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
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>

        {periodEnd && (
          <p className="text-xs text-text-muted mb-4 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            Próxima cobrança: {periodEnd}
          </p>
        )}

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
            {loading === "portal"
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <><CreditCard className="h-4 w-4" /> Gerenciar assinatura</>}
          </button>
        )}
      </div>

      {/* ── Cards de upgrade ───────────────────────────────── */}
      {plan !== "STUDIO" && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <p className="font-display text-sm font-semibold text-text-primary">
              Escolha seu plano
            </p>
            {!hasStripeId && (
              <span className="ml-auto rounded-full border border-primary/40 bg-primary-subtle px-2.5 py-0.5 text-xs font-semibold text-primary">
                🎉 90% OFF no 1º mês
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            {/* ── Card Pro ──────────────────────────────────── */}
            {plan === "FREE" && (
              <div className="flex flex-col rounded-xl border border-border bg-surface overflow-hidden">
                <div className="px-5 pt-5 pb-4 border-b border-border">
                  <p className="font-display text-base font-bold text-text-primary">Pro</p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    {!hasStripeId ? (
                      <>
                        <span className="font-display text-2xl font-bold text-primary">R$ 4,90</span>
                        <span className="text-xs text-text-muted line-through">R$ 49</span>
                        <span className="text-xs text-text-muted">no 1º mês</span>
                      </>
                    ) : (
                      <>
                        <span className="font-display text-2xl font-bold text-text-primary">R$ 49</span>
                        <span className="text-xs text-text-muted">/mês</span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-secondary">Para estúdios em crescimento</p>
                </div>

                <ul className="flex flex-col gap-2.5 px-5 py-4 flex-1">
                  {FEATURES.map(({ icon: Icon, label, pro }) => (
                    pro !== false && (
                      <li key={label} className="flex items-center gap-2.5 text-xs text-text-secondary">
                        <Icon className="h-3.5 w-3.5 text-text-muted shrink-0" />
                        <span className="flex-1">{label}</span>
                        <FeatureValue value={pro} />
                      </li>
                    )
                  ))}
                </ul>

                <div className="px-5 pb-5">
                  <button
                    onClick={() => handleUpgrade("PRO")}
                    disabled={!!loading}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary-subtle py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-60"
                  >
                    {loading === "PRO"
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <><Zap className="h-4 w-4" /> Assinar Pro</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Card Estúdio ──────────────────────────────── */}
            <div className={`flex flex-col rounded-xl border overflow-hidden ${plan === "FREE" ? "border-primary/30" : "border-border"} bg-surface`}
              style={plan === "FREE" ? { boxShadow: "0 0 0 1px rgb(249 115 22 / 0.2), 0 0 20px rgb(249 115 22 / 0.06)" } : undefined}>

              {plan === "FREE" && (
                <div className="gradient-primary px-5 py-1.5 text-center text-xs font-bold text-white tracking-wide">
                  MAIS POPULAR
                </div>
              )}

              <div className="px-5 pt-5 pb-4 border-b border-border">
                <p className="font-display text-base font-bold text-text-primary">Estúdio</p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  {!hasStripeId ? (
                    <>
                      <span className="font-display text-2xl font-bold text-primary">R$ 9,90</span>
                      <span className="text-xs text-text-muted line-through">R$ 99</span>
                      <span className="text-xs text-text-muted">no 1º mês</span>
                    </>
                  ) : (
                    <>
                      <span className="font-display text-2xl font-bold text-text-primary">R$ 99</span>
                      <span className="text-xs text-text-muted">/mês</span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs text-text-secondary">Tudo ilimitado para grandes operações</p>
              </div>

              <ul className="flex flex-col gap-2.5 px-5 py-4 flex-1">
                {FEATURES.map(({ icon: Icon, label, studio }) => (
                  <li key={label} className="flex items-center gap-2.5 text-xs text-text-secondary">
                    <Icon className="h-3.5 w-3.5 text-text-muted shrink-0" />
                    <span className="flex-1">{label}</span>
                    <FeatureValue value={studio} />
                  </li>
                ))}
              </ul>

              <div className="px-5 pb-5">
                <button
                  onClick={() => handleUpgrade("STUDIO")}
                  disabled={!!loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg gradient-primary py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loading === "STUDIO"
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><Zap className="h-4 w-4" /> Assinar Estúdio</>}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
