"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  ChevronLeft, Calculator as CalcIcon, Package, Printer as PrinterIcon,
  TrendingUp, Calendar, Plus, Trash2, Copy, Send, Save, Info, User, X, Loader2,
} from "lucide-react";
import { calculateQuote, formatBRL, type QuoteBreakdown } from "@/lib/calculations";
import { InfoTip } from "@/components/shared/InfoTip";
import { createQuote, updateQuote } from "@/lib/actions/quotes";
import { createClientQuick } from "@/lib/actions/clients";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import type { Plan, LimitKey } from "@/lib/plans";

// ─── Props vindo do Server Component ─────────────────────────

interface PrinterOption {
  id: string; name: string; powerWatts: number;
  purchasePrice: number; estimatedHours: number; monthlyMaintenance: number;
}
interface FilamentOption {
  id: string; name: string; costPerKg: number; colorHex?: string | null;
  type: string; currentGrams: number;
}
interface ClientOption { id: string; name: string; }
interface Settings {
  energyCostKwh: number; defaultProfitMargin: number;
  paintingHourlyRate: number; quoteExpirationDays: number;
}

interface InitialData {
  pieceName:     string;
  description:   string;
  clientId:      string;
  printerId:     string;
  filamentId:    string;
  filamentGrams: number;
  printHours:    number;
  profitMargin:  number;
  paintingHours: number;
  expirationDays: number;
  versions: { label: string; description: string; paintingHours: number; profitMargin: number }[];
}

interface CalculatorProps {
  printers: PrinterOption[];
  filaments: FilamentOption[];
  clients:   ClientOption[];
  settings:  Settings;
  plan:              Plan;
  isFirstSubscriber: boolean;
  quoteId?:     string;
  initialData?: InitialData;
}

// ─── Versão ───────────────────────────────────────────────────

interface QuoteVersion {
  id: string; label: string; paintingHours: number;
  profitMargin: number; breakdown: QuoteBreakdown | null;
}

// ─── Helpers de layout ────────────────────────────────────────

function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="font-display text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, tip, children, className }: {
  label: string; tip?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <div className="flex items-center gap-1.5">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        {tip && <InfoTip content={tip} />}
      </div>
      {children}
    </div>
  );
}

const inputCls = "h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 w-full";
const selectCls = "h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 w-full";

function CostRow({ label, value, sub, highlight }: {
  label: string; value: number; sub?: string; highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <span className={`text-sm ${highlight ? "font-medium text-success" : "text-text-secondary"}`}>{label}</span>
        {sub && <p className="text-xs text-text-muted leading-tight">{sub}</p>}
      </div>
      <span className={`shrink-0 text-sm font-semibold ${highlight ? "text-success" : "text-text-primary"}`}>
        {formatBRL(value)}
      </span>
    </div>
  );
}

