import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { MarketplaceCalculator } from "./MarketplaceCalculator";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Orçamento Marketplace" };

export default async function MarketplacePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [printers, filaments, settings] = await Promise.all([
    prisma.printer.findMany({
      where: { userId, active: true }, orderBy: { name: "asc" },
      select: { id: true, name: true, powerWatts: true, purchasePrice: true, estimatedHours: true, monthlyMaintenance: true },
    }),
    prisma.filament.findMany({
      where: { userId, active: true }, orderBy: { name: "asc" },
      select: { id: true, name: true, costPerKg: true, colorHex: true, type: true, currentGrams: true },
    }),
    prisma.userSettings.findUnique({
      where: { userId },
      select: { energyCostKwh: true, defaultProfitMargin: true, paintingHourlyRate: true },
    }),
  ]);

  return (
    <MarketplaceCalculator
      printers={printers}
      filaments={filaments}
      settings={{
        energyCostKwh:       settings?.energyCostKwh       ?? 0.75,
        defaultProfitMargin: settings?.defaultProfitMargin ?? 30,
        paintingHourlyRate:  settings?.paintingHourlyRate  ?? 0,
      }}
    />
  );
}
