import { prisma } from "@/lib/prisma";
import { PLAN_LIMITS, type LimitKey, type Plan } from "@/lib/plans";

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
    select: { plan: true },
  });

  const plan  = user?.plan ?? "FREE";
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
    select: { plan: true },
  });
  const plan = user?.plan ?? "FREE";
  return PLAN_LIMITS[plan][feature];
}
