"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CrudDialogProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  onClose: () => void;
  children: React.ReactNode;
  size?: "md" | "lg";
}

export function CrudDialog({ title, subtitle, icon: Icon, onClose, children, size = "md" }: CrudDialogProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        className={`glass relative z-10 w-full rounded-2xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh] ${
          size === "lg" ? "max-w-2xl" : "max-w-lg"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-subtle">
              <Icon className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-text-primary">{title}</h2>
              {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export const inputCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export const selectCls =
  "h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

export function FormField({
  label,
  error,
  children,
  className,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label className="text-sm font-medium text-text-primary">{label}</label>
      {children}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}

export function DialogActions({ onClose, loading, submitLabel = "Salvar" }: {
  onClose: () => void;
  loading?: boolean;
  submitLabel?: string;
}) {
  return (
    <div className="mt-6 flex gap-2">
      <button
        type="button"
        onClick={onClose}
        className="flex-1 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary/50 hover:text-text-primary"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex-1 rounded-lg gradient-primary py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Salvando..." : submitLabel}
      </button>
    </div>
  );
}
