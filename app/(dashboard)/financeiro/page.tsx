import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FinanceiroClient } from "./FinanceiroClient";
import { getUserCategories } from "@/lib/actions/expense-categories";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Financeiro" };

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function FinanceiroPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [revenues, expenses, categories] = await Promise.all([
    prisma.revenue.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    prisma.expense.findMany({ where: { userId }, orderBy: { date: "desc" } }),
    getUserCategories(userId),
  ]);

  // ── Agregação mensal (últimos 6 meses) ──────────────────────
  const buckets: { month: string; receita: number; despesas: number; lucro: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    buckets.push({ month: MONTH_LABELS[d.getMonth()], receita: 0, despesas: 0, lucro: 0 });
  }

  function bucketIndex(date: Date) {
    const now = new Date();
    const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    const idx = 5 - diffMonths;
    return idx >= 0 && idx <= 5 ? idx : null;
  }

  revenues.forEach((r) => {
    const idx = bucketIndex(new Date(r.date));
    if (idx !== null) {
      buckets[idx].receita += r.grossAmount;
      buckets[idx].lucro   += r.netProfit;
    }
  });
  expenses.forEach((e) => {
    const idx = bucketIndex(new Date(e.date));
    if (idx !== null) buckets[idx].despesas += e.amount;
  });

  const profitData = buckets.map((b) => ({
    month:  b.month,
    lucro:  b.lucro,
    margem: b.receita > 0 ? Math.round((b.lucro / b.receita) * 100) : 0,
  }));

  return (
    <FinanceiroClient
      initialRevenues={revenues.map((r) => ({ ...r, date: r.date.toISOString(), notes: r.notes ?? undefined }))}
      initialExpenses={expenses.map((e) => ({ ...e, date: e.date.toISOString(), notes: e.notes ?? undefined, customCategory: e.customCategory ?? undefined }))}
      monthlyData={buckets}
      profitData={profitData}
      categories={categories}
    />
  );
}
