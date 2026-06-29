"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calculateQuote } from "@/lib/calculations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import crypto from "crypto";

const createQuoteSchema = z.object({
  pieceName:      z.string().min(1),
  description:    z.string().optional(),
  clientId:       z.string().optional(),
  printerId:      z.string().optional(),
  filamentId:     z.string().optional(),
  filamentGrams:  z.coerce.number().positive(),
  printHours:     z.coerce.number().positive(),
  profitMargin:   z.coerce.number().min(0),
  paintingHours:  z.coerce.number().min(0),
  expirationDays: z.coerce.number().min(1).max(30).default(5),
});

export async function createQuote(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parsed = createQuoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const { expirationDays, ...data } = parsed.data;
  const userId = session.user.id;

  // Buscar dados necessários para o cálculo
  const [printer, filament, settings] = await Promise.all([
    data.printerId  ? prisma.printer.findFirst({ where: { id: data.printerId, userId } })  : null,
    data.filamentId ? prisma.filament.findFirst({ where: { id: data.filamentId, userId } }) : null,
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  const breakdown = calculateQuote({
    filamentGrams:             data.filamentGrams,
    printHours:                data.printHours,
    profitMargin:              data.profitMargin,
    paintingHours:             data.paintingHours,
    filamentCostPerKg:         filament?.costPerKg        ?? 85,
    printerPowerWatts:         printer?.powerWatts        ?? 200,
    printerPurchasePrice:      printer?.purchasePrice     ?? 1200,
    printerEstimatedHours:     printer?.estimatedHours    ?? 3000,
    printerMonthlyMaintenance: printer?.monthlyMaintenance ?? 0,
    energyCostKwh:             settings?.energyCostKwh    ?? 0.75,
    paintingHourlyRate:        settings?.paintingHourlyRate ?? 0,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  const quote = await prisma.quote.create({
    data: {
      userId,
      pieceName:      data.pieceName,
      description:    data.description,
      clientId:       data.clientId   || null,
      printerId:      data.printerId  || null,
      filamentId:     data.filamentId || null,
      filamentGrams:  data.filamentGrams,
      printHours:     data.printHours,
      profitMargin:   data.profitMargin,
      paintingHours:  data.paintingHours,
      ...breakdown,
      expiresAt,
      publicToken: crypto.randomBytes(16).toString("hex"),
      status: "DRAFT",
      // Criar card no Kanban automaticamente
      kanbanCard: {
        create: {
          userId,
          column:   "WAITING",
          clientId: data.clientId || null,
        },
      },
    },
  });

  revalidatePath("/orcamentos");
  redirect(`/orcamentos/${quote.id}`);
}

export async function updateQuoteStatus(
  quoteId: string,
  status: "SENT" | "APPROVED" | "REJECTED" | "EXPIRED"
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.quote.update({
    where: { id: quoteId, userId: session.user.id },
    data: {
      status,
      approvedAt: status === "APPROVED" ? new Date() : undefined,
      rejectedAt: status === "REJECTED" ? new Date() : undefined,
    },
  });

  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${quoteId}`);
}

export async function deleteQuote(quoteId: string) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await prisma.quote.delete({
    where: { id: quoteId, userId: session.user.id },
  });

  revalidatePath("/orcamentos");
  redirect("/orcamentos");
}
