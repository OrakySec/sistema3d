"use client";

import { useState, useMemo, useTransition } from "react";
import {
  DollarSign, TrendingUp, TrendingDown, Wallet,
  Plus, ArrowUpRight, ArrowDownRight,
  Receipt, Pencil, Trash2,
} from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RevenueChart }      from "@/components/financeiro/RevenueChart";
import { ExpensesPieChart }  from "@/components/financeiro/ExpensesPieChart";
import { ProfitAreaChart }   from "@/components/financeiro/ProfitAreaChart";
import { CrudDialog, FormField, DialogActions, inputCls, selectCls } from "@/components/shared/CrudDialog";
import { createExpense, updateExpense, deleteExpense } from "@/lib/actions/expenses";

// ─── Enums ───────────────────────────────────────────────────

const EXPENSE_CATEGORIES = [
  { value: "FILAMENT",       label: "Filamento",         color: "#F97316" },
  { value: "PRINTER_PARTS",  label: "Peças Impressora",  color: "#3B82F6" },
  { value: "ENERGY",         label: "Energia",           color: "#EAB308" },
  { value: "MARKETING",      label: "Marketing",         color: "#A855F7" },
  { value: "TOOLS",          label: "Ferramentas",       color: "#14B8A6" },
  { value: "PACKAGING",      label: "Embalagem",         color: "#F43F5E" },
  { value: "SHIPPING",       label: "Frete",             color: "#6366F1" },
  { value: "OTHER",          label: "Outros",            color: "#6B7280" },
] as const;

type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]["value"];

// ─── Schema ───────────────────────────────────────────────────

const expenseSchema = z.object({
  description: z.string().min(2, "Descrição obrigatória"),
  category:    z.enum(EXPENSE_CATEGORIES.map((c) => c.value) as [ExpenseCategory, ...ExpenseCategory[]]),
  amount:      z.coerce.number().positive("Valor obrigatório"),
  date:        z.string().min(1, "Data obrigatória"),
  notes:       z.string().optional(),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

// ─── Interfaces ──────────────────────────────────────────────

interface Expense {
  id: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  notes?: string;
}

interface Revenue {
  id: string;
  description: string;
  grossAmount: number;
  productionCost: number;
  netProfit: number;
  date: string;
}

interface MonthlyBucket { month: string; receita: number; despesas: number; lucro: number }
interface ProfitBucket  { month: string; lucro: number; margem: number }

interface FinanceiroClientProps {
  initialRevenues: Revenue[];
  initialExpenses: Expense[];
  monthlyData: MonthlyBucket[];
  profitData: ProfitBucket[];
}

// ─── Modal de despesa ─────────────────────────────────────────

function ExpenseDialog({ expense, onClose }: { expense?: Expense; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseForm>,
    defaultValues: expense
      ? { ...expense, date: expense.date.split("T")[0] }
      : { date: new Date().toISOString().split("T")[0], category: "FILAMENT" },
  });

  function onSubmit(data: ExpenseForm) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
    startTransition(async () => {
      if (expense) await updateExpense(expense.id, fd);
      else await createExpense(fd);
      onClose();
    });
  }

  return (
    <CrudDialog
      title={expense ? "Editar Despesa" : "Registrar Despesa"}
      subtitle="Registre gastos para acompanhar sua margem real"
      icon={Receipt}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Descrição" error={errors.description?.message} className="sm:col-span-2">
            <input {...register("description")} placeholder="Ex: PLA Branco Polymaker 3kg" className={inputCls} />
          </FormField>

          <FormField label="Categoria" error={errors.category?.message}>
            <select {...register("category")} className={selectCls}>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Valor (R$)" error={errors.amount?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
              <input
                {...register("amount")}
                type="number" min={0.01} step={0.01}
                placeholder="0,00"
                className={`${inputCls} pl-8`}
              />
            </div>
          </FormField>

          <FormField label="Data" error={errors.date?.message} className="sm:col-span-2">
            <input {...register("date")} type="date" className={inputCls} />
          </FormField>

          <FormField label="Observações" className="sm:col-span-2">
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="Detalhes adicionais..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </FormField>
        </div>
        <DialogActions onClose={onClose} loading={pending} submitLabel={expense ? "Salvar alterações" : "Registrar despesa"} />
      </form>
    </CrudDialog>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────

function MetricCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string; sub: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-medium text-text-secondary">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      <p className="font-display text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-0.5 text-xs text-text-muted">{sub}</p>
    </div>
  );
}

