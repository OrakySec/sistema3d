import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FinanceiroClient } from "./FinanceiroClient";
import { getUserCategories } from "@/lib/actions/expense-categories";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Financeiro" };

export default async function FinanceiroPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // Busca dados do ano atual + 1 ano anterior para cobrir todos os intervalos do seletor
  const startOfPrevYear = new Date(new Date().getFullYear() - 1, 0, 1);

  const [revenues, expenses, categories] = await Promise.all([
    prisma.revenue.findMany({
      where: { userId, date: { gte: startOfPrevYear } },
      orderBy: { date: "desc" },
    }),
    prisma.expense.findMany({
      where: { userId, date: { gte: startOfPrevYear } },
      orderBy: { date: "desc" },
    }),
    getUserCategories(userId),
  ]);

  return (
    <FinanceiroClient
      initialRevenues={revenues.map((r) => ({ ...r, date: r.date.toISOString(), notes: r.notes ?? undefined }))}
      initialExpenses={expenses.map((e) => ({ ...e, date: e.date.toISOString(), notes: e.notes ?? undefined, customCategory: e.customCategory ?? undefined }))}
      categories={categories}
    />
  );
}
