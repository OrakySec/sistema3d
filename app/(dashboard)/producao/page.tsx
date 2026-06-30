import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { LayoutGrid, Info } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Produção" };

export default async function ProducaoPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const cards = await prisma.kanbanCard.findMany({
    where: { userId: session.user.id },
    include: {
      quote:  { select: { pieceName: true, totalPrice: true } },
      client: { select: { name: true } },
      printLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { printer: { select: { name: true } } },
      },
    },
    orderBy: { order: "asc" },
  });

  const initialCards = cards.map((c) => {
    const log = c.printLogs[0];
    return {
      id:          c.id,
      column:      c.column,
      pieceName:   c.quote?.pieceName ?? "Peça sem nome",
      clientName:  c.client?.name ?? "Sem cliente",
      printerName: log?.printer?.name,
      totalPrice:  c.quote?.totalPrice ?? 0,
      dueDate:     c.dueDate ? new Date(c.dueDate).toLocaleDateString("pt-BR") : undefined,
      tags:        c.tags,
      notes:       c.notes ?? undefined,
      printLog: log ? {
        id:        log.id,
        status:    log.status,
        reason:    log.pauseReason ?? log.cancelReason ?? undefined,
        note:      undefined,
        pausedAt:  log.pausedAt
          ? new Date(log.pausedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
          : undefined,
      } : undefined,
    };
  });

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <LayoutGrid className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl font-bold text-text-primary">
              Produção
            </h1>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Arraste os cards entre as colunas para mover pedidos no fluxo.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-info/20 bg-info-subtle px-3 py-2">
          <Info className="h-3.5 w-3.5 shrink-0 text-info" />
          <p className="text-xs text-text-secondary">
            Cards na coluna <span className="font-semibold text-text-primary">Em Produção</span> têm controles de impressão (iniciar, pausar, retomar, cancelar).
          </p>
        </div>
      </div>

      <KanbanBoard initialCards={initialCards} />
    </>
  );
}
