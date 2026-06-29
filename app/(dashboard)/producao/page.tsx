import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { LayoutGrid, Info } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Produção" };

export default function ProducaoPage() {
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

        {/* Legenda rápida */}
        <div className="flex items-center gap-2 rounded-lg border border-info/20 bg-info-subtle px-3 py-2">
          <Info className="h-3.5 w-3.5 shrink-0 text-info" />
          <p className="text-xs text-text-secondary">
            Cards na coluna <span className="font-semibold text-text-primary">Em Produção</span> têm controles de impressão (iniciar, pausar, retomar, cancelar).
          </p>
        </div>
      </div>

      {/* Board */}
      <KanbanBoard />
    </>
  );
}
