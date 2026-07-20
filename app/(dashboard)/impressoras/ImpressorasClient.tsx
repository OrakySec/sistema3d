"use client";

import { useState, useTransition } from "react";
import { Plus, Printer, Zap, Clock, TrendingUp, Pencil, Trash2, Power } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CrudDialog, FormField, DialogActions, inputCls } from "@/components/shared/CrudDialog";
import { createPrinter, updatePrinter, togglePrinterActive, deletePrinter } from "@/lib/actions/printers";
import { formatBRL } from "@/lib/calculations";
import { InfoTip } from "@/components/shared/InfoTip";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { LockedCard } from "@/components/shared/LockedCard";
import { PLAN_LIMITS, type Plan, type LimitKey } from "@/lib/plans";

const printerSchema = z.object({
  name:               z.string().min(2, "Nome obrigatório"),
  model:              z.string().optional(),
  printerType:        z.enum(["FDM", "RESIN"]).default("FDM"),
  powerWatts:         z.coerce.number().positive("Informe o consumo"),
  purchasePrice:      z.coerce.number().positive("Informe o preço"),
  estimatedHours:     z.coerce.number().positive("Informe a vida útil"),
  monthlyMaintenance: z.coerce.number().min(0),
  lcdLifetimeHours:   z.coerce.number().positive().optional(),
  lcdPrice:           z.coerce.number().min(0).optional(),
  totalHours:         z.coerce.number().min(0).optional(),
});
type PrinterForm = z.infer<typeof printerSchema>;

interface PrinterModel {
  id: string; name: string; model?: string | null; printerType: "FDM" | "RESIN";
  powerWatts: number; purchasePrice: number; estimatedHours: number;
  monthlyMaintenance: number; lcdLifetimeHours?: number | null;
  lcdPrice?: number | null; active: boolean; totalHours: number;
  totalPrints: number; successCount: number;
}

function lcdCph(p: PrinterModel) {
  if (p.printerType !== "RESIN" || !p.lcdLifetimeHours || !p.lcdPrice) return 0;
  return p.lcdPrice / p.lcdLifetimeHours;
}
function cph(p: PrinterModel) {
  return p.purchasePrice / p.estimatedHours + p.monthlyMaintenance / 730 + lcdCph(p);
}
function lifeUsed(p: PrinterModel) { return Math.min(100, (p.totalHours / p.estimatedHours) * 100); }
function lcdUsed(p: PrinterModel) {
  if (!p.lcdLifetimeHours) return null;
  return Math.min(100, (p.totalHours / p.lcdLifetimeHours) * 100);
}
function successRate(p: PrinterModel) { return p.totalPrints === 0 ? 100 : Math.round((p.successCount / p.totalPrints) * 100); }