function MetricBox({ label, value, sub, highlight }: {
  label: string; value: string; sub: string; highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 text-center ${highlight ? "border-success/20 bg-success-subtle" : "border-border bg-background"}`}>
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`mt-0.5 text-base font-bold ${highlight ? "text-success" : "text-text-primary"}`}>{value}</p>
      <p className="text-xs text-text-muted">{sub}</p>
    </div>
  );
}

// ─── Calculadora ─────────────────────────────────────────────

export function Calculator({ printers, filaments, clients, settings, plan, isFirstSubscriber, quoteId, initialData }: CalculatorProps) {
  const isEditing = !!quoteId;

  const [pending, startTransition] = useTransition();
  const [upgradeOpen, setUpgradeOpen]         = useState(false);
  const [upgradeLimitKey, setUpgradeLimitKey] = useState<LimitKey>("quotesPerMonth");

  // Dados da peça
  const [pieceName, setPieceName]     = useState(initialData?.pieceName     ?? "");
  const [description, setDescription] = useState(initialData?.description   ?? "");
  const [clientId, setClientId]       = useState(initialData?.clientId      ?? "");

  // Impressão
  const [printerId, setPrinterId]     = useState(initialData?.printerId  ?? printers[0]?.id  ?? "");
  const [filamentId, setFilamentId]   = useState(initialData?.filamentId ?? filaments[0]?.id ?? "");
  const [filamentGrams, setFilamentGrams] = useState<number>(initialData?.filamentGrams ?? 50);
  const [printHours, setPrintHours]   = useState<number>(initialData?.printHours ?? 3);

  // Precificação
  const [profitMargin, setProfitMargin]   = useState(initialData?.profitMargin  ?? settings.defaultProfitMargin);
  const [paintingHours, setPaintingHours] = useState(initialData?.paintingHours ?? 0);
  const [expirationDays, setExpirationDays] = useState(initialData?.expirationDays ?? settings.quoteExpirationDays);

  // Versões
  const [versions, setVersions] = useState<QuoteVersion[]>(
    initialData?.versions.map((v) => ({ id: crypto.randomUUID(), label: v.label, paintingHours: v.paintingHours, profitMargin: v.profitMargin, breakdown: null })) ?? []
  );

  // Clientes (pode crescer com criação inline)
  const [localClients, setLocalClients] = useState<ClientOption[]>(clients);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientWpp, setNewClientWpp]   = useState("");
  const [creatingClient, setCreatingClient] = useState(false);

  const printer  = printers.find((p) => p.id === printerId)  ?? printers[0];
  const filament = filaments.find((f) => f.id === filamentId) ?? filaments[0];

  const breakdown = useMemo(() => {
    if (!printer || !filament) return null;
    return calculateQuote({
      filamentGrams, printHours, profitMargin, paintingHours,
      filamentCostPerKg:         filament.costPerKg,
      printerPowerWatts:         printer.powerWatts,
      printerPurchasePrice:      printer.purchasePrice,
      printerEstimatedHours:     printer.estimatedHours,
      printerMonthlyMaintenance: printer.monthlyMaintenance,
      energyCostKwh:             settings.energyCostKwh,
      paintingHourlyRate:        settings.paintingHourlyRate,
    });
  }, [filamentGrams, printHours, profitMargin, paintingHours, filament, printer, settings]);

  const expirationDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + expirationDays);
    return d.toLocaleDateString("pt-BR");
  }, [expirationDays]);

  const printerCostPerHour = printer
    ? printer.purchasePrice / printer.estimatedHours + printer.monthlyMaintenance / 730
    : 0;

  function addVersion() {
    setVersions((vs) => [...vs, { id: crypto.randomUUID(), label: `Versão ${vs.length + 2}`, paintingHours: 0, profitMargin, breakdown: null }]);
  }

  function updateVersion(id: string, patch: Partial<QuoteVersion>) {
    setVersions((vs) => vs.map((v) => {
      if (v.id !== id) return v;
      const updated = { ...v, ...patch };
      if (printer && filament) {
        updated.breakdown = calculateQuote({
          filamentGrams, printHours,
          profitMargin:  updated.profitMargin,
          paintingHours: updated.paintingHours,
          filamentCostPerKg:         filament.costPerKg,
          printerPowerWatts:         printer.powerWatts,
          printerPurchasePrice:      printer.purchasePrice,
          printerEstimatedHours:     printer.estimatedHours,
          printerMonthlyMaintenance: printer.monthlyMaintenance,
          energyCostKwh:             settings.energyCostKwh,
          paintingHourlyRate:        settings.paintingHourlyRate,
        });
      }
      return updated;
    }));
  }

  async function handleCreateClient() {
    if (!newClientName.trim()) return;
    setCreatingClient(true);
    const res = await createClientQuick(newClientName, newClientWpp);
    if (res.ok && res.client) {
      setLocalClients((prev) => [...prev, res.client!]);
      setClientId(res.client.id);
      setShowNewClient(false);
      setNewClientName("");
      setNewClientWpp("");
    }
    setCreatingClient(false);
  }

  function handleSubmit(status: "DRAFT" | "SENT") {
    const fd = new FormData();
    fd.append("pieceName",      pieceName);
    fd.append("description",    description);
    fd.append("clientId",       clientId);
    fd.append("printerId",      printerId);
    fd.append("filamentId",     filamentId);
    fd.append("filamentGrams",  String(filamentGrams));
    fd.append("printHours",     String(printHours));
    fd.append("profitMargin",   String(profitMargin));
    fd.append("paintingHours",  String(paintingHours));
    fd.append("expirationDays", String(expirationDays));
    if (versions.length > 0) {
      fd.append("versions", JSON.stringify(versions.map((v) => ({
        label:         v.label,
        paintingHours: v.paintingHours,
        profitMargin:  v.profitMargin,
      }))));
    }
    startTransition(async () => {
      if (isEditing && quoteId) {
        await updateQuote(quoteId, fd);
        return;
      }
      const res = await createQuote(fd);
      if (res?.error === "LIMIT_EXCEEDED") {
        setUpgradeLimitKey(res.key as LimitKey);
        setUpgradeOpen(true);
      }
    });
  }

  // Sem impressoras ou filamentos cadastrados
  if (printers.length === 0 || filaments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <PrinterIcon className="mb-4 h-12 w-12 text-text-muted" />
        <h2 className="font-display text-xl font-bold text-text-primary">Configure antes de orçar</h2>
        <p className="mt-2 text-sm text-text-secondary max-w-sm">
          Você precisa ter pelo menos uma <strong>impressora</strong> e um <strong>filamento</strong> cadastrados para usar a calculadora.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/impressoras" className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-secondary hover:border-primary/50 hover:text-primary transition-colors">
            Cadastrar impressora
          </Link>
          <Link href="/estoque" className="rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white">
            Cadastrar filamento
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="mx-auto max-w-6xl">
      {/* Topbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={isEditing ? `/orcamentos/${quoteId}` : "/orcamentos"}
            className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft className="h-4 w-4" /> {isEditing ? "Voltar" : "Orçamentos"}
          </Link>
          <span className="text-text-muted">/</span>
          <span className="text-sm font-medium text-text-primary">
            {isEditing ? "Editar Orçamento" : "Novo Orçamento"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button onClick={() => handleSubmit("DRAFT")} disabled={pending || !pieceName}
              className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary/50 hover:text-text-primary disabled:opacity-50">
              <Save className="h-4 w-4" /> Salvar rascunho
            </button>
          )}
          <button onClick={() => handleSubmit(isEditing ? "DRAFT" : "SENT")} disabled={pending || !pieceName || !breakdown}
            className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
            {pending
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : isEditing
                ? <><Save className="h-4 w-4" /> Salvar alterações</>
                : <><Send className="h-4 w-4" /> Gerar link</>}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          {/* Dados da peça */}
          <Section title="Dados da Peça" icon={Package}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome da peça" className="sm:col-span-2">
                <input type="text" placeholder="Ex: Suporte para monitor" value={pieceName}
                  onChange={(e) => setPieceName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Cliente" tip="Opcional — vincula o orçamento a um cliente cadastrado.">
                <div className="flex gap-2">
                  <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={selectCls}>
                    <option value="">Sem cliente</option>
                    {localClients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowNewClient((v) => !v)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-background text-text-muted transition-colors hover:border-primary hover:text-primary"
                    title="Novo cliente"
                  >
                    {showNewClient ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  </button>
                </div>
                {showNewClient && (
                  <div className="mt-2 rounded-lg border border-primary/20 bg-primary-subtle p-3 animate-fade-in">
                    <p className="mb-2 text-xs font-semibold text-text-primary">Novo cliente</p>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Nome *"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className={inputCls}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateClient()}
                        autoFocus
                      />
                      <input
                        type="text"
                        placeholder="WhatsApp (opcional)"
                        value={newClientWpp}
                        onChange={(e) => setNewClientWpp(e.target.value)}
                        className={inputCls}
                        onKeyDown={(e) => e.key === "Enter" && handleCreateClient()}
                      />
                      <button
                        type="button"
                        onClick={handleCreateClient}
                        disabled={!newClientName.trim() || creatingClient}
                        className="flex items-center justify-center gap-2 rounded-lg gradient-primary py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {creatingClient ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {creatingClient ? "Criando..." : "Criar e selecionar"}
                      </button>
                    </div>
                  </div>
                )}
              </Field>
              <Field label="Descrição / Observações">
                <textarea placeholder="Cor, material, acabamento..." value={description}
                  onChange={(e) => setDescription(e.target.value)} rows={2}
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 w-full resize-none" />
              </Field>
            </div>
          </Section>

          {/* Configurações de impressão */}
          <Section title="Configurações de Impressão" icon={PrinterIcon}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Impressora" tip="Custo/hora calculado com base no preço de compra, vida útil e manutenção.">
                <select value={printerId} onChange={(e) => setPrinterId(e.target.value)} className={selectCls}>
                  {printers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {printer && <p className="text-xs text-text-muted mt-1">{formatBRL(printerCostPerHour)}/hora · {printer.powerWatts}W</p>}
              </Field>
              <Field label="Filamento" tip="Custo calculado por grama com base no preço por kg cadastrado.">
                <select value={filamentId} onChange={(e) => setFilamentId(e.target.value)} className={selectCls}>
                  {filaments.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.currentGrams}g restantes)
                    </option>
                  ))}
                </select>
                {filament && <p className="text-xs text-text-muted mt-1">{formatBRL(filament.costPerKg / 1000)}/g</p>}
              </Field>
              <Field label="Peso do filamento (g)" tip="Gramas que a peça vai consumir — veja no slicer (Bambu Studio, Cura, etc.).">
                <div className="relative">
                  <input type="number" min={0} step={1} value={filamentGrams}
                    onChange={(e) => setFilamentGrams(Number(e.target.value))} className={inputCls} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">g</span>
                </div>
              </Field>
              <Field label="Tempo de impressão (h)" tip="Horas totais estimadas pelo slicer.">
                <div className="relative">
                  <input type="number" min={0} step={0.5} value={printHours}
                    onChange={(e) => setPrintHours(Number(e.target.value))} className={inputCls} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">h</span>
                </div>
              </Field>
            </div>
          </Section>

          {/* Precificação */}
          <Section title="Precificação" icon={TrendingUp}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Margem de lucro (%)" tip="Percentual de lucro sobre o custo de produção.">
                <div className="flex items-center gap-3">
                  <input type="range" min={0} max={200} step={5} value={profitMargin}
                    onChange={(e) => setProfitMargin(Number(e.target.value))}
                    className="flex-1 accent-primary" />
                  <div className="relative w-20">
                    <input type="number" min={0} max={500} value={profitMargin}
                      onChange={(e) => setProfitMargin(Number(e.target.value))} className={inputCls} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
                  </div>
                </div>
              </Field>
              <Field label="Horas de pintura / pós-prod."
                tip={`Taxa hora: ${formatBRL(settings.paintingHourlyRate)}/h (configurável em Configurações → Custos).`}>
                <div className="relative">
                  <input type="number" min={0} step={0.5} value={paintingHours}
                    onChange={(e) => setPaintingHours(Number(e.target.value))} className={inputCls} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">h</span>
                </div>
              </Field>
            </div>
          </Section>

          {/* Validade */}
          <Section title="Validade do Orçamento" icon={Calendar}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prazo de validade" tip="Após esse prazo, o link público expira e o cliente não consegue mais aprovar.">
                <div className="flex items-center gap-3">
                  <input type="range" min={1} max={30} step={1} value={expirationDays}
                    onChange={(e) => setExpirationDays(Number(e.target.value))} className="flex-1 accent-primary" />
                  <div className="relative w-24">
                    <input type="number" min={1} max={30} value={expirationDays}
                      onChange={(e) => setExpirationDays(Number(e.target.value))} className={inputCls} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">dias</span>
                  </div>
                </div>
                <p className="text-xs text-text-muted">Expira em: <span className="font-medium text-text-secondary">{expirationDate}</span></p>
              </Field>
            </div>
          </Section>

          {/* Versões */}
          <Section title="Versões do Orçamento" icon={Copy}>
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-info/20 bg-info-subtle px-4 py-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
              <p className="text-xs text-text-secondary">Envie múltiplas opções para o cliente. Ele escolhe qual aprovar no link.</p>
            </div>
            <div className="mb-3 rounded-lg border border-primary/30 bg-primary-subtle p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-primary">Básico (principal)</span>
                <span className="text-sm font-bold text-text-primary">{breakdown ? formatBRL(breakdown.totalPrice) : "—"}</span>
              </div>
              <p className="text-xs text-text-muted">Margem {profitMargin}% · Sem pintura</p>
            </div>
            {versions.map((v) => (
              <div key={v.id} className="mb-3 rounded-lg border border-border bg-background p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <input type="text" value={v.label} onChange={(e) => updateVersion(v.id, { label: e.target.value })}
                    className="flex-1 rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm font-medium text-text-primary focus:border-primary focus:outline-none" />
                  <button onClick={() => setVersions((vs) => vs.filter((x) => x.id !== v.id))}
                    className="text-text-muted hover:text-error transition-colors"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Margem (%)">
                    <input type="number" min={0} value={v.profitMargin}
                      onChange={(e) => updateVersion(v.id, { profitMargin: Number(e.target.value) })} className={inputCls} />
                  </Field>
                  <Field label="Pintura (h)">
                    <input type="number" min={0} step={0.5} value={v.paintingHours}
                      onChange={(e) => updateVersion(v.id, { paintingHours: Number(e.target.value) })} className={inputCls} />
                  </Field>
                </div>
                {v.breakdown && <p className="mt-2 text-right text-sm font-bold text-text-primary">{formatBRL(v.breakdown.totalPrice)}</p>}
              </div>
            ))}
            <button onClick={addVersion}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary hover:text-primary">
              <Plus className="h-4 w-4" /> Adicionar versão
            </button>
          </Section>
        </div>

        {/* Painel de preço */}
        <div className="xl:sticky xl:top-6 xl:self-start flex flex-col gap-4">
          <div className="rounded-xl border border-primary/20 bg-surface">
            <div className="border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <CalcIcon className="h-4 w-4 text-primary" />
                <h2 className="font-display text-sm font-semibold text-text-primary">Resumo do Cálculo</h2>
              </div>
              {pieceName && <p className="mt-1 text-xs text-text-muted truncate">{pieceName}</p>}
            </div>
            <div className="p-5">
              {breakdown ? (
                <>
                  <div className="flex flex-col gap-2.5">
                    <CostRow label="Filamento" value={breakdown.filamentCost}
                      sub={`${filamentGrams}g × ${formatBRL((filament?.costPerKg ?? 0) / 1000)}/g`} />
                    <CostRow label="Energia elétrica" value={breakdown.energyCost}
                      sub={`${printHours}h × ${printer?.powerWatts}W × R$${settings.energyCostKwh}/kWh`} />
                    <CostRow label="Desgaste impressora" value={breakdown.printerCost}
                      sub={`${formatBRL(printerCostPerHour)}/h × ${printHours}h`} />
                    <div className="my-1 border-t border-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Custo de produção</span>
                      <span className="text-sm font-semibold text-text-primary">{formatBRL(breakdown.productionCost)}</span>
                    </div>
                    <CostRow label={`Lucro (${profitMargin}%)`} value={breakdown.profitAmount} highlight />
                    {paintingHours > 0 && (
                      <CostRow label={`Pintura (${paintingHours}h)`} value={breakdown.paintingCost}
                        sub={`${formatBRL(settings.paintingHourlyRate)}/h`} />
                    )}
                  </div>
                  <div className="mt-5 rounded-lg gradient-primary p-4 text-center shadow-glow">
                    <p className="text-xs font-medium text-white/70">Total do Orçamento</p>
                    <p className="mt-1 font-display text-3xl font-bold text-white">{formatBRL(breakdown.totalPrice)}</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <MetricBox label="Custo real" value={formatBRL(breakdown.productionCost)} sub="quanto você gasta" />
                    <MetricBox label="Seu lucro" value={formatBRL(breakdown.profitAmount + breakdown.paintingCost)} sub="quanto você ganha" highlight />
                  </div>
                </>
              ) : (
                <p className="text-center text-sm text-text-muted py-8">Preencha os dados de impressão para ver o cálculo.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-text-muted" />
                <span className="text-sm text-text-secondary">Expira em</span>
              </div>
              <span className="text-sm font-semibold text-text-primary">{expirationDate}</span>
            </div>
            <p className="mt-1 text-xs text-text-muted">{expirationDays} dias após o envio</p>
          </div>

          <div className="flex flex-col gap-2">
            <button onClick={() => handleSubmit(isEditing ? "DRAFT" : "SENT")} disabled={pending || !pieceName || !breakdown}
              className="flex items-center justify-center gap-2 rounded-lg gradient-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {pending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : isEditing
                  ? <><Save className="h-4 w-4" /> Salvar alterações</>
                  : <><Send className="h-4 w-4" /> Gerar link de aprovação</>}
            </button>
            {!isEditing && (
              <button onClick={() => handleSubmit("DRAFT")} disabled={pending || !pieceName}
                className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface py-2.5 text-sm font-medium text-text-secondary transition-colors hover:border-primary/50 hover:text-text-primary disabled:opacity-50">
                <Save className="h-4 w-4" /> Salvar como rascunho
              </button>
            )}
          </div>
        </div>
      </div>
    </div>

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
