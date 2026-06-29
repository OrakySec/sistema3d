"use client";

import { Info, X } from "lucide-react";
import { useState, useRef, useEffect, useId } from "react";
import { cn } from "@/lib/utils";

interface InfoTipProps {
  /** Texto explicativo exibido no tooltip/modal */
  content: string;
  /** Título opcional do modal (mobile) */
  title?: string;
  /** Lado onde o tooltip abre no desktop */
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
}

/**
 * Ícone ⓘ de ajuda contextual.
 * - Desktop: abre tooltip no hover (com delay)
 * - Mobile: abre modal ao clicar (com botão de fechar)
 */
export function InfoTip({ content, title, side = "top", className }: InfoTipProps) {
  const id = useId();
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Detecta se é mobile/touch
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    check();
    window.matchMedia("(pointer: coarse)").addEventListener("change", check);
    return () => window.matchMedia("(pointer: coarse)").removeEventListener("change", check);
  }, []);

  // Fecha modal com Escape
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [modalOpen]);

  // Posição do tooltip
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    hoverTimer.current = setTimeout(() => setTooltipOpen(true), 300);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setTooltipOpen(false);
  };

  const handleClick = () => {
    if (isMobile) {
      setModalOpen(true);
    } else {
      // Desktop: click também alterna o tooltip
      setTooltipOpen((v) => !v);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-label="Mais informações"
        aria-describedby={tooltipOpen ? `${id}-tooltip` : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={cn(
          "relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:text-primary focus-visible:outline-primary",
          className
        )}
      >
        <Info className="h-3.5 w-3.5" />

        {/* Tooltip — desktop */}
        {tooltipOpen && !isMobile && (
          <div
            id={`${id}-tooltip`}
            role="tooltip"
            className={cn(
              "glass absolute z-50 w-64 rounded-xl p-3 shadow-lg animate-fade-in pointer-events-none",
              positionClasses[side]
            )}
          >
            {title && (
              <p className="mb-1 text-xs font-semibold text-text-primary">{title}</p>
            )}
            <p className="text-xs leading-relaxed text-text-secondary">{content}</p>
          </div>
        )}
      </button>

      {/* Modal — mobile */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4"
          onClick={() => setModalOpen(false)}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Card */}
          <div
            className="glass relative z-10 w-full max-w-sm rounded-2xl p-5 shadow-xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? `${id}-modal-title` : undefined}
          >
            {/* Header */}
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-subtle">
                  <Info className="h-3.5 w-3.5 text-primary" />
                </div>
                {title && (
                  <p
                    id={`${id}-modal-title`}
                    className="font-display text-sm font-semibold text-text-primary"
                  >
                    {title}
                  </p>
                )}
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Conteúdo */}
            <p className="text-sm leading-relaxed text-text-secondary">{content}</p>

            {/* Botão fechar (mobile) */}
            <button
              onClick={() => setModalOpen(false)}
              className="mt-4 w-full rounded-lg bg-surface-hover py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-border"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
