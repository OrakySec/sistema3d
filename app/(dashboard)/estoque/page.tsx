import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EstoqueClient } from "./EstoqueClient";
import { effectivePlan } from "@/lib/plans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Estoque" };

export default async function EstoquePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [filaments, user] = await Promise.all([
    prisma.filament.findMany({ where: { userId, active: true }, orderBy: { createdAt: "desc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, subscriptionStatus: true, stripeCustomerId: true } }),
  ]);

  return (
    <EstoqueClient
      initialFilaments={filaments}
      plan={effectivePlan(user?.plan ?? "FREE", user?.subscriptionStatus ?? null)}
      isFirstSubscriber={!user?.stripeCustomerId}
    />
  );
}
