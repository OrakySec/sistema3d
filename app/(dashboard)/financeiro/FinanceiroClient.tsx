"use client";

import { useState, useMemo, useTransition } from "react";
import {
  DollarSign, TrendingUp, Wallet,
  Plus, ArrowUpRight, ArrowDownRight,
  Receipt, Pencil, Trash2, ShoppingBag, Repeat,
  Settings, Check, X,
} from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RevenueChart }      from "@/components/financeiro/RevenueChart";
import { ExpensesPieChart }  from "@/components/financeiro/ExpensesPieChart";
import { ProfitAreaChart }   from "@/components/financeiro/ProfitAreaChart";
import { CrudDialog, FormField, DialogActions, inputCls, selectCls } from "@/components/shared/CrudDialog";
import { createExpense, updateExpense, deleteExpense } from "@/lib/actions/expenses";
import { createRevenue, deleteRevenue } from "@/lib/actions/revenues";
import { createCategory, updateCategory, deleteCategory } from "@/lib/actions/expense-categories";
import { CATEGORY_COLOR_PALETTE } from "@/lib/expense-categories";

// ─── Categorias ──────────────────────────────────────────────

interface CategoryDef { key: string; label: string; color: string; order: number; isDefault: boolean; id?: string }

// ─── Schema ───────────────────────────────────────────────────

