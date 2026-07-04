import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Calculator } from "../../novo/Calculator";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Editar Orçamento" };

export default async function EditarOrcamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;
  const { id } = await params;

  const [quote, printers, filaments, clients, settings, user] = await Promise.all([
    prisma.quote.findFirst({
      where:   { id, userId },
      include: { versions: { orderBy: { order: "asc" } } },
    }),
    prisma.printer.findMany({
      where:   { userId, active: true },
      orderBy: { name: "asc" },
      select:  { id: true, name: true, powerWatts: true, purchasePrice: true, estimatedHours: true, monthlyMaintenance: true },
    }),
    prisma.filament.findMany({
      where:   { userId, active: true },
      orderBy: { name: "asc" },
      select:  { id: true, name: true, costPerKg: true, colorHex: true, type: true, currentGrams: true },
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

  if (!quote) notFound();

  const expirationDays = quote.expiresAt
    ? Math.max(1, Math.round((new Date(quote.expiresAt).getTime() - Date.now()) / 86_400_000))
    : (settings?.quoteExpirationDays ?? 5);

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
      quoteId={quote.id}
      initialData={{
        pieceName:     quote.pieceName,
        description:   quote.description ?? "",
        clientId:      quote.clientId    ?? "",
        printerId:     quote.printerId   ?? "",
        filamentId:    quote.filamentId  ?? "",
        filamentGrams: quote.filamentGrams,
        printHours:    quote.printHours,
        profitMargin:  quote.profitMargin,
        paintingHours: quote.paintingHours,
        expirationDays,
        versions: quote.versions.map((v) => {
          const d = v.details as Record<string, number> | null;
          return {
            label:         v.label,
            description:   v.description ?? "",
            paintingHours: d?.paintingHours ?? 0,
            profitMargin:  d?.profitMargin  ?? 0,
          };
        }),
      }}
    />
  );
}
