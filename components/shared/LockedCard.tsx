"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  children: React.ReactNode;
  label?: string; // e.g. "impressora", "filamento", "cliente"
}

export function LockedCard({ children, label = "item" }: Props) {
  const router = useRouter();

  return (
    <div className="relative">
      {/* conteúdo original com blur */}
      <div className="pointer-events-none select-none opacity-40 blur-[2px]">
        {children}
      </div>

      {/* overlay clicável */}
      <button
        onClick={() => router.push("/configuracoes?tab=assinatura")}
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-background/70 backdrop-blur-[1px] transition-colors hover:border-primary hover:bg-primary-subtle/60"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary-subtle">
          <Lock className="h-5 w-5 text-primary" />
        </div>
        <div className="text-center px-4">
          <p className="text-sm font-semibold text-text-primary">
            {label.charAt(0).toUpperCase() + label.slice(1)} bloqueado
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            Reative seu plano para desbloquear
          </p>
        </div>
        <span className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-sm">
          Ver planos
        </span>
      </button>
    </div>
  );
}
