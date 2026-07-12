export type Plan = "FREE" | "PRO" | "STUDIO";

export interface PlanLimits {
  quotesPerMonth: number;   // -1 = ilimitado
  clients:        number;
  printers:       number;
  quoteVersions:  number;
  filaments:      number;
  whatsapp:       boolean;
  payment:        boolean;
  portfolio:      boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    quotesPerMonth: 20,
    clients:        5,
    printers:       1,
    quoteVersions:  1,
    filaments:      3,
    whatsapp:       false,
    payment:        false,
    portfolio:      false,
  },
  PRO: {
    quotesPerMonth: -1,
    clients:        20,
    printers:       3,
    quoteVersions:  2,
    filaments:      10,
    whatsapp:       true,
    payment:        true,
    portfolio:      false,
  },
  STUDIO: {
    quotesPerMonth: -1,
    clients:        -1,
    printers:       -1,
    quoteVersions:  -1,
    filaments:      -1,
    whatsapp:       true,
    payment:        true,
    portfolio:      true,
  },
};

export const PLAN_NAMES: Record<Plan, string> = {
  FREE:   "Grátis",
  PRO:    "Pro",
  STUDIO: "Estúdio",
};

export const PLAN_PRICES: Record<Plan, string> = {
  FREE:   "R$ 0",
  PRO:    "R$ 49/mês",
  STUDIO: "R$ 99/mês",
};

export type LimitKey = "quotesPerMonth" | "clients" | "printers" | "quoteVersions" | "filaments";

const INACTIVE_STATUSES = new Set(["PAST_DUE", "CANCELED", "UNPAID"]);

/** Retorna FREE se a assinatura não está ativa, senão retorna o plano real. */
export function effectivePlan(plan: Plan, subscriptionStatus: string | null | undefined): Plan {
  if (!subscriptionStatus || INACTIVE_STATUSES.has(subscriptionStatus)) return "FREE";
  return plan;
}

export const LIMIT_LABELS: Record<LimitKey, string> = {
  quotesPerMonth: "orçamentos por mês",
  clients:        "clientes cadastrados",
  printers:       "impressoras",
  quoteVersions:  "versões por orçamento",
  filaments:      "filamentos no estoque",
};
