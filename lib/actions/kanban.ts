"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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

  const card = await prisma.kanbanCard.findFirst({ where: { id: cardId, userId } });
  if (!card) return { error: "Card não encontrado." };

  await prisma.$transaction([
    prisma.kanbanCard.update({
      where: { id: cardId },
      data:  { column: toColumn },
    }),
    prisma.kanbanHistory.create({
      data: { cardId, fromColumn: card.column, toColumn },
    }),
  ]);

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
    where: { id: printLogId },
    include: { card: true },
  });
  if (!printLog) return { error: "Impressão não encontrada." };

  const now = new Date();
  const updates: Promise<unknown>[] = [
    prisma.printLog.update({
      where: { id: printLogId },
      data: { status: "COMPLETED", completedAt: now },
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

  // Deduzir filamento do estoque
  if (printLog.filamentId && filamentUsed && filamentUsed > 0) {
    const filament = await prisma.filament.findUnique({ where: { id: printLog.filamentId } });
    if (filament) {
      updates.push(
        prisma.filament.update({
          where: { id: printLog.filamentId },
          data: { currentGrams: Math.max(0, filament.currentGrams - filamentUsed) },
        })
      );
    }
  }

  await Promise.all(updates);
  revalidatePath("/producao");
  revalidatePath("/estoque");
}
