"use client";

import { useState, useTransition } from "react";
import { Plus, Package, Search, Pencil, Trash2, AlertTriangle, Copy } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CrudDialog, FormField, DialogActions, inputCls, selectCls } from "@/components/shared/CrudDialog";
import { createFilament, updateFilament, deleteFilament } from "@/lib/actions/filaments";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { LockedCard } from "@/components/shared/LockedCard";
import { PLAN_LIMITS, type Plan, type LimitKey } from "@/lib/plans";

const FILAMENT_TYPES = ["PLA", "PETG", "ABS", "ASA", "TPU", "NYLON", "RESIN", "OTHER"] as const;

const filamentSchema = z.object({
  name:           z.string().min(2, "Nome obrigatório"),
  brand:          z.string().optional(),
  type:           z.enum(FILAMENT_TYPES),
  color:          z.string().optional(),
  colorHex:       z.string().optional(),
  purchasedGrams: z.coerce.number().positive("Informe o peso"),
  currentGrams:   z.coerce.number().min(0),
  costPerKg:      z.coerce.number().positive("Informe o custo"),
  density:        z.coerce.number().positive().optional(),
  lowStockAlert:  z.coerce.number().min(0),
});
type FilamentForm = z.infer<typeof filamentSchema>;

interface Filament {
  id: string; name: string; brand?: string | null; type: typeof FILAMENT_TYPES[number];
  color?: string | null; colorHex?: string | null; purchasedGrams: number;
  currentGrams: number; costPerKg: number; density?: number | null;
  lowStockAlert: number; active: boolean;
}

const typeColors: Record<string, string> = {
  PLA: "border-green-500/30 text-green-400 bg-green-500/10",
  PETG: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  ABS: "border-orange-500/30 text-orange-400 bg-orange-500/10",
  ASA: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  TPU: "border-purple-500/30 text-purple-400 bg-purple-500/10",
  NYLON: "border-red-500/30 text-red-400 bg-red-500/10",
  RESIN: "border-pink-500/30 text-pink-400 bg-pink-500/10",
  OTHER: "border-border text-text-muted bg-surface-hover",
};

