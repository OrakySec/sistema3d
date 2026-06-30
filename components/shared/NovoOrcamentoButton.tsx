"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShoppingBag, Store, X } from "lucide-react";

export function NovoOrcamentoButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function choose(type: "direto" | "marketplace") {
    setOpen(false);
    router.push(type === "marketplace" ? "/orcamentos/novo/marketplace" : "/orcamentos/novo");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        Novo Orçamento
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass relative z-10 w-full max-w-md rounded-2xl shadow-2xl animate-fade-in"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <h2 className="font-display text-base font-bold text-text-primary">Novo Orçamento</h2>
                <p className="text-xs text-text-muted mt-0.5">Escolha o tipo de venda</p>
              </div>
              <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-text-primary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <button
                onClick={() => choose("direto")}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 text-center transition-all hover:border-primary/50 hover:bg-primary-subtle group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-subtle border border-primary/20 group-hover:border-primary/40">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-text-primary">Venda Direta</p>
                  <p className="mt-0.5 text-xs text-text-muted">Orçamento com link de aprovação para o cliente</p>
                </div>
              </button>

              <button
                onClick={() => choose("marketplace")}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 text-center transition-all hover:border-primary/50 hover:bg-primary-subtle group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-subtle border border-primary/20 group-hover:border-primary/40">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-display text-sm font-bold text-text-primary">Marketplace</p>
                  <p className="mt-0.5 text-xs text-text-muted">Calcule preço incluindo a taxa da plataforma e publique no catálogo</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
