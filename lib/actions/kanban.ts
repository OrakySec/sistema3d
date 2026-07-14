"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sendWhatsAppMessage, normalizePhone, interpolate, isSilentHour } from "@/lib/whatsapp";
import { checkFeature } from "@/lib/limits";

type KanbanColumn = "WAITING" | "APPROVED" | "PRINTING" | "POST_PROD" | "READY" | "DELIVERED" | "CANCELLED";
type PrintStatus  = "QUEUED" | "STARTED" | "PAUSED" | "RESUMED" | "CANCELLED" | "COMPLETED";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function deleteKanbanCard(cardId: string) {
  const userId = await getUserId();
  const card = await prisma.kanbanCard.findFirst({ where: { id: cardId, userId } });
  if (!card) return { error: "Card não encontrado." };
  await prisma.kanbanCard.delete({ where: { id: cardId } });
  revalidatePath("/producao");
  return { ok: true };
}

const updateCardSchema = z.object({
  dueDate: z.string().optional(),
  notes:   z.string().optional(),
  tags:    z.string().optional(), // JSON array string
});

export async function updateKanbanCard(cardId: string, data: z.infer<typeof updateCardSchema>) {
  const userId = await getUserId();
  const card = await prisma.kanbanCard.findFirst({ where: { id: cardId, userId } });
  if (!card) return { error: "Card não encontrado." };

  await prisma.kanbanCard.update({
    where: { id: cardId },
    data: {
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      notes:   data.notes ?? null,
      tags:    data.tags ? JSON.parse(data.tags) : [],
    },
  });
  revalidatePath("/producao");
  return { ok: true };
}

export async function startPrint(cardId: string) {
  const userId = await getUserId();

  const card = await prisma.kanbanCard.findFirst({
    where:   { id: cardId, userId },
    include: { quote: true },
  });
  if (!card) return { error: "Card não encontrado." };

  const printLog = await prisma.printLog.create({
    data: {
      userId,
      cardId,
      printerId:     card.quote?.printerId  ?? null,
      filamentId:    card.quote?.filamentId ?? null,
      estimatedHours: card.quote?.printHours ?? 1,
      status:        "STARTED",
      startedAt:     new Date(),
    },
  });

  await prisma.$transaction([
    prisma.printStatusHistory.create({ data: { printLogId: printLog.id, status: "STARTED" } }),
    ...(card.column !== "PRINTING"
      ? [prisma.kanbanCard.update({ where: { id: cardId }, data: { column: "PRINTING" } })]
      : []),
  ]);

  revalidatePath("/producao");
  return { ok: true, printLogId: printLog.id };
}

