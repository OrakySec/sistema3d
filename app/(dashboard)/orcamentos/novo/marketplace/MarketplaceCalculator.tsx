"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Calculator as CalcIcon, Package, Printer as PrinterIcon,
  TrendingUp, Store, Loader2, BookOpen,
} from "lucide-react";
import { calculateQuote, formatBRL } from "@/lib/calculations";
import { InfoTip } from "@/components/shared/InfoTip";
import { MARKETPLACE_PLATFORMS } from "@/lib/marketplace";
import { publishToCatalog } from "@/lib/actions/catalog";

interface PrinterOption {
  id: string; name: string; powerWatts: number;
  purchasePrice: number; estimatedHours: number; monthlyMaintenance: number;
}
interface FilamentOption {
  id: string; name: string; costPerKg: number; colorHex?: string | null;
  type: string; currentGrams: number;
}
interface Settings { energyCostKwh: number; defaultProfitMargin: number; paintingHourlyRate: number; }

interface MarketplaceCalculatorProps {
  printers: PrinterOption[];
  filaments: FilamentOption[];
  settings: Settings;
}

const inputCls = "h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 w-full";
const selectCls = "h-10 rounded-lg border border-border bg-background px-3 text-sm text-text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 w-full";

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
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

function Field({ label, tip, children, className }: { label: string; tip?: string; children: React.ReactNode; className?: string }) {
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

function CostRow({ label, value, sub, highlight }: { label: string; value: number; sub?: string; highlight?: boolean }) {
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

export function MarketplaceCalculator({ printers, filaments, settings }: MarketplaceCalculatorProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Dados da peça
  const [pieceName, setPieceName]     = useState("");
  const [description, setDescription] = useState("");

  // Impressão
  const [printerId, setPrinterId]       = useState(printers[0]?.id ?? "");
  const [filamentId, setFilamentId]     = useState(filaments[0]?.id ?? "");
  const [filamentGrams, setFilamentGrams] = useState(50);
  const [printHours, setPrintHours]     = useState(3);
  const [paintingHours, setPaintingHours] = useState(0);

  // Custos adicionais
  const [packagingCost, setPackagingCost] = useState(0);

  // Marketplace
  const [platform, setPlatform]       = useState(MARKETPLACE_PLATFORMS[0].value);
  const [platformFee, setPlatformFee] = useState(MARKETPLACE_PLATFORMS[0].fee);
  const [quantity, setQuantity]       = useState(1);

  // Modo de precificação
  const [priceMode, setPriceMode]     = useState<"margin" | "price">("margin");
  const [margin, setMargin]           = useState(settings.defaultProfitMargin);
  const [targetPrice, setTargetPrice] = useState(0);

  const printer  = printers.find((p) => p.id === printerId)  ?? printers[0];
  const filament = filaments.find((f) => f.id === filamentId) ?? filaments[0];

  const printerCostPerHour = printer
    ? printer.purchasePrice / printer.estimatedHours + printer.monthlyMaintenance / 730
    : 0;

  // Breakdown base (sem margem) para derivar produção
  const baseBreakdown = useMemo(() => {
    if (!printer || !filament) return null;
    return calculateQuote({
      filamentGrams, printHours, profitMargin: 0, paintingHours,
      filamentCostPerKg: filament.costPerKg, printerPowerWatts: printer.powerWatts,
      printerPurchasePrice: printer.purchasePrice, printerEstimatedHours: printer.estimatedHours,
      printerMonthlyMaintenance: printer.monthlyMaintenance,
      energyCostKwh: settings.energyCostKwh, paintingHourlyRate: settings.paintingHourlyRate,
    });
  }, [filamentGrams, printHours, paintingHours, filament, printer, settings]);

  // Preço sugerido / margem efetiva
  const { suggestedPrice, effectiveMargin } = useMemo(() => {
    if (!baseBreakdown) return { suggestedPrice: 0, effectiveMargin: 0 };
    const { productionCost, paintingCost } = baseBreakdown;
    const totalCost = productionCost + paintingCost + packagingCost;
    if (priceMode === "margin") {
      // Preço que garante a margem após descontar a taxa da plataforma
      const price = totalCost * (1 + margin / 100) / (1 - platformFee / 100);
      return { suggestedPrice: price, effectiveMargin: margin };
    } else {
      const netAfterFee = targetPrice * (1 - platformFee / 100);
      const em = totalCost > 0 ? ((netAfterFee - totalCost) / totalCost) * 100 : 0;
      return { suggestedPrice: targetPrice, effectiveMargin: Math.max(0, em) };
    }
  }, [baseBreakdown, priceMode, margin, targetPrice, platformFee, packagingCost]);

  const totalCostPerUnit    = (baseBreakdown?.productionCost ?? 0) + (baseBreakdown?.paintingCost ?? 0) + packagingCost;
  const platformFeeAmount   = suggestedPrice * (platformFee / 100);
  const netRevenue          = suggestedPrice - platformFeeAmount;
  const profitPerUnit       = netRevenue - totalCostPerUnit;
  const batchProfit         = profitPerUnit * quantity;

  function handlePlatformChange(val: string) {
    setPlatform(val);
    const found = MARKETPLACE_PLATFORMS.find((p) => p.value === val);
    if (found) setPlatformFee(found.fee);
  }

  function handlePublish() {
    if (!pieceName.trim() || !baseBreakdown) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("name",              pieceName);
      fd.append("description",       description);
      fd.append("productionCost",    String(baseBreakdown.productionCost));
      fd.append("filamentCost",      String(baseBreakdown.filamentCost));
      fd.append("energyCost",        String(baseBreakdown.energyCost));
      fd.append("printerCost",       String(baseBreakdown.printerCost));
      fd.append("paintingCost",      String(baseBreakdown.paintingCost + packagingCost));
      fd.append("filamentGrams",     String(filamentGrams));
      fd.append("printHours",        String(printHours));
      fd.append("printerId",         printerId);
      fd.append("filamentId",        filamentId);
      fd.append("platform",          platform);
      fd.append("platformFee",       String(platformFee));
      fd.append("marketplacePrice",  String(suggestedPrice));
      fd.append("marketplaceMargin", String(effectiveMargin));
      fd.append("quantity",          String(quantity));
      const result = await publishToCatalog(fd);
      if (result?.ok) router.push("/portfolio");
    });
  }

  if (printers.length === 0 || filaments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <PrinterIcon className="mb-4 h-12 w-12 text-text-muted" />
        <h2 className="font-display text-xl font-bold text-text-primary">Configure antes de calcular</h2>
        <p className="mt-2 text-sm text-text-secondary max-w-sm">
          Você precisa ter pelo menos uma impressora e um filamento cadastrados.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Topbar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/orcamentos" className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
            <ChevronLeft className="h-4 w-4" /> Orçamentos
          </Link>
          <span className="text-text-muted">/</span>
          <span className="text-sm font-medium text-text-primary flex items-center gap-1.5">
            <Store className="h-4 w-4 text-primary" /> Calculadora Marketplace
          </span>
        </div>
        <button
          onClick={handlePublish}
          disabled={pending || !pieceName.trim() || !baseBreakdown}
          className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><BookOpen className="h-4 w-4" /> Publicar no Catálogo</>}
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          {/* Dados da peça */}
          <Section title="Dados da Peça" icon={Package}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome do produto" className="sm:col-span-2">
                <input type="text" placeholder="Ex: Suporte para monitor" value={pieceName}
                  onChange={(e) => setPieceName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Descrição" className="sm:col-span-2">
                <textarea placeholder="Material, acabamento, variações..." value={description}
                  onChange={(e) => setDescription(e.target.value)} rows={2}
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 w-full resize-none" />
              </Field>
            </div>
          </Section>

          {/* Impressão */}
          <Section title="Configurações de Impressão" icon={PrinterIcon}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Impressora">
                <select value={printerId} onChange={(e) => setPrinterId(e.target.value)} className={selectCls}>
                  {printers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                {printer && <p className="text-xs text-text-muted mt-1">{formatBRL(printerCostPerHour)}/hora · {printer.powerWatts}W</p>}
              </Field>
              <Field label="Filamento">
                <select value={filamentId} onChange={(e) => setFilamentId(e.target.value)} className={selectCls}>
                  {filaments.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.currentGrams}g)</option>)}
                </select>
                {filament && <p className="text-xs text-text-muted mt-1">{formatBRL(filament.costPerKg / 1000)}/g</p>}
              </Field>
              <Field label="Peso do filamento (g)" tip="Gramas que a peça vai consumir.">
                <div className="relative">
                  <input type="number" min={0} step={1} value={filamentGrams}
                    onChange={(e) => setFilamentGrams(Number(e.target.value))} className={inputCls} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">g</span>
                </div>
              </Field>
              <Field label="Tempo de impressão (h)">
                <div className="relative">
                  <input type="number" min={0} step={0.5} value={printHours}
                    onChange={(e) => setPrintHours(Number(e.target.value))} className={inputCls} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">h</span>
                </div>
              </Field>
              <Field label="Horas de pintura / pós-prod." tip={`Taxa hora: ${formatBRL(settings.paintingHourlyRate)}/h`}>
                <div className="relative">
                  <input type="number" min={0} step={0.5} value={paintingHours}
                    onChange={(e) => setPaintingHours(Number(e.target.value))} className={inputCls} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">h</span>
                </div>
              </Field>
              <Field label="Embalagem (R$)" tip="Custo de caixa, plástico bolha, fita, etc. por unidade.">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
                  <input type="number" min={0} step={0.01} value={packagingCost}
                    onChange={(e) => setPackagingCost(Number(e.target.value))} className={`${inputCls} pl-8`} />
                </div>
              </Field>
            </div>
          </Section>

          {/* Marketplace */}
          <Section title="Plataforma & Precificação" icon={Store}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Plataforma">
                <select value={platform} onChange={(e) => handlePlatformChange(e.target.value)} className={selectCls}>
                  {MARKETPLACE_PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </Field>
              <Field label="Taxa da plataforma (%)" tip="Percentual cobrado pela plataforma sobre o valor vendido.">
                <div className="relative">
                  <input type="number" min={0} max={50} step={0.5} value={platformFee}
                    onChange={(e) => setPlatformFee(Number(e.target.value))} className={inputCls} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
                </div>
              </Field>
              <Field label="Quantidade (unidades)" tip="Quantas unidades pretende produzir/anunciar.">
                <input type="number" min={1} step={1} value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))} className={inputCls} />
              </Field>

              {/* Toggle modo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text-primary">Modo de precificação</label>
                <div className="flex gap-1 rounded-lg border border-border bg-background p-1">
                  {(["margin", "price"] as const).map((mode) => (
                    <button key={mode} type="button"
                      onClick={() => {
                        if (mode === "price" && baseBreakdown) setTargetPrice(Number(suggestedPrice.toFixed(2)));
                        if (mode === "margin") setMargin(Math.max(0, Math.round(effectiveMargin)));
                        setPriceMode(mode);
                      }}
                      className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors ${priceMode === mode ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"}`}
                    >
                      {mode === "margin" ? "Por margem" : "Por preço"}
                    </button>
                  ))}
                </div>
              </div>

              {priceMode === "margin" ? (
                <Field label="Margem desejada (%)" tip="Margem sobre o custo de produção. O preço sugerido já considera a taxa da plataforma.">
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={200} step={5} value={margin}
                      onChange={(e) => setMargin(Number(e.target.value))}
                      className="slider flex-1"
                      style={{ background: `linear-gradient(to right, #F97316 0%, #EF4444 ${Math.min(margin / 2, 100)}%, var(--color-border) ${Math.min(margin / 2, 100)}%)` }}
                    />
                    <div className="relative w-20">
                      <input type="number" min={0} max={500} value={margin}
                        onChange={(e) => setMargin(Number(e.target.value))} className={inputCls} />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">%</span>
                    </div>
                  </div>
                </Field>
              ) : (
                <Field label="Preço de venda (R$)" tip="O sistema calcula a margem real após a taxa da plataforma.">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
                    <input type="number" min={0} step={0.01} value={targetPrice}
                      onChange={(e) => setTargetPrice(Number(e.target.value))} className={`${inputCls} pl-8`} />
                  </div>
                  {baseBreakdown && targetPrice > 0 && (
                    <p className="text-xs text-text-muted mt-1">
                      Margem real após taxa: <span className={`font-semibold ${effectiveMargin >= 0 ? "text-success" : "text-error"}`}>{effectiveMargin.toFixed(1)}%</span>
                    </p>
                  )}
                </Field>
              )}
            </div>
          </Section>
        </div>

        {/* Painel de preço */}
        <div className="xl:sticky xl:top-6 xl:self-start flex flex-col gap-4">
          <div className="rounded-xl border border-primary/20 bg-surface">
            <div className="border-b border-border px-5 py-4 flex items-center gap-2">
              <CalcIcon className="h-4 w-4 text-primary" />
              <h2 className="font-display text-sm font-semibold text-text-primary">Resumo</h2>
              {pieceName && <p className="ml-auto text-xs text-text-muted truncate max-w-28">{pieceName}</p>}
            </div>
            <div className="p-5">
              {baseBreakdown ? (
                <>
                  <div className="flex flex-col gap-2.5">
                    <CostRow label="Filamento" value={baseBreakdown.filamentCost}
                      sub={`${filamentGrams}g × ${formatBRL((filament?.costPerKg ?? 0) / 1000)}/g`} />
                    <CostRow label="Energia elétrica" value={baseBreakdown.energyCost} />
                    <CostRow label="Desgaste impressora" value={baseBreakdown.printerCost} />
                    {paintingHours > 0 && <CostRow label={`Pintura (${paintingHours}h)`} value={baseBreakdown.paintingCost} />}
                    {packagingCost > 0 && <CostRow label="Embalagem" value={packagingCost} />}
                    <div className="my-1 border-t border-border" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Custo total/un.</span>
                      <span className="text-sm font-semibold text-text-primary">{formatBRL(totalCostPerUnit)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Taxa {platformFee}%</span>
                      <span className="text-sm font-semibold text-error">-{formatBRL(platformFeeAmount)}</span>
                    </div>
                    <CostRow label={`Seu lucro/un. (${effectiveMargin.toFixed(1)}%)`} value={profitPerUnit} highlight />
                  </div>

                  <div className="mt-5 rounded-lg gradient-primary p-4 text-center shadow-glow">
                    <p className="text-xs font-medium text-white/70">Preço sugerido por unidade</p>
                    <p className="mt-1 font-display text-3xl font-bold text-white">{formatBRL(suggestedPrice)}</p>
                  </div>

                  {quantity > 1 && (
                    <div className="mt-3 rounded-lg border border-success/20 bg-success-subtle p-3 text-center">
                      <p className="text-xs text-text-muted">Lucro total ({quantity} unidades)</p>
                      <p className="font-display text-xl font-bold text-success">{formatBRL(batchProfit)}</p>
                    </div>
                  )}

                  <div className="mt-4 rounded-lg border border-border bg-background p-3">
                    <p className="text-xs text-text-muted mb-2">Receita após taxa</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">Venda: {formatBRL(suggestedPrice)}</span>
                      <span className="text-xs text-text-secondary">-{formatBRL(platformFeeAmount)} ({platformFee}%)</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-primary">Recebe líquido</span>
                      <span className="text-xs font-bold text-success">{formatBRL(netRevenue)}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-center text-sm text-text-muted py-8">Preencha os dados de impressão para ver o cálculo.</p>
              )}
            </div>
          </div>

          <button
            onClick={handlePublish}
            disabled={pending || !pieceName.trim() || !baseBreakdown}
            className="flex items-center justify-center gap-2 rounded-lg gradient-primary py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><BookOpen className="h-4 w-4" /> Publicar no Catálogo</>}
          </button>
        </div>
      </div>
    </div>
  );
}
