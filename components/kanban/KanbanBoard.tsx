"use client";

import { useState, useCallback, useTransition, useRef, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
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
  Play, Pause, RotateCcw, XCircle, CheckCircle2,
  Clock, GripVertical, User, Printer, MoreHorizontal,
  Pencil, Trash2, X, Tag,
  Hourglass, CheckCircle, PrinterIcon, Paintbrush,
  Package, Truck, Ban,
} from "lucide-react";
import { PrintControlDialog } from "./PrintControlDialog";
import { cn } from "@/lib/utils";
import {
  moveKanbanCard, startPrint, pausePrint, resumePrint,
  cancelPrint, completePrint, deleteKanbanCard, updateKanbanCard,
} from "@/lib/actions/kanban";

// ─── Tipos ───────────────────────────────────────────────────

type KanbanCol =
  | "WAITING" | "APPROVED" | "PRINTING" | "POST_PROD"
  | "READY"   | "DELIVERED" | "CANCELLED";

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
  notes?: string;
}

// ─── Configuração das colunas ────────────────────────────────

interface ColConfig { label: string; icon: React.ElementType; iconClass: string; colorClass: string }

const COLUMNS: Record<KanbanCol, ColConfig> = {
  WAITING:   { label: "Aguardando",   icon: Hourglass,    iconClass: "text-warning",  colorClass: "border-border" },
  APPROVED:  { label: "Aprovado",     icon: CheckCircle,  iconClass: "text-success",  colorClass: "border-success/30" },
  PRINTING:  { label: "Em Produção",  icon: PrinterIcon,  iconClass: "text-primary",  colorClass: "border-primary/30" },
  POST_PROD: { label: "Pós-Produção", icon: Paintbrush,   iconClass: "text-info",     colorClass: "border-info/30" },
  READY:     { label: "Pronto",       icon: Package,      iconClass: "text-warning",  colorClass: "border-warning/30" },
  DELIVERED: { label: "Entregue",     icon: Truck,        iconClass: "text-success",  colorClass: "border-success/20" },
  CANCELLED: { label: "Cancelado",    icon: Ban,          iconClass: "text-error",    colorClass: "border-error/20" },
};

const COL_ORDER: KanbanCol[] = [
  "WAITING", "APPROVED", "PRINTING", "POST_PROD", "READY", "DELIVERED", "CANCELLED",
];

// ─── Dropdown de 3 pontos ─────────────────────────────────────

function CardMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-36 rounded-xl border border-border bg-surface shadow-lg py-1">
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onEdit(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(false); onDelete(); }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-error-subtle transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Dialog de edição do card ─────────────────────────────────

const inputCls = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

