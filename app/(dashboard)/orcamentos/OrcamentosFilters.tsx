"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";

const FILTERS = [
  { label: "Todos",     value: undefined },
  { label: "Aprovado",  value: "APPROVED" },
  { label: "Enviado",   value: "SENT" },
  { label: "Rascunho",  value: "DRAFT" },
  { label: "Expirado",  value: "EXPIRED" },
] as const;

export function OrcamentosFilters() {
  const router       = useRouter();
  const pathname      = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") ?? undefined;
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  function updateParams(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  // Debounce da busca
  useEffect(() => {
    const id = setTimeout(() => updateParams({ q: search || undefined }), 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Buscar por peça ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            onClick={() => updateParams({ status: f.value })}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              currentStatus === f.value
                ? "border-primary bg-primary-subtle text-primary"
                : "border-border bg-surface text-text-secondary hover:border-primary/50 hover:text-text-primary"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
