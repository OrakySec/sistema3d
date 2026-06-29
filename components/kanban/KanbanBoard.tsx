"use client";

import { useState, useCallback, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Play,
  Pause,
  RotateCcw,
  XCircle,
  CheckCircle2,
  Clock,
  GripVertical,
  User,
  Printer,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { PrintControlDialog } from "./PrintControlDialog";
import { cn } from "@/lib/utils";
import { moveKanbanCard, startPrint, pausePrint, resumePrint, cancelPrint, completePrint } from "@/lib/actions/kanban";

// ─── Tipos ───────────────────────────────────────────────────

type KanbanCol =
  | "WAITING"
  | "APPROVED"
  | "PRINTING"
  | "POST_PROD"
  | "READY"
  | "DELIVERED"
  | "CANCELLED";

type PrintStatus = "QUEUED" | "STARTED" | "PAUSED" | "RESUMED" | "COMPLETED" | "CANCELLED";

interface PrintLog {
  id: string;
  status: PrintStatus;
  reason?: string;
  note?: string;
  pausedAt?: string;
}

export interface Card {
  id: string;
  column: KanbanCol;
  pieceName: string;
  clientName: string;
  printerName?: string;
  totalPrice: number;
  dueDate?: string;
  printLog?: PrintLog;
  tags?: string[];
}

// ─── Configuração das colunas ────────────────────────────────

interface ColConfig {
  label: string;
  emoji: string;
  colorClass: string;
  dotClass: string;
}

const COLUMNS: Record<KanbanCol, ColConfig> = {
  WAITING:   { label: "Aguardando",    emoji: "⏳", colorClass: "border-border",         dotClass: "bg-text-muted" },
  APPROVED:  { label: "Aprovado",      emoji: "✅", colorClass: "border-success/30",     dotClass: "bg-success" },
  PRINTING:  { label: "Em Produção",   emoji: "🖨️", colorClass: "border-primary/30",     dotClass: "bg-primary" },
  POST_PROD: { label: "Pós-Produção",  emoji: "🎨", colorClass: "border-info/30",        dotClass: "bg-info" },
  READY:     { label: "Pronto",        emoji: "📦", colorClass: "border-warning/30",     dotClass: "bg-warning" },
  DELIVERED: { label: "Entregue",      emoji: "🏁", colorClass: "border-success/20",     dotClass: "bg-success/60" },
  CANCELLED: { label: "Cancelado",     emoji: "❌", colorClass: "border-error/20",       dotClass: "bg-error/60" },
};

const COL_ORDER: KanbanCol[] = [
  "WAITING", "APPROVED", "PRINTING", "POST_PROD", "READY", "DELIVERED", "CANCELLED",
];

// ─── Card arrastável ─────────────────────────────────────────

function SortableCard({
  card,
  onPrintAction,
  isDragging,
}: {
  card: Card;
  onPrintAction: (cardId: string, action: "start" | "pause" | "resume" | "cancel" | "complete") => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isPrinting = card.column === "PRINTING";
  const printStatus = card.printLog?.status;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-border bg-surface p-4 shadow-sm transition-all duration-150",
        isSortableDragging || isDragging ? "opacity-40 scale-95" : "hover:border-primary/40 hover:shadow-card",
        printStatus === "PAUSED" && "border-warning/40 bg-warning-subtle/10"
      )}
    >
      {/* Drag handle + título */}
      <div className="mb-2.5 flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab text-text-muted hover:text-text-secondary active:cursor-grabbing touch-none"
          aria-label="Arrastar card"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary leading-snug truncate">
            {card.pieceName}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
            <User className="h-3 w-3" />
            <span className="truncate">{card.clientName}</span>
          </div>
        </div>
        <button className="shrink-0 text-text-muted hover:text-text-primary transition-colors">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Impressora */}
      {card.printerName && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
          <Printer className="h-3 w-3" />
          <span>{card.printerName}</span>
        </div>
      )}

      {/* Status de pausa */}
      {printStatus === "PAUSED" && card.printLog?.reason && (
        <div className="mb-3 rounded-lg border border-warning/30 bg-warning-subtle px-3 py-2">
          <p className="text-xs font-medium text-warning">⏸ Pausado</p>
          {card.printLog.note && (
            <p className="mt-0.5 text-xs text-text-secondary">{card.printLog.note}</p>
          )}
          {card.printLog.pausedAt && (
            <p className="mt-0.5 text-xs text-text-muted">Desde {card.printLog.pausedAt}</p>
          )}
        </div>
      )}

      {/* Footer: preço + prazo */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {card.tags?.map((t) => (
            <span key={t} className="rounded-full border border-border px-2 py-0.5 text-xs text-text-muted">
              {t}
            </span>
          ))}
          {card.dueDate && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Clock className="h-3 w-3" />
              {card.dueDate}
            </span>
          )}
        </div>
        <span className="shrink-0 text-xs font-semibold text-text-primary">
          {card.totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </div>

      {/* Controles de impressão (apenas na coluna PRINTING) */}
      {isPrinting && (
        <div className="mt-3 flex gap-1.5 border-t border-border pt-3">
          {!printStatus || printStatus === "QUEUED" ? (
            <PrintBtn
              icon={Play}
              label="Iniciar"
              color="success"
              onClick={() => onPrintAction(card.id, "start")}
            />
          ) : printStatus === "STARTED" || printStatus === "RESUMED" ? (
            <>
              <PrintBtn
                icon={Pause}
                label="Pausar"
                color="warning"
                onClick={() => onPrintAction(card.id, "pause")}
              />
              <PrintBtn
                icon={CheckCircle2}
                label="Concluir"
                color="success"
                onClick={() => onPrintAction(card.id, "complete")}
              />
              <PrintBtn
                icon={XCircle}
                label="Cancelar"
                color="error"
                onClick={() => onPrintAction(card.id, "cancel")}
              />
            </>
          ) : printStatus === "PAUSED" ? (
            <>
              <PrintBtn
                icon={RotateCcw}
                label="Retomar"
                color="primary"
                onClick={() => onPrintAction(card.id, "resume")}
              />
              <PrintBtn
                icon={XCircle}
                label="Cancelar"
                color="error"
                onClick={() => onPrintAction(card.id, "cancel")}
              />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function PrintBtn({
  icon: Icon,
  label,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  color: "success" | "warning" | "error" | "primary";
  onClick: () => void;
}) {
  const colorMap = {
    success: "border-success/30 text-success hover:bg-success-subtle",
    warning: "border-warning/30 text-warning hover:bg-warning-subtle",
    error:   "border-error/30 text-error hover:bg-error-subtle",
    primary: "border-primary/30 text-primary hover:bg-primary-subtle",
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`flex flex-1 items-center justify-center gap-1 rounded-lg border py-1.5 text-xs font-medium transition-colors ${colorMap[color]}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

// ─── Coluna ──────────────────────────────────────────────────

function Column({
  colId,
  cards,
  onPrintAction,
}: {
  colId: KanbanCol;
  cards: Card[];
  onPrintAction: (cardId: string, action: "start" | "pause" | "resume" | "cancel" | "complete") => void;
}) {
  const config = COLUMNS[colId];

  return (
    <div className={cn("flex w-72 shrink-0 flex-col rounded-xl border bg-surface/50", config.colorClass)}>
      {/* Header da coluna */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none">{config.emoji}</span>
          <span className="text-sm font-semibold text-text-primary">{config.label}</span>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-surface-hover px-1.5 text-xs font-medium text-text-muted">
            {cards.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2.5 overflow-y-auto px-3 pb-3" style={{ maxHeight: "calc(100vh - 220px)" }}>
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} onPrintAction={onPrintAction} />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border">
            <p className="text-xs text-text-muted">Arraste um card aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Board principal ─────────────────────────────────────────

type DialogState =
  | { open: false }
  | { open: true; mode: "pause" | "cancel"; cardId: string; printLogId: string; cardTitle: string };

export function KanbanBoard({ initialCards }: { initialCards: Card[] }) {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ open: false });
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const cardsByCol = useCallback(
    (col: KanbanCol) => cards.filter((c) => c.column === col),
    [cards]
  );

  // ── Drag handlers ──────────────────────────────────────────

  function onDragStart({ active }: DragStartEvent) {
    setActiveCard(cards.find((c) => c.id === active.id) ?? null);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    let newColumn: KanbanCol | null = null;

    setCards((prev) => {
      const activeCard = prev.find((c) => c.id === activeId);
      if (!activeCard) return prev;

      if (COL_ORDER.includes(overId as KanbanCol)) {
        newColumn = overId as KanbanCol;
        return prev.map((c) => (c.id === activeId ? { ...c, column: newColumn! } : c));
      }

      const overCard = prev.find((c) => c.id === overId);
      if (!overCard) return prev;

      if (activeCard.column === overCard.column) {
        const colCards = prev.filter((c) => c.column === activeCard.column);
        const others   = prev.filter((c) => c.column !== activeCard.column);
        const oldIdx   = colCards.findIndex((c) => c.id === activeId);
        const newIdx   = colCards.findIndex((c) => c.id === overId);
        return [...others, ...arrayMove(colCards, oldIdx, newIdx)];
      }

      newColumn = overCard.column;
      return prev.map((c) => (c.id === activeId ? { ...c, column: newColumn! } : c));
    });

    if (newColumn) {
      startTransition(async () => { await moveKanbanCard(activeId, newColumn!); });
    }
  }

  // ── Ações de impressão ─────────────────────────────────────

  function handlePrintAction(
    cardId: string,
    action: "start" | "pause" | "resume" | "cancel" | "complete"
  ) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    if (action === "pause" || action === "cancel") {
      if (!card.printLog?.id) return;
      setDialog({ open: true, mode: action, cardId, printLogId: card.printLog.id, cardTitle: card.pieceName });
      return;
    }

    if (action === "start") {
      startTransition(async () => {
        const res = await startPrint(cardId);
        if (res?.printLogId) {
          setCards((prev) => prev.map((c) =>
            c.id === cardId
              ? { ...c, column: "PRINTING", printLog: { id: res.printLogId!, status: "STARTED" } }
              : c
          ));
        }
      });
      return;
    }

    if (action === "resume" && card.printLog?.id) {
      const printLogId = card.printLog.id;
      startTransition(async () => { await resumePrint(printLogId); });
      setCards((prev) => prev.map((c) =>
        c.id === cardId ? { ...c, printLog: { ...c.printLog!, status: "RESUMED" } } : c
      ));
      return;
    }

    if (action === "complete" && card.printLog?.id) {
      const printLogId = card.printLog.id;
      startTransition(async () => { await completePrint(printLogId); });
      setCards((prev) => prev.map((c) =>
        c.id === cardId ? { ...c, column: "POST_PROD", printLog: { ...c.printLog!, status: "COMPLETED" } } : c
      ));
    }
  }

  function handleDialogConfirm(reason: string, note: string) {
    if (!dialog.open) return;
    const { mode, cardId, printLogId } = dialog;

    if (mode === "pause") {
      startTransition(async () => { await pausePrint({ printLogId, pauseReason: reason as any, note }); });
      setCards((prev) => prev.map((c) =>
        c.id === cardId
          ? { ...c, printLog: { id: printLogId, status: "PAUSED", reason, note, pausedAt: new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) } }
          : c
      ));
    } else {
      startTransition(async () => { await cancelPrint({ printLogId, cancelReason: reason as any, note, notifyClient: false }); });
      setCards((prev) => prev.map((c) =>
        c.id === cardId
          ? { ...c, column: "CANCELLED", printLog: { id: printLogId, status: "CANCELLED", reason, note } }
          : c
      ));
    }

    setDialog({ open: false });
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        {/* Board scroll horizontal */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COL_ORDER.map((colId) => (
            <Column
              key={colId}
              colId={colId}
              cards={cardsByCol(colId)}
              onPrintAction={handlePrintAction}
            />
          ))}
        </div>

        {/* Card fantasma durante drag */}
        <DragOverlay>
          {activeCard && (
            <div className="rotate-2 opacity-90">
              <SortableCard card={activeCard} onPrintAction={() => {}} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Dialog de pausa/cancelamento */}
      {dialog.open && (
        <PrintControlDialog
          mode={dialog.mode}
          cardTitle={dialog.cardTitle}
          onConfirm={handleDialogConfirm}
          onClose={() => setDialog({ open: false })}
        />
      )}
    </>
  );
}