const expenseSchema = z.object({
  description:    z.string().min(2, "Descrição obrigatória"),
  category:       z.string().min(1, "Categoria obrigatória"),
  customCategory: z.string().optional(),
  amount:         z.coerce.number().positive("Valor obrigatório"),
  date:           z.string().min(1, "Data obrigatória"),
  notes:          z.string().optional(),
  isRecurring:    z.boolean().optional(),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

// ─── Interfaces ──────────────────────────────────────────────

interface Expense {
  id: string;
  description: string;
  category: string;
  customCategory?: string;
  amount: number;
  date: string;
  notes?: string;
  isRecurring: boolean;
}

interface Revenue {
  id: string;
  description: string;
  grossAmount: number;
  productionCost: number;
  netProfit: number;
  date: string;
  notes?: string;
}

interface MonthlyBucket { month: string; receita: number; despesas: number; lucro: number }
interface ProfitBucket  { month: string; lucro: number; margem: number }

interface FinanceiroClientProps {
  initialRevenues: Revenue[];
  initialExpenses: Expense[];
  monthlyData: MonthlyBucket[];
  profitData: ProfitBucket[];
  categories: CategoryDef[];
}

// ─── Modal de despesa ─────────────────────────────────────────

function ExpenseDialog({ expense, categories, onClose }: { expense?: Expense; categories: CategoryDef[]; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema) as Resolver<ExpenseForm>,
    defaultValues: expense
      ? { ...expense, date: expense.date.split("T")[0] }
      : { date: new Date().toISOString().split("T")[0], category: categories[0]?.key ?? "OTHER", isRecurring: false },
  });

  const selectedCategory = watch("category");

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
              {categories.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
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

          {selectedCategory === "OTHER" && (
            <FormField label="Nome da categoria" error={errors.customCategory?.message} className="sm:col-span-2">
              <input
                {...register("customCategory")}
                placeholder="Ex: Curso, Software, Aluguel..."
                className={inputCls}
              />
            </FormField>
          )}

          <FormField label="Data" error={errors.date?.message}>
            <input {...register("date")} type="date" className={inputCls} />
          </FormField>

          <FormField label="Recorrência">
            <label className="flex h-[42px] items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-text-primary cursor-pointer">
              <input {...register("isRecurring")} type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
              <span className="flex items-center gap-1.5">
                <Repeat className="h-3.5 w-3.5 text-text-muted" />
                Despesa recorrente
              </span>
            </label>
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

// ─── Modal de venda ───────────────────────────────────────────

const revenueSchema = z.object({
  description:    z.string().min(2, "Descrição obrigatória"),
  grossAmount:    z.coerce.number().positive("Valor obrigatório"),
  productionCost: z.coerce.number().min(0, "Informe o custo (0 se não houver)"),
  date:           z.string().min(1, "Data obrigatória"),
  notes:          z.string().optional(),
});
type RevenueForm = z.infer<typeof revenueSchema>;

function RevenueDialog({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RevenueForm>({
    resolver: zodResolver(revenueSchema) as Resolver<RevenueForm>,
    defaultValues: { date: new Date().toISOString().split("T")[0], productionCost: 0 },
  });

  const gross = watch("grossAmount") ?? 0;
  const cost  = watch("productionCost") ?? 0;
  const profit = Number(gross) - Number(cost);

  function onSubmit(data: RevenueForm) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => v !== undefined && fd.append(k, String(v)));
    startTransition(async () => {
      await createRevenue(fd);
      onClose();
    });
  }

  return (
    <CrudDialog
      title="Registrar Venda"
      subtitle="Registre uma venda manualmente sem criar um orçamento"
      icon={ShoppingBag}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Descrição" error={errors.description?.message} className="sm:col-span-2">
            <input {...register("description")} placeholder="Ex: Suporte de celular personalizado" className={inputCls} />
          </FormField>

          <FormField label="Valor cobrado (R$)" error={errors.grossAmount?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
              <input {...register("grossAmount")} type="number" min={0.01} step={0.01} placeholder="0,00" className={`${inputCls} pl-8`} />
            </div>
          </FormField>

          <FormField label="Custo de produção (R$)" error={errors.productionCost?.message}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">R$</span>
              <input {...register("productionCost")} type="number" min={0} step={0.01} placeholder="0,00" className={`${inputCls} pl-8`} />
            </div>
          </FormField>

          {(gross > 0 || cost > 0) && (
            <div className="sm:col-span-2 flex items-center justify-between rounded-lg border border-border bg-surface-hover px-4 py-2.5">
              <span className="text-sm text-text-secondary">Lucro líquido</span>
              <span className={`font-display text-lg font-bold ${profit >= 0 ? "text-success" : "text-error"}`}>
                {profit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          )}

          <FormField label="Data" error={errors.date?.message} className="sm:col-span-2">
            <input {...register("date")} type="date" className={inputCls} />
          </FormField>

          <FormField label="Observações" className="sm:col-span-2">
            <textarea
              {...register("notes")}
              rows={2}
              placeholder="Cliente, canal de venda, detalhes..."
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </FormField>
        </div>
        <DialogActions onClose={onClose} loading={pending} submitLabel="Registrar venda" />
      </form>
    </CrudDialog>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────

function MetricCard({ title, value, sub, icon: Icon, color, trend }: {
  title: string; value: string; sub: string; icon: React.ElementType; color: string; trend?: number | null;
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
      <div className="mt-0.5 flex items-center gap-1.5">
        <p className="text-xs text-text-muted">{sub}</p>
        {trend !== null && trend !== undefined && Number.isFinite(trend) && (
          <span className={`text-xs font-semibold ${trend >= 0 ? "text-success" : "text-error"}`}>
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}% vs mês anterior
          </span>
        )}
      </div>
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

// ─── Configurações de categorias ──────────────────────────────

function CategoryDialog({ category, onClose }: { category?: CategoryDef; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [label, setLabel] = useState(category?.label ?? "");
  const [color, setColor] = useState(category?.color ?? CATEGORY_COLOR_PALETTE[0]);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.append("label", label);
    fd.append("color", color);
    startTransition(async () => {
      const result = category ? await updateCategory(category.key, fd) : await createCategory(fd);
      if (result?.error) { setError(result.error); return; }
      onClose();
    });
  }

  return (
    <CrudDialog
      title={category ? "Editar Categoria" : "Nova Categoria"}
      subtitle="Personalize o nome e a cor usada nos gráficos"
      icon={Settings}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <FormField label="Nome">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex: Aluguel" className={inputCls} />
          </FormField>

          <FormField label="Cor">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110"
                  style={{ backgroundColor: c, borderColor: color === c ? "var(--color-text-primary)" : "transparent" }}
                >
                  {color === c && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
              <label className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-dashed border-border text-text-muted">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <Plus className="h-3.5 w-3.5" />
              </label>
            </div>
          </FormField>

          {error && <p className="text-xs text-error">{error}</p>}
        </div>
        <DialogActions onClose={onClose} loading={pending} submitLabel="Salvar" />
      </form>
    </CrudDialog>
  );
}

function CategoriesSettings({ categories }: { categories: CategoryDef[] }) {
  const [, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryDef | undefined>();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openEdit(c: CategoryDef) { setEditing(c); setDialogOpen(true); }
  function openNew()                { setEditing(undefined); setDialogOpen(true); }
  function closeDialog()            { setDialogOpen(false); setEditing(undefined); }

  function handleDelete(c: CategoryDef) {
    if (!confirm(`Excluir a categoria "${c.label}"?`)) return;
    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteCategory(c.key);
      if (result?.error) setDeleteError(result.error);
    });
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-sm font-semibold text-text-primary">Categorias de Despesa</h2>
          <p className="text-xs text-text-muted mt-0.5">Gerencie nomes e cores usadas nos gráficos e filtros</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova categoria
        </button>
      </div>

      {deleteError && (
        <div className="mx-5 mt-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error-subtle px-3 py-2 text-xs text-error">
          <X className="h-3.5 w-3.5 shrink-0" />
          {deleteError}
        </div>
      )}

      <div className="divide-y divide-border">
        {categories.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-3 px-5 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
              <p className="text-sm font-medium text-text-primary truncate">{c.label}</p>
              {c.isDefault && (
                <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-muted">padrão</span>
              )}
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => openEdit(c)} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-hover hover:text-primary transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              {!c.isDefault && (
                <button onClick={() => handleDelete(c)} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-error-subtle hover:text-error transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {dialogOpen && <CategoryDialog category={editing} onClose={closeDialog} />}
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────

type TabType = "visao-geral" | "receitas" | "despesas" | "configuracoes";

export function FinanceiroClient({ initialRevenues, initialExpenses, monthlyData, profitData, categories }: FinanceiroClientProps) {
  const [tab, setTab]                   = useState<TabType>("visao-geral");
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [revenueDialog, setRevenueDialog] = useState(false);
  const [editing, setEditing]           = useState<Expense | undefined>();
  const [filterCat, setFilterCat]       = useState<string>("ALL");
  const [onlyRecurring, setOnlyRecurring] = useState(false);
  const [, startTransition]             = useTransition();

  const now   = new Date();
  const monthRevenues = initialRevenues.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthExpenses = initialExpenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevRevenues = initialRevenues.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() === prevMonthDate.getMonth() && d.getFullYear() === prevMonthDate.getFullYear();
  });
  const prevExpenses = initialExpenses.filter((e) => {
    const d = new Date(e.date);
    return d.getMonth() === prevMonthDate.getMonth() && d.getFullYear() === prevMonthDate.getFullYear();
  });

  function pctChange(curr: number, prev: number): number | null {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  }

  const metrics = useMemo(() => {
    const receita   = monthRevenues.reduce((a, r) => a + r.grossAmount, 0);
    const lucro     = monthRevenues.reduce((a, r) => a + r.netProfit, 0);
    const despTotal = monthExpenses.reduce((a, e) => a + e.amount, 0);
    const margem    = receita > 0 ? Math.round((lucro / receita) * 100) : 0;

    const prevReceita   = prevRevenues.reduce((a, r) => a + r.grossAmount, 0);
    const prevLucro     = prevRevenues.reduce((a, r) => a + r.netProfit, 0);
    const prevDespTotal = prevExpenses.reduce((a, e) => a + e.amount, 0);

    return {
      receita, lucro, despTotal, margem,
      receitaTrend: pctChange(receita, prevReceita),
      lucroTrend:   pctChange(lucro, prevLucro),
      despTrend:    pctChange(despTotal, prevDespTotal),
    };
  }, [monthRevenues, monthExpenses, prevRevenues, prevExpenses]);

  const catColor = (key: string) => categories.find((c) => c.key === key)?.color ?? "#6B7280";
  const catLabel = (key: string, custom?: string) =>
    key === "OTHER" && custom ? custom : (categories.find((c) => c.key === key)?.label ?? key);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    monthExpenses.forEach((e) => map.set(e.category, (map.get(e.category) ?? 0) + e.amount));
    return categories
      .filter((c) => map.has(c.key))
      .map((c) => ({ name: c.label, value: map.get(c.key)!, color: c.color }));
  }, [monthExpenses, categories]);

  const filteredExpenses = useMemo(() => {
    let list = filterCat === "ALL" ? initialExpenses : initialExpenses.filter((e) => e.category === filterCat);
    if (onlyRecurring) list = list.filter((e) => e.isRecurring);
    return list;
  }, [initialExpenses, filterCat, onlyRecurring]);

  function handleDelete(id: string) {
    if (!confirm("Remover esta despesa?")) return;
    startTransition(() => deleteExpense(id));
  }

  function handleDeleteRevenue(id: string) {
    if (!confirm("Remover esta receita?")) return;
    startTransition(async () => { await deleteRevenue(id); });
  }

  function openEdit(e: Expense) { setEditing(e); setDialogOpen(true); }
  function openNew()             { setEditing(undefined); setDialogOpen(true); }
  function closeDialog()         { setDialogOpen(false); setEditing(undefined); }

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRevenueDialog(true)}
            className="flex items-center gap-2 rounded-lg border border-success/40 bg-success-subtle px-4 py-2.5 text-sm font-semibold text-success transition-colors hover:bg-success/20"
          >
            <ShoppingBag className="h-4 w-4" />
            Registrar Venda
          </button>
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Registrar Despesa
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-border bg-surface p-1 w-fit">
        {(["visao-geral", "receitas", "despesas", "configuracoes"] as TabType[]).map((t) => {
          const labels = { "visao-geral": "Visão Geral", receitas: "Receitas", despesas: "Despesas", configuracoes: "Configurações" };
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
              trend={metrics.receitaTrend}
            />
            <MetricCard
              title="Despesas Totais" sub="este mês"
              value={metrics.despTotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              icon={ArrowDownRight} color="text-error bg-error-subtle"
              trend={metrics.despTrend === null ? null : -metrics.despTrend}
            />
            <MetricCard
              title="Lucro Líquido" sub="após custos de produção"
              value={metrics.lucro.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              icon={TrendingUp} color="text-primary bg-primary-subtle"
              trend={metrics.lucroTrend}
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
              <div className="hidden grid-cols-[1fr_100px_100px_100px_90px_40px] gap-4 border-b border-border px-5 py-3 text-xs font-medium text-text-muted sm:grid">
                <span>Descrição</span>
                <span className="text-right">Receita</span>
                <span className="text-right">Custo</span>
                <span className="text-right">Lucro</span>
                <span className="text-right">Data</span>
                <span />
              </div>
              <div className="divide-y divide-border">
                {initialRevenues.map((r) => (
                  <div key={r.id} className="group grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_100px_90px_40px] items-center gap-4 px-5 py-3.5 hover:bg-surface-hover">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-subtle">
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{r.description}</p>
                        {r.notes && <p className="text-xs text-text-muted truncate">{r.notes}</p>}
                      </div>
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
                    <div className="hidden sm:flex opacity-0 transition-opacity group-hover:opacity-100 justify-end">
                      <button onClick={() => handleDeleteRevenue(r.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-error-subtle hover:text-error transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterCat("ALL")}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                filterCat === "ALL" ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface text-text-secondary hover:border-primary/50"
              }`}
            >
              Todas
            </button>
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setFilterCat(c.key)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterCat === c.key ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface text-text-secondary hover:border-primary/50"
                }`}
              >
                {c.label}
              </button>
            ))}
            <button
              onClick={() => setOnlyRecurring((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                onlyRecurring ? "border-primary bg-primary-subtle text-primary" : "border-border bg-surface text-text-secondary hover:border-primary/50"
              }`}
            >
              <Repeat className="h-3 w-3" />
              Recorrentes
            </button>
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
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-text-primary truncate">{e.description}</p>
                        {e.isRecurring && <Repeat className="h-3 w-3 shrink-0 text-primary" />}
                      </div>
                      {e.notes && <p className="text-xs text-text-muted truncate">{e.notes}</p>}
                    </div>
                  </div>
                  <span
                    className="hidden sm:inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
                    style={{ borderColor: catColor(e.category) + "40", color: catColor(e.category), backgroundColor: catColor(e.category) + "15" }}
                  >
                    {catLabel(e.category, e.customCategory)}
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
                Total {filterCat !== "ALL" && `(${catLabel(filterCat)})`}
              </span>

              <span className="font-display text-lg font-bold text-error">
                -{filteredExpenses.reduce((a, e) => a + e.amount, 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </div>
        </>
      )}

      {/* ─── Configurações ────────────────────────────────── */}
      {tab === "configuracoes" && <CategoriesSettings categories={categories} />}

      {dialogOpen && <ExpenseDialog expense={editing} categories={categories} onClose={closeDialog} />}
      {revenueDialog && <RevenueDialog onClose={() => setRevenueDialog(false)} />}
    </>
  );
}
