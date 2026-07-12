"use client";

import { useState } from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

export function PastDueBanner() {
  const [loading,    setLoading]    = useState(false);
  const [dismissed,  setDismissed]  = useState(false);

  if (dismissed) return null;

  async function handlePortal() {
    setLoading(true);
    const res  = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3 bg-error px-4 py-2.5 text-white">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p className="flex-1 text-sm font-medium">
        Pagamento em atraso — seu acesso pode ser suspenso. Atualize seu cartão para continuar.
      </p>
      <button
        onClick={handlePortal}
        disabled={loading}
        className="shrink-0 rounded-md bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30 transition-colors disabled:opacity-60 flex items-center gap-1.5"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Atualizar cartão"}
      </button>
      <button onClick={() => setDismissed(true)} className="shrink-0 rounded p-0.5 hover:bg-white/20 transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
