"use client";

import { useEffect, useState } from "react";
import { Monitor, X } from "lucide-react";

export function MobileWarningModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const dismissed = sessionStorage.getItem("mobile-warning-dismissed");
    if (isMobile && !dismissed) setOpen(true);
  }, []);

  function dismiss() {
    sessionStorage.setItem("mobile-warning-dismissed", "1");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-primary">
            <Monitor className="h-5 w-5 text-white" />
          </div>
          <button onClick={dismiss} className="text-text-muted hover:text-text-primary transition-colors mt-0.5">
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 className="font-display text-lg font-bold text-text-primary">
          Melhor no computador
        </h2>
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          Este sistema foi desenvolvido para uso no computador. No celular algumas funcionalidades podem não funcionar corretamente.
        </p>
        <p className="mt-1 text-sm text-text-muted">
          Recomendamos acessar pelo PC para uma experiência completa.
        </p>
        <button
          onClick={dismiss}
          className="mt-5 w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Entendi, continuar assim mesmo
        </button>
      </div>
    </div>
  );
}
