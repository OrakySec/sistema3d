import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Calculator } from "./Calculator";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Novo Orçamento" };

export default async function NovoOrcamentoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [printers, filaments, clients, settings, user] = await Promise.all([
    prisma.printer.findMany({
      where:   { userId, active: true },
      orderBy: { name: "asc" },
      select:  { id: true, name: true, powerWatts: true, purchasePrice: true, estimatedHours: true, monthlyMaintenance: true, printerType: true, lcdLifetimeHours: true, lcdPrice: true },
    }),
    prisma.filament.findMany({
      where:   { userId, active: true },
      orderBy: { name: "asc" },
      select:  { id: true, name: true, costPerKg: true, colorHex: true, type: true, currentGrams: true, density: true },
    }),
    prisma.client.findMany({
      where:   { userId },
      orderBy: { name: "asc" },
      select:  { id: true, name: true },
    }),
    prisma.userSettings.findUnique({
      where:  { userId },
      select: { energyCostKwh: true, defaultProfitMargin: true, paintingHourlyRate: true, quoteExpirationDays: true },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, stripeCustomerId: true } }),
  ]);

  return (
    <Calculator
      printers={printers}
      filaments={filaments}
      clients={clients}
      plan={user?.plan ?? "FREE"}
      isFirstSubscriber={!user?.stripeCustomerId}
      settings={{
        energyCostKwh:       settings?.energyCostKwh       ?? 0.75,
        defaultProfitMargin: settings?.defaultProfitMargin ?? 30,
        paintingHourlyRate:  settings?.paintingHourlyRate  ?? 0,
        quoteExpirationDays: settings?.quoteExpirationDays ?? 5,
      }}
    />
  );
}
