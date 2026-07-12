"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { calculateQuote } from "@/lib/calculations";
import { checkLimit, checkFeature } from "@/lib/limits";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import crypto from "crypto";

const versionSchema = z.object({
  label:        z.string().min(1),
  description:  z.string().optional(),
  paintingHours: z.number().min(0),
  profitMargin:  z.number().min(0),
});

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
  versions:       z.string().optional(), // JSON serializado
  status:         z.enum(["DRAFT", "SENT"]).default("SENT"),
});

export async function createQuote(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parsed = createQuoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const { expirationDays, versions: versionsRaw, status, ...data } = parsed.data;
  const userId = session.user.id;

  // Verificar limite de orçamentos do plano
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthCount = await prisma.quote.count({ where: { userId, createdAt: { gte: start } } });
  const limitCheck = await checkLimit(userId, "quotesPerMonth", monthCount);
  if (!limitCheck.allowed) return { error: "LIMIT_EXCEEDED", key: "quotesPerMonth", plan: limitCheck.plan, limit: limitCheck.limit };

  // Parsear e limitar versões adicionais conforme plano
  let parsedVersions: z.infer<typeof versionSchema>[] = [];
  if (versionsRaw) {
    try { parsedVersions = z.array(versionSchema).parse(JSON.parse(versionsRaw)); } catch {}
  }
  const versionLimitCheck = await checkLimit(userId, "quoteVersions", parsedVersions.length);
  if (!versionLimitCheck.allowed) {
    parsedVersions = parsedVersions.slice(0, Math.max(0, versionLimitCheck.limit - 1));
  }

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

  // Calcular breakdown de cada versão adicional
  const calcParams = {
    filamentGrams:             data.filamentGrams,
    printHours:                data.printHours,
    filamentCostPerKg:         filament?.costPerKg         ?? 85,
    printerPowerWatts:         printer?.powerWatts         ?? 200,
    printerPurchasePrice:      printer?.purchasePrice      ?? 1200,
    printerEstimatedHours:     printer?.estimatedHours     ?? 3000,
    printerMonthlyMaintenance: printer?.monthlyMaintenance ?? 0,
    energyCostKwh:             settings?.energyCostKwh     ?? 0.75,
    paintingHourlyRate:        settings?.paintingHourlyRate ?? 0,
  };

  const versionData = parsedVersions.map((v, i) => {
    const vb = calculateQuote({ ...calcParams, profitMargin: v.profitMargin, paintingHours: v.paintingHours });
    return {
      label:       v.label,
      description: v.description,
      totalPrice:  vb.totalPrice,
      details:     JSON.parse(JSON.stringify({ ...vb, paintingHours: v.paintingHours, profitMargin: v.profitMargin })),
      order:       i,
    };
  });

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
      status,
      versions: versionData.length > 0 ? { create: versionData } : undefined,
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

export async function updateQuote(quoteId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const parsed = createQuoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const { expirationDays, versions: versionsRaw, ...data } = parsed.data;
  const userId = session.user.id;

  let parsedVersions: z.infer<typeof versionSchema>[] = [];
  if (versionsRaw) {
    try { parsedVersions = z.array(versionSchema).parse(JSON.parse(versionsRaw)); } catch {}
  }

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
    filamentCostPerKg:         filament?.costPerKg         ?? 85,
    printerPowerWatts:         printer?.powerWatts         ?? 200,
    printerPurchasePrice:      printer?.purchasePrice      ?? 1200,
    printerEstimatedHours:     printer?.estimatedHours     ?? 3000,
    printerMonthlyMaintenance: printer?.monthlyMaintenance ?? 0,
    energyCostKwh:             settings?.energyCostKwh     ?? 0.75,
    paintingHourlyRate:        settings?.paintingHourlyRate ?? 0,
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  const calcParams = {
    filamentGrams:             data.filamentGrams,
    printHours:                data.printHours,
    filamentCostPerKg:         filament?.costPerKg         ?? 85,
    printerPowerWatts:         printer?.powerWatts         ?? 200,
    printerPurchasePrice:      printer?.purchasePrice      ?? 1200,
    printerEstimatedHours:     printer?.estimatedHours     ?? 3000,
    printerMonthlyMaintenance: printer?.monthlyMaintenance ?? 0,
    energyCostKwh:             settings?.energyCostKwh     ?? 0.75,
    paintingHourlyRate:        settings?.paintingHourlyRate ?? 0,
  };

  // Apaga versões antigas e recria
  await prisma.quoteVersion.deleteMany({ where: { quoteId, quote: { userId } } });

  await prisma.quote.update({
    where: { id: quoteId, userId },
    data: {
      pieceName:     data.pieceName,
      description:   data.description,
      clientId:      data.clientId   || null,
      printerId:     data.printerId  || null,
      filamentId:    data.filamentId || null,
      filamentGrams: data.filamentGrams,
      printHours:    data.printHours,
      profitMargin:  data.profitMargin,
      paintingHours: data.paintingHours,
      ...breakdown,
      expiresAt,
      versions: parsedVersions.length > 0 ? {
        create: parsedVersions.map((v, i) => {
          const vb = calculateQuote({ ...calcParams, profitMargin: v.profitMargin, paintingHours: v.paintingHours });
          return { label: v.label, description: v.description, totalPrice: vb.totalPrice, details: JSON.parse(JSON.stringify(vb)), order: i };
        }),
      } : undefined,
    },
  });

  revalidatePath("/orcamentos");
  revalidatePath(`/orcamentos/${quoteId}`);
  redirect(`/orcamentos/${quoteId}`);
}

export async function updateQuoteStatus(
  quoteId: string,
  status: "SENT" | "APPROVED" | "REJECTED" | "EXPIRED"
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const quote = await prisma.quote.findUnique({
    where: { id: quoteId, userId },
  });
  if (!quote) return;

  // Evitar receita duplicada se já estava aprovado
  const wasApproved = quote.status === "APPROVED";

  await prisma.quote.update({
    where: { id: quoteId, userId },
    data: {
      status,
      approvedAt: status === "APPROVED" ? new Date() : undefined,
      rejectedAt: status === "REJECTED" ? new Date() : undefined,
    },
  });

  if (status === "APPROVED" && !wasApproved) {
    const productionCost = quote.filamentCost + quote.energyCost + quote.printerCost;
    await prisma.revenue.create({
      data: {
        userId,
        description:    quote.pieceName,
        grossAmount:    quote.totalPrice,
        productionCost,
        netProfit:      quote.profitAmount + quote.paintingCost,
        date:           new Date(),
      },
    });
  }

  revalidatePath("/financeiro");
  revalidatePath("/dashboard");
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