export async function moveKanbanCard(cardId: string, toColumn: KanbanColumn) {
  const userId = await getUserId();

  const card = await prisma.kanbanCard.findFirst({
    where:   { id: cardId, userId },
    include: { quote: { include: { client: true } } },
  });
  if (!card) return { error: "Card não encontrado." };

  await prisma.kanbanCard.update({
    where: { id: cardId },
    data:  { column: toColumn },
  });

  try {
    await prisma.kanbanHistory.create({
      data: { cardId, fromColumn: card.column, toColumn },
    });
  } catch (e) {
    console.error("[kanban] falha ao criar histórico:", e);
  }

  // Dispara automações WhatsApp em colunas relevantes
  const WA_COLUMNS: KanbanColumn[] = ["PRINTING", "POST_PROD", "READY", "DELIVERED"];
  if (WA_COLUMNS.includes(toColumn)) {
    const [settings, user, hasWhatsapp] = await Promise.all([
      prisma.userSettings.findUnique({ where: { userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { evolutionInstance: true } }),
      checkFeature(userId, "whatsapp"),
    ]);

    const clientPhone = card.quote?.client?.whatsapp ?? null;
    const clientName  = card.quote?.client?.name ?? "cliente";
    const pedidoRef   = card.quote?.pieceName ?? "seu pedido";

    if (
      hasWhatsapp &&
      settings?.whatsappAutoEnabled &&
      user?.evolutionInstance &&
      clientPhone &&
      normalizePhone(clientPhone)
    ) {
      const silent = settings.silentHoursEnabled
        ? isSilentHour(settings.silentHoursStart, settings.silentHoursEnd)
        : false;

      if (!silent) {
        const vars = { nome: clientName.split(" ")[0], pedido: pedidoRef };
        const instance = user.evolutionInstance!;

        // Mensagem imediata por coluna
        const immediateMsg: Record<string, string | null | undefined> = {
          PRINTING:  settings.productionMessage,
          POST_PROD: settings.postProdMessage,
          READY:     settings.readyMessage,
        };

        const msg = immediateMsg[toColumn];
        if (msg) {
          await sendWhatsAppMessage({
            instanceName: instance,
            phone:        clientPhone,
            message:      interpolate(msg, vars),
          });
        }

        // Ao entregar: follow-up e NPS agendados
        if (toColumn === "DELIVERED") {
          if (settings.followupEnabled && settings.followup7DaysEnabled && settings.followup7DaysMessage) {
            setTimeout(() => {
              sendWhatsAppMessage({ instanceName: instance, phone: clientPhone, message: interpolate(settings.followup7DaysMessage!, vars) });
            }, 7 * 24 * 60 * 60 * 1000);
          }
          if (settings.followupEnabled && settings.followup30DaysEnabled && settings.followup30DaysMessage) {
            setTimeout(() => {
              sendWhatsAppMessage({ instanceName: instance, phone: clientPhone, message: interpolate(settings.followup30DaysMessage!, vars) });
            }, 30 * 24 * 60 * 60 * 1000);
          }
          if (settings.npsEnabled && settings.npsMessage) {
            setTimeout(() => {
              sendWhatsAppMessage({ instanceName: instance, phone: clientPhone, message: interpolate(settings.npsMessage!, vars) });
            }, (settings.npsDaysAfterDelivery ?? 7) * 24 * 60 * 60 * 1000);
          }
        }
      }
    }
  }

  revalidatePath("/producao");
}

const pauseSchema = z.object({
  printLogId:  z.string(),
  pauseReason: z.enum(["FILAMENT_EMPTY", "ADHESION_FAILURE", "POWER_OUTAGE", "MANUAL_PAUSE", "Z_OFFSET_ISSUE", "NOZZLE_CLOG", "OTHER"]),
  note:        z.string().optional(),
});

export async function pausePrint(data: z.infer<typeof pauseSchema>) {
  await getUserId();
  const parsed = pauseSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  await prisma.$transaction([
    prisma.printLog.update({
      where: { id: parsed.data.printLogId },
      data:  { status: "PAUSED", pauseReason: parsed.data.pauseReason, pausedAt: new Date() },
    }),
    prisma.printStatusHistory.create({
      data: {
        printLogId: parsed.data.printLogId,
        status:     "PAUSED",
        reason:     parsed.data.pauseReason,
        note:       parsed.data.note,
      },
    }),
  ]);

  revalidatePath("/producao");
}

export async function resumePrint(printLogId: string) {
  await getUserId();

  await prisma.$transaction([
    prisma.printLog.update({
      where: { id: printLogId },
      data:  { status: "RESUMED" },
    }),
    prisma.printStatusHistory.create({
      data: { printLogId, status: "RESUMED" },
    }),
  ]);

  revalidatePath("/producao");
}

const cancelSchema = z.object({
  printLogId:    z.string(),
  cancelReason:  z.enum(["PRINT_FAILURE", "CLIENT_CANCELLED", "MODEL_ERROR", "FILAMENT_EMPTY", "EQUIPMENT_ISSUE", "OTHER"]),
  note:          z.string().optional(),
  notifyClient:  z.boolean().default(false),
});

export async function cancelPrint(data: z.infer<typeof cancelSchema>) {
  await getUserId();
  const parsed = cancelSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  const printLog = await prisma.printLog.findUnique({
    where: { id: parsed.data.printLogId },
    include: { card: true },
  });
  if (!printLog) return { error: "Impressão não encontrada." };

  await prisma.$transaction([
    prisma.printLog.update({
      where: { id: parsed.data.printLogId },
      data: {
        status:        "CANCELLED",
        cancelReason:  parsed.data.cancelReason,
        cancelNote:    parsed.data.note,
        clientNotified: parsed.data.notifyClient,
      },
    }),
    prisma.printStatusHistory.create({
      data: {
        printLogId: parsed.data.printLogId,
        status:     "CANCELLED",
        reason:     parsed.data.cancelReason,
        note:       parsed.data.note,
      },
    }),
    // Mover card para coluna Cancelado
    ...(printLog.cardId
      ? [prisma.kanbanCard.update({ where: { id: printLog.cardId }, data: { column: "CANCELLED" } })]
      : []),
  ]);

  revalidatePath("/producao");
}

export async function completePrint(printLogId: string, filamentUsed?: number) {
  await getUserId();

  const printLog = await prisma.printLog.findUnique({
    where:   { id: printLogId },
    include: { card: { include: { quote: true } } },
  });
  if (!printLog) return { error: "Impressão não encontrada." };

  const now = new Date();

  const hoursUsed = printLog.estimatedHours ?? 0;

  const updates: Promise<unknown>[] = [
    prisma.printLog.update({
      where: { id: printLogId },
      data:  { status: "COMPLETED", completedAt: now },
    }),
    prisma.printStatusHistory.create({
      data: { printLogId, status: "COMPLETED" },
    }),
  ];

  // Mover para Pós-Produção
  if (printLog.cardId) {
    updates.push(
      prisma.kanbanCard.update({ where: { id: printLog.cardId }, data: { column: "POST_PROD" } })
    );
  }

  // Atualizar horas de uso da impressora
  if (printLog.printerId && hoursUsed > 0) {
    updates.push(
      prisma.printer.update({
        where: { id: printLog.printerId },
        data:  { totalHours: { increment: hoursUsed } },
      })
    );
  }

  // Deduzir filamento do estoque (usa filamentUsed passado, ou filamentGrams do orçamento)
  const gramsToDeduct = filamentUsed ?? printLog.card?.quote?.filamentGrams ?? 0;
  if (printLog.filamentId && gramsToDeduct > 0) {
    const filament = await prisma.filament.findUnique({ where: { id: printLog.filamentId } });
    if (filament) {
      updates.push(
        prisma.filament.update({
          where: { id: printLog.filamentId },
          data:  { currentGrams: Math.max(0, filament.currentGrams - gramsToDeduct) },
        })
      );
    }
  }

  await Promise.all(updates);
  revalidatePath("/producao");
  revalidatePath("/estoque");
  revalidatePath("/impressoras");
}