function PrinterDialog({ printer, onClose, onLimitExceeded }: {
  printer?: PrinterModel; onClose: () => void; onLimitExceeded: (key: LimitKey) => void;
}) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PrinterForm>({
    resolver: zodResolver(printerSchema) as unknown as Resolver<PrinterForm>,
    defaultValues: printer
      ? {
          ...printer,
          model:            printer.model            ?? undefined,
          lcdLifetimeHours: printer.lcdLifetimeHours ?? undefined,
          lcdPrice:         printer.lcdPrice         ?? undefined,
        }
      : { printerType: "FDM" as const, estimatedHours: 5000, monthlyMaintenance: 0 },
  });
  const watchedType = watch("printerType");
  const isResin = watchedType === "RESIN";
  const [pp, eh, mm, lcdH, lcdP] = [
    watch("purchasePrice") ?? 0, watch("estimatedHours") ?? 5000,
    watch("monthlyMaintenance") ?? 0,
    watch("lcdLifetimeHours") ?? 0, watch("lcdPrice") ?? 0,
  ];
  const lcdCostPerHour = isResin && lcdH > 0 && lcdP > 0 ? lcdP / lcdH : 0;
  const previewCph = pp / eh + mm / 730 + lcdCostPerHour;

  function onSubmit(data: PrinterForm) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
    startTransition(async () => {
      if (printer) { await updatePrinter(printer.id, fd); onClose(); return; }
      const res = await createPrinter(fd);
      if (res?.error === "LIMIT_EXCEEDED") { onClose(); onLimitExceeded(res.key as LimitKey); return; }
      onClose();
    });
  }

  return (
    <CrudDialog title={printer ? "Editar Impressora" : "Nova Impressora"}
      subtitle={printer ? printer.name : "Cadastre para habilitar o cálculo de custos"}
      icon={Printer} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nome" error={errors.name?.message}>
            <input {...register("name")} placeholder="Bambu Lab X1C" className={inputCls} />
          </FormField>
          <FormField label="Modelo">
            <input {...register("model")} placeholder="X1C" className={inputCls} />
          </FormField>
          <FormField label="Tipo de impressão" className="sm:col-span-2">
            <div className="flex gap-2">
              {(["FDM", "RESIN"] as const).map((t) => (
                <label key={t} className="flex flex-1 cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-background px-4 py-2.5 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-subtle">
                  <input type="radio" value={t} {...register("printerType")} className="accent-primary" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">{t === "FDM" ? "FDM / Filamento" : "Resina (SLA/DLP/MSLA)"}</p>
                    <p className="text-xs text-text-muted">{t === "FDM" ? "Usa filamento em bobina (PLA, PETG, ABS...)" : "Usa resina líquida (Standard, ABS-Like...)"}</p>
                  </div>
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="Consumo (W)" error={errors.powerWatts?.message}>
            <div className="relative">
              <input {...register("powerWatts")} type="number" min={1} placeholder="350" className={inputCls} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">W</span>
            </div>
          </FormField>
          <FormField label="Preço de compra" error={errors.purchasePrice?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
              <input {...register("purchasePrice")} type="number" min={0} step={0.01} placeholder="6500" className={`${inputCls} pl-8`} />
            </div>
          </FormField>
          <FormField label="Vida útil (h)" error={errors.estimatedHours?.message}>
            <div className="relative">
              <input {...register("estimatedHours")} type="number" min={100} placeholder="5000" className={inputCls} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">h</span>
            </div>
          </FormField>
          <FormField label="Manutenção mensal" error={errors.monthlyMaintenance?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
              <input {...register("monthlyMaintenance")} type="number" min={0} step={0.01} placeholder="50" className={`${inputCls} pl-8`} />
            </div>
          </FormField>
          {/* Tela LCD — apenas resina */}
          {isResin && (
            <div className="sm:col-span-2 rounded-xl border border-info/30 bg-info-subtle p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-info">
                Tela LCD / FEP
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Vida útil da tela (h)" error={errors.lcdLifetimeHours?.message}>
                  <div className="relative">
                    <input {...register("lcdLifetimeHours")} type="number" min={100} placeholder="2000" className={inputCls} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">h</span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">Telas LCD duram em média 2000h. Verifique o manual da sua impressora.</p>
                </FormField>
                <FormField label="Custo de reposição" error={errors.lcdPrice?.message}>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
                    <input {...register("lcdPrice")} type="number" min={0} step={0.01} placeholder="250" className={`${inputCls} pl-8`} />
                  </div>
                  <p className="mt-1 text-xs text-text-muted">Preço da tela LCD de reposição da sua impressora.</p>
                </FormField>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-medium text-text-primary">Horas já usadas</label>
              <InfoTip content="Se a impressora já tinha uso antes de cadastrar aqui (comprada usada ou já em operação), informe quantas horas ela já imprimiu. Isso ajusta corretamente o cálculo de vida útil restante." />
            </div>
            <div className="relative">
              <input {...register("totalHours")} type="number" min={0} placeholder="0 (deixe em branco se for nova)" className={inputCls} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">h</span>
            </div>
            {errors.totalHours && <p className="text-xs text-error">{errors.totalHours.message}</p>}
          </div>
        </div>
        {pp > 0 && eh > 0 && (
          <div className="mt-5 rounded-xl border border-primary/20 bg-primary-subtle p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Custo por hora</p>
              <p className="mt-1 font-display text-2xl font-bold text-primary">
                {formatBRL(previewCph)}<span className="text-sm font-normal text-text-muted">/h</span>
              </p>
            </div>
            <div className="text-right text-xs text-text-muted">
              <p>Depreciação: {formatBRL(pp / eh)}/h</p>
              <p>Manutenção: {formatBRL(mm / 730)}/h</p>
              {lcdCostPerHour > 0 && <p className="text-info">Tela LCD: {formatBRL(lcdCostPerHour)}/h</p>}
            </div>
          </div>
        )}
        <DialogActions onClose={onClose} loading={pending}
          submitLabel={printer ? "Salvar alterações" : "Cadastrar impressora"} />
      </form>
    </CrudDialog>
  );
}

export function ImpressorasClient({
  initialPrinters, plan, isFirstSubscriber,
}: {
  initialPrinters: PrinterModel[];
  plan: Plan;
  isFirstSubscriber: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<PrinterModel | undefined>();
  const [upgradeOpen, setUpgradeOpen]         = useState(false);
  const [upgradeLimitKey, setUpgradeLimitKey] = useState<LimitKey>("printers");
  const [, startTransition]         = useTransition();

  function handleToggle(id: string, active: boolean) {
    startTransition(() => togglePrinterActive(id, !active));
  }
  function handleDelete(id: string) {
    if (!confirm("Remover esta impressora?")) return;
    startTransition(() => deletePrinter(id));
  }
  function openEdit(p: PrinterModel) { setEditing(p); setDialogOpen(true); }
  function openNew()                  { setEditing(undefined); setDialogOpen(true); }
  function closeDialog()              { setDialogOpen(false); setEditing(undefined); }
  function handleLimitExceeded(key: LimitKey) { setUpgradeLimitKey(key); setUpgradeOpen(true); }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Impressoras</h1>
          <p className="mt-0.5 text-sm text-text-secondary">{initialPrinters.length} impressoras cadastradas</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90">
          <Plus className="h-4 w-4" /> Nova Impressora
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {initialPrinters.map((p, idx) => {
          const limit  = PLAN_LIMITS[plan].printers;
          const locked = limit !== -1 && idx >= limit;
          const c = cph(p);
          const life = lifeUsed(p);
          const sr   = successRate(p);
          const lifeColor = life > 80 ? "bg-error" : life > 60 ? "bg-warning" : "bg-success";
          const card = (
            <div key={p.id}
              className={`group rounded-xl border bg-surface p-5 transition-all hover:shadow-card ${p.active ? "border-border hover:border-primary/40" : "border-border opacity-60"}`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${p.active ? "gradient-primary" : "bg-surface-hover"}`}>
                    <Printer className={`h-5 w-5 ${p.active ? "text-white" : "text-text-muted"}`} />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{p.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${p.active ? "bg-success" : "bg-text-muted"}`} />
                      <span className="text-xs text-text-muted">{p.active ? "Ativa" : "Inativa"}</span>
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md ${p.printerType === "RESIN" ? "bg-pink-500/10 text-pink-400" : "bg-blue-500/10 text-blue-400"}`}>
                        {p.printerType === "RESIN" ? "Resina" : "FDM"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <button onClick={() => handleToggle(p.id, p.active)} title={p.active ? "Desativar" : "Ativar"}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-primary transition-colors">
                    <Power className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => openEdit(p)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-primary transition-colors">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(p.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-error-subtle hover:text-error transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mb-4 rounded-lg bg-primary-subtle border border-primary/20 px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-text-muted">Custo por hora</span>
                <span className="font-display text-xl font-bold text-primary">{formatBRL(c)}/h</span>
              </div>
              <div className="mb-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-surface-hover p-2">
                  <Zap className="mx-auto h-3.5 w-3.5 text-warning mb-1" />
                  <p className="text-xs font-semibold text-text-primary">{p.powerWatts}W</p>
                  <p className="text-xs text-text-muted">Consumo</p>
                </div>
                <div className="rounded-lg bg-surface-hover p-2">
                  <Clock className="mx-auto h-3.5 w-3.5 text-info mb-1" />
                  <p className="text-xs font-semibold text-text-primary">{p.totalHours.toLocaleString("pt-BR")}h</p>
                  <p className="text-xs text-text-muted">Usadas</p>
                </div>
                <div className="rounded-lg bg-surface-hover p-2">
                  <TrendingUp className="mx-auto h-3.5 w-3.5 text-success mb-1" />
                  <p className="text-xs font-semibold text-text-primary">{sr}%</p>
                  <p className="text-xs text-text-muted">Sucesso</p>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs text-text-muted">Vida útil</span>
                  <span className="text-xs font-medium text-text-secondary">{p.totalHours} / {p.estimatedHours}h</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                  <div className={`h-full rounded-full transition-all ${lifeColor}`} style={{ width: `${life}%` }} />
                </div>
                {life > 80 && <p className="mt-1 text-xs text-error">⚠ Vida útil quase no limite.</p>}
              </div>
              {p.printerType === "RESIN" && lcdUsed(p) !== null && (
                <div className="mt-2">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-text-muted">Tela LCD</span>
                    <span className="text-xs font-medium text-text-secondary">{p.totalHours} / {p.lcdLifetimeHours}h</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full transition-all ${(lcdUsed(p) ?? 0) > 80 ? "bg-error" : (lcdUsed(p) ?? 0) > 50 ? "bg-warning" : "bg-info"}`}
                      style={{ width: `${lcdUsed(p)}%` }}
                    />
                  </div>
                  {(lcdUsed(p) ?? 0) > 80 && <p className="mt-1 text-xs text-error">⚠ Tela LCD quase no limite.</p>}
                </div>
              )}
            </div>
          );
          return locked
            ? <LockedCard key={p.id} label="impressora">{card}</LockedCard>
            : <div key={p.id}>{card}</div>;
        })}
        <button onClick={openNew}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-10 text-center transition-colors hover:border-primary hover:bg-primary-subtle">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-primary/40">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-text-secondary">Adicionar impressora</p>
        </button>
      </div>
      {dialogOpen && (
        <PrinterDialog printer={editing} onClose={closeDialog} onLimitExceeded={handleLimitExceeded} />
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
