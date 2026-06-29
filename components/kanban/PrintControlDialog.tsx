"use client";

import { useState } from "react";
import { X, Pause, XCircle, AlertTriangle } from "lucide-react";

// ─── Enums (espelham o schema Prisma) ────────────────────────

export const PAUSE_REASONS = [
  { value: "FILAMENT_EMPTY",    label: "Filamento acabou" },
  { value: "ADHESION_FAILURE",  label: "Falha de adesão" },
  { value: "POWER_OUTAGE",      label: "Queda de energia" },
  { value: "Z_OFFSET_ISSUE",    label: "Problema de Z-offset" },
  { value: "NOZZLE_CLOG",       label: "Bico entupido" },
  { value: "MANUAL_PAUSE",      label: "Pausa manual" },
  { value: "OTHER",             label: "Outro motivo" },
] as const;

export const CANCEL_REASONS = [
  { value: "PRINT_FAILURE",     label: "Falha de impressão" },
  { value: "CLIENT_CANCELLED",  label: "Cliente cancelou" },
  { value: "MODEL_ERROR",       label: "Erro no modelo 3D" },
  { value: "FILAMENT_EMPTY",    label: "Filamento insuficiente" },
  { value: "EQUIPMENT_ISSUE",   label: "Problema no equipamento" },
  { value: "OTHER",             label: "Outro motivo" },
] as const;

type PauseReason  = typeof PAUSE_REASONS[number]["value"];
type CancelReason = typeof CANCEL_REASONS[number]["value"];

// ─── Props ───────────────────────────────────────────────────

interface PrintControlDialogProps {
  mode: "pause" | "cancel";
  cardTitle: string;
  onConfirm: (reason: string, note: string) => void;
  onClose: () => void;
}

// ─── Dialog ──────────────────────────────────────────────────

export function PrintControlDialog({
  mode,
  cardTitle,
  onConfirm,
  onClose,
}: PrintControlDialogProps) {
  const isPause = mode === "pause";
  const reasons = isPause ? PAUSE_REASONS : CANCEL_REASONS;

  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);

  function handleConfirm() {
    if (!reason) {
      setError(true);
      return;
    }
    onConfirm(reason, note);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="glass relative z-10 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                isPause
                  ? "bg-warning-subtle"
                  : "bg-error-subtle"
              }`}
            >
              {isPause ? (
                <Pause className="h-5 w-5 text-warning" />
              ) : (
                <XCircle className="h-5 w-5 text-error" />
              )}
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-text-primary">
                {isPause ? "Pausar impressão" : "Cancelar impressão"}
              </h2>
              <p className="text-xs text-text-muted truncate max-w-[220px]">{cardTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Motivo */}
        <div className="mb-4">
          <p className="mb-2.5 text-sm font-medium text-text-primary">
            Qual o motivo? <span className="text-error">*</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            {reasons.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => { setReason(r.value); setError(false); }}
                className={`rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  reason === r.value
                    ? isPause
                      ? "border-warning bg-warning-subtle text-warning"
                      : "border-error bg-error-subtle text-error"
                    : "border-border bg-surface text-text-secondary hover:border-primary/50 hover:text-text-primary"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          {error && (
            <div className="mt-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-error" />
              <p className="text-xs text-error">Selecione um motivo para continuar.</p>
            </div>
          )}
        </div>

        {/* Observação */}
        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-text-primary">
            Observação{" "}
            <span className="text-xs font-normal text-text-muted">(opcional)</span>
          </label>
          <textarea
            rows={2}
            placeholder={
              isPause
                ? "Ex: Filamento acabou na bobina 2, retomando amanhã..."
                : "Ex: Cliente pediu alteração no modelo antes de reimprimir..."
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary/50 hover:text-text-primary"
          >
            Voltar
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 ${
              isPause ? "bg-warning" : "bg-error"
            }`}
          >
            {isPause ? "Confirmar pausa" : "Cancelar impressão"}
          </button>
        </div>
      </div>
    </div>
  );
}