function FilamentDialog({ filament, onClose, onLimitExceeded }: {
  filament?: Filament; onClose: () => void; onLimitExceeded: (key: LimitKey) => void;
}) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FilamentForm>({
    resolver: zodResolver(filamentSchema) as Resolver<FilamentForm>,
    defaultValues: filament
      ? { ...filament, brand: filament.brand ?? "", color: filament.color ?? "", colorHex: filament.colorHex ?? "", density: filament.density ?? undefined }
      : { type: "PLA", lowStockAlert: 200, purchasedGrams: 1000, currentGrams: 1000, costPerKg: 85 },
  });
  const colorHex = watch("colorHex");
  const watchedType = watch("type");
  const isValidHex = /^#[0-9A-Fa-f]{6}$/.test(colorHex || "");

  function onSubmit(data: FilamentForm) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
    startTransition(async () => {
      if (filament) { await updateFilament(filament.id, fd); onClose(); return; }
      const res = await createFilament(fd);
      if (res?.error === "LIMIT_EXCEEDED") { onClose(); onLimitExceeded(res.key as LimitKey); return; }
      onClose();
    });
  }

  return (
    <CrudDialog title={filament ? "Editar Material" : "Novo Material"}
      subtitle={filament ? filament.name : "Cadastre um material para controle de estoque e custo"}
      icon={Package} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" error={errors.name?.message} className="sm:col-span-2">
            <input {...register("name")} placeholder="PLA Branco Polymaker" className={inputCls} />
          </FormField>
          <FormField label="Marca">
            <input {...register("brand")} placeholder="Polymaker, Bambu Lab..." className={inputCls} />
          </FormField>
          <FormField label="Tipo" error={errors.type?.message}>
            <select {...register("type")} className={selectCls}>
              {FILAMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Nome da cor">
            <input {...register("color")} placeholder="Branco, Vermelho..." className={inputCls} />
          </FormField>
          <FormField label="Cor (hex)">
            <div className="flex gap-2">
              <input {...register("colorHex")} placeholder="#FFFFFF" className={inputCls} />
              <label
                className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border transition-colors hover:border-primary"
                style={{ backgroundColor: isValidHex ? colorHex : "#09090B" }}
                title="Clique para escolher a cor"
              >
                <input
                  type="color"
                  value={isValidHex ? colorHex! : "#000000"}
                  onChange={(e) => setValue("colorHex", e.target.value, { shouldValidate: true })}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </label>
            </div>
          </FormField>
          <FormField label="Peso comprado (g)" error={errors.purchasedGrams?.message}>
            <div className="relative">
              <input {...register("purchasedGrams")} type="number" min={1} placeholder="1000" className={inputCls} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">g</span>
            </div>
          </FormField>
          <FormField label="Saldo atual (g)" error={errors.currentGrams?.message}>
            <div className="relative">
              <input {...register("currentGrams")} type="number" min={0} placeholder="1000" className={inputCls} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">g</span>
            </div>
          </FormField>
          <FormField label="Custo por kg (R$)" error={errors.costPerKg?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
              <input {...register("costPerKg")} type="number" min={1} step={0.01} placeholder="85" className={`${inputCls} pl-8`} />
            </div>
          </FormField>
          {watchedType === "RESIN" && (
            <FormField label="Densidade (g/mL)" error={errors.density?.message}>
              <div className="relative">
                <input {...register("density")} type="number" min={0.5} max={3} step={0.01} placeholder="1.1" className={inputCls} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">g/mL</span>
              </div>
              <p className="text-xs text-text-muted">Padrão: ~1,1 g/mL. Consulte a embalagem da resina. Usado para converter mL (Chitubox) → gramas no orçamento.</p>
            </FormField>
          )}
          <FormField label="Alerta de estoque baixo (g)">
            <div className="relative">
              <input {...register("lowStockAlert")} type="number" min={0} placeholder="200" className={inputCls} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">g</span>
            </div>
          </FormField>
        </div>
        <DialogActions onClose={onClose} loading={pending}
          submitLabel={filament ? "Salvar alterações" : "Cadastrar material"} />
      </form>
    </CrudDialog>
  );
}

export function EstoqueClient({
  initialFilaments, plan, isFirstSubscriber,
}: {
  initialFilaments: Filament[];
  plan: Plan;
  isFirstSubscriber: boolean;
}) {
  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState<string>("ALL");
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editing, setEditing]         = useState<Filament | undefined>();
  const [upgradeOpen, setUpgradeOpen]         = useState(false);
  const [upgradeLimitKey, setUpgradeLimitKey] = useState<LimitKey>("filaments");
  const [, startTransition]           = useTransition();

  const filamentLimit = PLAN_LIMITS[plan].filaments;
  const lockedIds = filamentLimit === -1
    ? new Set<string>()
    : new Set(initialFilaments.slice(filamentLimit).map((f) => f.id));

  const lowStock   = initialFilaments.filter((f) => f.currentGrams <= f.lowStockAlert && f.active);
  const totalValue = initialFilaments.reduce((a, f) => a + (f.currentGrams / 1000) * f.costPerKg, 0);

  const filtered = initialFilaments.filter((f) => {
    const s = f.name.toLowerCase().includes(search.toLowerCase()) || f.brand?.toLowerCase().includes(search.toLowerCase());
    const t = filterType === "ALL" || f.type === filterType;
    return s && t;
  });

  function handleDelete(id: string) {
    if (!confirm("Remover este material?")) return;
    startTransition(() => deleteFilament(id));
  }
  function handleDuplicate(f: Filament) {
    const fd = new FormData();
    fd.append("name", `${f.name} (cópia)`);
    fd.append("brand", f.brand ?? "");
    fd.append("type", f.type);
    fd.append("color", f.color ?? "");
    fd.append("colorHex", f.colorHex ?? "");
    fd.append("purchasedGrams", String(f.purchasedGrams));
    fd.append("currentGrams", String(f.purchasedGrams)); // cópia começa com saldo cheio
    fd.append("costPerKg", String(f.costPerKg));
    fd.append("lowStockAlert", String(f.lowStockAlert));
    startTransition(async () => {
      const result = await createFilament(fd);
      if (result?.error === "LIMIT_EXCEEDED") handleLimitExceeded("filaments");
    });
  }
  function openEdit(f: Filament) { setEditing(f); setDialogOpen(true); }
  function openNew()              { setEditing(undefined); setDialogOpen(true); }
  function closeDialog()          { setDialogOpen(false); setEditing(undefined); }
  function handleLimitExceeded(key: LimitKey) { setUpgradeLimitKey(key); setUpgradeOpen(true); }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Estoque de Materiais</h1>
          <p className="mt-0.5 text-sm text-text-secondary">{initialFilaments.length} materiais cadastrados</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" /> Novo Material
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-subtle px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-semibold text-text-primary">{lowStock.length} material(is) com estoque baixo</p>
            <p className="mt-0.5 text-xs text-text-secondary">{lowStock.map((f) => f.name).join(" · ")}</p>
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="font-display text-2xl font-bold text-text-primary">{initialFilaments.length}</p>
          <p className="text-xs text-text-muted mt-0.5">materiais ativos</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning-subtle p-4 text-center">
          <p className="font-display text-2xl font-bold text-warning">{lowStock.length}</p>
          <p className="text-xs text-text-muted mt-0.5">estoque baixo</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success-subtle p-4 text-center">
          <p className="font-display text-lg font-bold text-success">
            {totalValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="text-xs text-text-muted mt-0.5">valor em estoque</p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Buscar por nome ou marca..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["ALL", ...FILAMENT_TYPES] as const).map((t) => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${filterType === t ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface text-text-secondary hover:border-primary/50"}`}>
              {t === "ALL" ? "Todos" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="hidden grid-cols-[32px_1fr_80px_80px_1fr_120px_80px] items-center gap-4 border-b border-border px-5 py-3 text-xs font-medium text-text-muted sm:grid">
          <span /><span>Material</span><span>Tipo</span><span>Saldo</span><span>Barra</span><span>Custo/g</span><span />
        </div>
        <div className="divide-y divide-border">
          {filtered.map((f) => {
            const locked = lockedIds.has(f.id);
            const pct = Math.min(100, (f.currentGrams / f.purchasedGrams) * 100);
            const isLow = f.currentGrams <= f.lowStockAlert;
            const barColor = isLow ? "bg-error" : pct > 50 ? "bg-success" : "bg-warning";
            const row = (
              <div
                className="group grid grid-cols-[32px_1fr] sm:grid-cols-[32px_1fr_80px_80px_1fr_120px_80px] items-center gap-4 px-5 py-3.5 hover:bg-surface-hover transition-colors">
                <div className="h-7 w-7 shrink-0 rounded-full border-2 border-border shadow-sm"
                  style={{ backgroundColor: f.colorHex ?? "#666" }} title={f.color ?? ""} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{f.name}</p>
                  <p className="text-xs text-text-muted">{f.brand}</p>
                </div>
                <span className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${typeColors[f.type]}`}>{f.type}</span>
                <div className="hidden sm:block">
                  <p className={`text-sm font-semibold ${isLow ? "text-error" : "text-text-primary"}`}>{f.currentGrams}g</p>
                  {isLow && <p className="text-xs text-error">⚠ Baixo</p>}
                </div>
                <div className="hidden sm:block">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-0.5 text-xs text-text-muted">{Math.round(pct)}%</p>
                </div>
                <span className="hidden sm:block text-sm text-text-secondary">
                  {(f.costPerKg / 1000).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}/g
                </span>
                <div className="flex gap-1 transition-opacity justify-end md:opacity-0 md:group-hover:opacity-100">
                  <button onClick={() => handleDuplicate(f)} title="Duplicar material"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface hover:text-primary transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => openEdit(f)} title="Editar"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface hover:text-primary transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(f.id)} title="Excluir"
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-error-subtle hover:text-error transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
            return locked
              ? <LockedCard key={f.id} label="material">{row}</LockedCard>
              : <div key={f.id}>{row}</div>;
          })}
        </div>
      </div>
      {dialogOpen && (
        <FilamentDialog filament={editing} onClose={closeDialog} onLimitExceeded={handleLimitExceeded} />
      )}
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        limitKey={upgradeLimitKey}
        currentPlan={plan}
        isFirstSubscriber={isFirstSubscriber}
      />
    </>
  );
}
