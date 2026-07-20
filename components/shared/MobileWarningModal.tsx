"use client";

import { useEffect, useState } from "react";
import { Monitor } from "lucide-react";

const STORAGE_KEY = "mobile_warning_dismissed";

export function MobileWarningModal() {
  const [open, setOpen] = useState(false);
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const dismissed = localStorage.getItem(STORAGE_KEY) === "true";
    if (isMobile && !dismissed) setOpen(true);
  }, []);

  function handleConfirm() {
    if (dontShow) localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl animate-fade-in">
        <div className="mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl gradient-primary">
          <Monitor className="h-5 w-5 text-white" />
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

        <label className="mt-5 flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={dontShow}
            onChange={(e) => setDontShow(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm text-text-muted">Não mostrar novamente</span>
        </label>

        <button
          onClick={handleConfirm}
          className="mt-4 w-full rounded-xl gradient-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Entendi, continuar assim mesmo
        </button>
      </div>
    </div>
  );
}
