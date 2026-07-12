import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type LimitKey, type Plan } from "@/lib/plans";

// Statuses where the subscription is not active — treat as FREE
const INACTIVE_STATUSES = new Set(["PAST_DUE", "CANCELED", "UNPAID"]);

function effectivePlan(plan: Plan, subscriptionStatus: string | null): Plan {
  if (!subscriptionStatus || INACTIVE_STATUSES.has(subscriptionStatus)) return "FREE";
  return plan;
}

interface LimitResult {
  allowed: boolean;
  plan: Plan;
  limit: number;
  current: number;
  key: LimitKey;
}

export async function checkLimit(
  userId: string,
  key: LimitKey,
  current: number
): Promise<LimitResult> {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { plan: true, subscriptionStatus: true },
  });

  const plan  = effectivePlan(user?.plan ?? "FREE", user?.subscriptionStatus ?? null);
  const limit = PLAN_LIMITS[plan][key] as number;

  return {
    allowed: limit === -1 || current < limit,
    plan,
    limit,
    current,
    key,
  };
}

export async function checkFeature(
  userId: string,
  feature: "whatsapp" | "payment" | "portfolio"
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { plan: true, subscriptionStatus: true },
  });
  const plan = effectivePlan(user?.plan ?? "FREE", user?.subscriptionStatus ?? null);
  return PLAN_LIMITS[plan][feature];
}