function ChartCard({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <h2 className="font-display text-sm font-semibold text-text-primary">{title}</h2>
        {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-center">
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────

type TabType = "visao-geral" | "receitas" | "despesas";

export function FinanceiroClient({ initialRevenues, initialExpenses, monthlyData, profitData }: FinanceiroClientProps) {
  const [tab, setTab]               = useState<TabType>("visao-geral");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing]       = useState<Expense | undefined>();
  const [filterCat, setFilterCat]   = useState<string>("ALL");
  const [, startTransition]         = useTransition();

  const now   = new Date();
  const monthRevenues = initialRevenues.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthExpenses = initialExpenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const metrics = useMemo(() => {
    const receita   = monthRevenues.reduce((a, r) => a + r.grossAmount, 0);
    const lucro     = monthRevenues.reduce((a, r) => a + r.netProfit, 0);
    const despTotal = monthExpenses.reduce((a, e) => a + e.amount, 0);
    const margem    = receita > 0 ? Math.round((lucro / receita) * 100) : 0;
    return { receita, lucro, despTotal, margem };
  }, [monthRevenues, monthExpenses]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    return EXPENSE_CATEGORIES
      .filter((c) => map.has(c.value))
      .map((c) => ({ name: c.label, value: map.get(c.value)!, color: c.color }));
  }, [monthExpenses]);

  const filteredExpenses = useMemo(
    () => filterCat === "ALL" ? initialExpenses : initialExpenses.filter((e) => e.category === filterCat),
    [initialExpenses, filterCat]
  );

  function handleDelete(id: string) {
    if (!confirm("Remover esta despesa?")) return;
    startTransition(() => deleteExpense(id));
  }

  function openEdit(e: Expense) { setEditing(e); setDialogOpen(true); }
  function openNew()             { setEditing(undefined); setDialogOpen(true); }
  function closeDialog()         { setDialogOpen(false); setEditing(undefined); }

  const catColor = (cat: ExpenseCategory) => EXPENSE_CATEGORIES.find((c) => c.value === cat)?.color ?? "#6B7280";
  const catLabel = (cat: ExpenseCategory) => EXPENSE_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Financeiro</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Registrar Despesa
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
        {(["visao-geral", "receitas", "despesas"] as TabType[]).map((t) => {
          const labels = { "visao-geral": "Visão Geral", receitas: "Receitas", despesas: "Despesas" };
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === t ? "bg-primary text-white" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {labels[t]}
            </button>
          );
        })}
      </div>

      {/* ─── Visão Geral ──────────────────────────────────── */}
      {tab === "visao-geral" && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              title="Receita Bruta" sub="este mês"
              value={metrics.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              icon={DollarSign} color="text-success bg-success-subtle"
            />
            <MetricCard
              title="Despesas Totais" sub="este mês"
              value={metrics.despTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              icon={ArrowDownRight} color="text-error bg-error-subtle"
            />
            <MetricCard
              title="Lucro Líquido" sub="após custos de produção"
              value={metrics.lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              icon={TrendingUp} color="text-primary bg-primary-subtle"
            />
            <MetricCard
              title="Margem de Lucro" sub="sobre a receita bruta"
              value={`${metrics.margem}%`}
              icon={Wallet} color="text-info bg-info-subtle"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
            <ChartCard title="Receita × Despesas × Lucro" sub="Últimos 6 meses">
              <RevenueChart data={monthlyData} />
            </ChartCard>

            <ChartCard title="Despesas por Categoria" sub="Este mês">
              {pieData.length > 0
                ? <ExpensesPieChart data={pieData} />
                : <EmptyState message="Nenhuma despesa registrada este mês." />}
            </ChartCard>

            <ChartCard title="Evolução do Lucro" sub="Últimos 6 meses">
              <ProfitAreaChart data={profitData} />
            </ChartCard>

            <ChartCard title="Últimas Receitas" sub="Mais recentes">
              {initialRevenues.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {initialRevenues.slice(0, 5).map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-hover px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text-primary truncate">{r.description}</p>
                        <p className="text-xs text-text-muted">{new Date(r.date).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-success">
                          +{r.grossAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <p className="text-xs text-text-muted">
                          lucro: {r.netProfit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="Nenhuma receita registrada ainda. Aprove um orçamento para começar." />
              )}
            </ChartCard>
          </div>
        </>
      )}

      {/* ─── Receitas ─────────────────────────────────────── */}
      {tab === "receitas" && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden">
          {initialRevenues.length > 0 ? (
            <>
              <div className="hidden grid-cols-[1fr_100px_100px_100px_90px] gap-4 border-b border-border px-5 py-3 text-xs font-medium text-text-muted sm:grid">
                <span>Descrição</span>
                <span className="text-right">Receita</span>
                <span className="text-right">Custo</span>
                <span className="text-right">Lucro</span>
                <span className="text-right">Data</span>
              </div>
              <div className="divide-y divide-border">
                {initialRevenues.map((r) => (
                  <div key={r.id} className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_100px_90px] items-center gap-4 px-5 py-3.5 hover:bg-surface-hover">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-subtle">
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      </div>
                      <p className="text-sm font-medium text-text-primary truncate">{r.description}</p>
                    </div>
                    <p className="text-sm font-semibold text-success sm:text-right">
                      {r.grossAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-sm text-error sm:text-right">
                      -{r.productionCost.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-sm font-semibold text-text-primary sm:text-right">
                      {r.netProfit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                    <p className="text-xs text-text-muted sm:text-right">
                      {new Date(r.date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-border px-5 py-4">
                <span className="text-sm font-medium text-text-secondary">Total ({now.toLocaleDateString("pt-BR", { month: "long" })})</span>
                <span className="font-display text-lg font-bold text-success">
                  {metrics.receita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
            </>
          ) : (
            <EmptyState message="Nenhuma receita ainda. Receitas são geradas automaticamente quando um orçamento é aprovado." />
          )}
        </div>
      )}

      {/* ─── Despesas ──────────────────────────────────────── */}
      {tab === "despesas" && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterCat("ALL")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                filterCat === "ALL" ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface text-text-secondary hover:border-primary/50"
              }`}
            >
              Todas
            </button>
            {EXPENSE_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setFilterCat(c.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterCat === c.value ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface text-text-secondary hover:border-primary/50"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="hidden grid-cols-[1fr_140px_100px_90px_72px] gap-4 border-b border-border px-5 py-3 text-xs font-medium text-text-muted sm:grid">
              <span>Descrição</span>
              <span>Categoria</span>
              <span className="text-right">Valor</span>
              <span className="text-right">Data</span>
              <span />
            </div>

            <div className="divide-y divide-border">
              {filteredExpenses.map((e) => (
                <div key={e.id} className="group grid grid-cols-1 sm:grid-cols-[1fr_140px_100px_90px_72px] items-center gap-4 px-5 py-3.5 hover:bg-surface-hover">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: catColor(e.category) + "20" }}>
                      <ArrowDownRight className="h-4 w-4" style={{ color: catColor(e.category) }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{e.description}</p>
                      {e.notes && <p className="text-xs text-text-muted truncate">{e.notes}</p>}
                    </div>
                  </div>
                  <span
                    className="hidden sm:inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                    style={{ borderColor: catColor(e.category) + "40", color: catColor(e.category), backgroundColor: catColor(e.category) + "15" }}
                  >
                    {catLabel(e.category)}
                  </span>
                  <p className="text-sm font-semibold text-error sm:text-right">
                    -{e.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-xs text-text-muted sm:text-right">
                    {new Date(e.date).toLocaleDateString("pt-BR")}
                  </p>
                  <div className="hidden sm:flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 justify-end">
                    <button onClick={() => openEdit(e)} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface hover:text-primary transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleDelete(e.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-error-subtle hover:text-error transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredExpenses.length === 0 && (
                <div className="px-5 py-16 text-center">
                  <p className="text-sm text-text-muted">Nenhuma despesa nessa categoria.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-5 py-4">
              <span className="text-sm font-medium text-text-secondary">
                Total {filterCat !== "ALL" && `(${catLabel(filterCat as ExpenseCategory)})`}
              </span>
              <span className="font-display text-lg font-bold text-error">
                -{filteredExpenses.reduce((a, e) => a + e.amount, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>
        </>
      )}

      {dialogOpen && <ExpenseDialog expense={editing} onClose={closeDialog} />}
    </>
  );
}