function EditCardDialog({
  card,
  onClose,
  onSave,
}: {
  card: Card;
  onClose: () => void;
  onSave: (dueDate: string, notes: string, tags: string[]) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [dueDate, setDueDate] = useState(
    card.dueDate
      ? (() => { const [d, m, y] = card.dueDate!.split("/"); return `${y}-${m}-${d}`; })()
      : ""
  );
  const [notes, setNotes]     = useState(card.notes ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags]       = useState<string[]>(card.tags ?? []);

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await updateKanbanCard(card.id, { dueDate: dueDate || undefined, notes: notes || undefined, tags: JSON.stringify(tags) });
      onSave(dueDate, notes, tags);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-base font-bold text-text-primary">Editar Card</h2>
            <p className="text-xs text-text-muted mt-0.5 truncate max-w-xs">{card.pieceName}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Prazo</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Detalhes adicionais do pedido..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-text-secondary">Tags</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Digite e pressione Enter"
                className={inputCls}
              />
              <button
                type="button"
                onClick={addTag}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-secondary hover:bg-surface-hover transition-colors"
              >
                <Tag className="h-3.5 w-3.5" />
                Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full border border-border bg-surface-hover px-2.5 py-0.5 text-xs text-text-secondary">
                    {t}
                    <button type="button" onClick={() => removeTag(t)} className="text-text-muted hover:text-error transition-colors">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-text-secondary hover:bg-surface-hover transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {pending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Card arrastável ─────────────────────────────────────────

function SortableCard({
  card,
  onPrintAction,
  onEdit,
  onDelete,
  isDragging,
}: {
  card: Card;
  onPrintAction: (cardId: string, action: "start" | "pause" | "resume" | "cancel" | "complete") => void;
  onEdit: () => void;
  onDelete: () => void;
  isDragging?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: card.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  const isPrinting  = card.column === "PRINTING";
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
      {/* Header: drag + título + menu */}
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
          <p className="text-sm font-semibold text-text-primary leading-snug truncate">{card.pieceName}</p>
          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
            <User className="h-3 w-3" />
            <span className="truncate">{card.clientName}</span>
          </div>
        </div>
        <CardMenu onEdit={onEdit} onDelete={onDelete} />
      </div>

      {/* Impressora */}
      {card.printerName && (
        <div className="mb-2 flex items-center gap-1.5 text-xs text-text-muted">
          <Printer className="h-3 w-3" />
          <span>{card.printerName}</span>
        </div>
      )}

      {/* Observações */}
      {card.notes && (
        <p className="mb-2 text-xs text-text-muted line-clamp-2">{card.notes}</p>
      )}

      {/* Status de pausa */}
      {printStatus === "PAUSED" && card.printLog?.reason && (
        <div className="mb-3 rounded-lg border border-warning/30 bg-warning-subtle px-3 py-2">
          <p className="text-xs font-medium text-warning">⏸ Pausado</p>
          {card.printLog.note && <p className="mt-0.5 text-xs text-text-secondary">{card.printLog.note}</p>}
          {card.printLog.pausedAt && <p className="mt-0.5 text-xs text-text-muted">Desde {card.printLog.pausedAt}</p>}
        </div>
      )}

      {/* Footer: tags + prazo + preço */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {card.tags?.map((t) => (
            <span key={t} className="rounded-full border border-border px-2 py-0.5 text-xs text-text-muted">{t}</span>
          ))}
          {card.dueDate && (() => {
            const [d, m, y] = card.dueDate!.split("/");
            const due  = new Date(`${y}-${m}-${d}T23:59:59`);
            const diff = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
            const color = diff < 0 ? "text-error" : diff <= 2 ? "text-warning" : "text-text-muted";
            const label = diff < 0
              ? `${Math.abs(diff)}d atrasado`
              : diff === 0 ? "Vence hoje"
              : `${diff}d restantes`;
            return (
              <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
                <Clock className="h-3 w-3" />
                {label}
              </span>
            );
          })()}
        </div>
        <span className="shrink-0 text-xs font-semibold text-text-primary">
          {card.totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </span>
      </div>

      {/* Controles de impressão */}
      {isPrinting && (
        <div className="mt-3 flex gap-1.5 border-t border-border pt-3">
          {!printStatus || printStatus === "QUEUED" ? (
            <PrintBtn icon={Play} label="Iniciar" color="success" onClick={() => onPrintAction(card.id, "start")} />
          ) : printStatus === "STARTED" || printStatus === "RESUMED" ? (
            <>
              <PrintBtn icon={Pause}        label="Pausar"  color="warning" onClick={() => onPrintAction(card.id, "pause")} />
              <PrintBtn icon={CheckCircle2} label="Concluir" color="success" onClick={() => onPrintAction(card.id, "complete")} />
              <PrintBtn icon={XCircle}      label="Cancelar" color="error"  onClick={() => onPrintAction(card.id, "cancel")} />
            </>
          ) : printStatus === "PAUSED" ? (
            <>
              <PrintBtn icon={RotateCcw} label="Retomar"  color="primary" onClick={() => onPrintAction(card.id, "resume")} />
              <PrintBtn icon={XCircle}  label="Cancelar"  color="error"   onClick={() => onPrintAction(card.id, "cancel")} />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function PrintBtn({ icon: Icon, label, color, onClick }: {
  icon: React.ElementType; label: string;
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
  colId, cards, onPrintAction, onEdit, onDelete,
}: {
  colId: KanbanCol;
  cards: Card[];
  onPrintAction: (cardId: string, action: "start" | "pause" | "resume" | "cancel" | "complete") => void;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
}) {
  const config = COLUMNS[colId];
  const { setNodeRef, isOver } = useDroppable({ id: colId });

  return (
    <div className={cn("flex w-72 shrink-0 flex-col rounded-xl border bg-surface/50 transition-colors", config.colorClass, isOver && "bg-surface")}>
      <div className="flex items-center gap-2 px-4 py-3">
        <config.icon className={cn("h-4 w-4 shrink-0", config.iconClass)} />
        <span className="text-sm font-semibold text-text-primary">{config.label}</span>
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-surface-hover px-1.5 text-xs font-medium text-text-muted">
          {cards.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex flex-col gap-2.5 overflow-y-auto px-3 pb-3 flex-1"
        style={{ minHeight: "80px", maxHeight: "calc(100vh - 220px)" }}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              onPrintAction={onPrintAction}
              onEdit={() => onEdit(card)}
              onDelete={() => onDelete(card.id)}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className={cn(
            "flex h-20 items-center justify-center rounded-lg border border-dashed transition-colors",
            isOver ? "border-primary bg-primary/5" : "border-border"
          )}>
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
  const [cards, setCards]       = useState<Card[]>(initialCards);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [dialog, setDialog]     = useState<DialogState>({ open: false });
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [, startTransition]     = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  const cardsByCol = useCallback(
    (col: KanbanCol) => cards.filter((c) => c.column === col),
    [cards]
  );

  // ── Drag ───────────────────────────────────────────────────

  function onDragStart({ active }: DragStartEvent) {
    setActiveCard(cards.find((c) => c.id === active.id) ?? null);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null);
    if (!over) return;

    const activeId = active.id as string;
    const overId   = over.id as string;
    if (activeId === overId) return;

    let newColumn: KanbanCol | null = null;

    setCards((prev) => {
      const activeC = prev.find((c) => c.id === activeId);
      if (!activeC) return prev;

      // Solto diretamente sobre uma coluna (useDroppable)
      if (COL_ORDER.includes(overId as KanbanCol)) {
        newColumn = overId as KanbanCol;
        if (activeC.column === newColumn) return prev;
        return prev.map((c) => (c.id === activeId ? { ...c, column: newColumn! } : c));
      }

      // Solto sobre outro card
      const overC = prev.find((c) => c.id === overId);
      if (!overC) return prev;

      if (activeC.column === overC.column) {
        // Reordenação dentro da mesma coluna
        const colCards = prev.filter((c) => c.column === activeC.column);
        const others   = prev.filter((c) => c.column !== activeC.column);
        const oldIdx   = colCards.findIndex((c) => c.id === activeId);
        const newIdx   = colCards.findIndex((c) => c.id === overId);
        return [...others, ...arrayMove(colCards, oldIdx, newIdx)];
      }

      // Mover para a coluna do card alvo
      newColumn = overC.column;
      return prev.map((c) => (c.id === activeId ? { ...c, column: newColumn! } : c));
    });

    if (newColumn) {
      startTransition(async () => { await moveKanbanCard(activeId, newColumn!); });
    }
  }

  // ── Ações de impressão ─────────────────────────────────────

  function handlePrintAction(cardId: string, action: "start" | "pause" | "resume" | "cancel" | "complete") {
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

  // ── Editar / Excluir card ──────────────────────────────────

  function handleDelete(cardId: string) {
    if (!confirm("Remover este card do Kanban? O orçamento não será excluído.")) return;
    startTransition(async () => { await deleteKanbanCard(cardId); });
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  }

  function handleEditSave(cardId: string, dueDate: string, notes: string, tags: string[]) {
    setCards((prev) => prev.map((c) =>
      c.id === cardId
        ? {
            ...c,
            notes,
            tags,
            dueDate: dueDate
              ? new Date(dueDate).toLocaleDateString("pt-BR")
              : undefined,
          }
        : c
    ));
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COL_ORDER.map((colId) => (
            <Column
              key={colId}
              colId={colId}
              cards={cardsByCol(colId)}
              onPrintAction={handlePrintAction}
              onEdit={(card) => setEditingCard(card)}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard && (
            <div className="rotate-2 opacity-90">
              <SortableCard card={activeCard} onPrintAction={() => {}} onEdit={() => {}} onDelete={() => {}} isDragging />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {dialog.open && (
        <PrintControlDialog
          mode={dialog.mode}
          cardTitle={dialog.cardTitle}
          onConfirm={handleDialogConfirm}
          onClose={() => setDialog({ open: false })}
        />
      )}

      {editingCard && (
        <EditCardDialog
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onSave={(dueDate, notes, tags) => {
            handleEditSave(editingCard.id, dueDate, notes, tags);
            setEditingCard(null);
          }}
        />
      )}
    </>
  );
}
