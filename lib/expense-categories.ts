export interface ExpenseCategoryDef {
  key: string;
  label: string;
  color: string;
  order: number;
  isDefault: boolean;
}

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategoryDef[] = [
  { key: "FILAMENT",      label: "Filamento",        color: "#F97316", order: 0, isDefault: true },
  { key: "PRINTER_PARTS", label: "Peças Impressora", color: "#3B82F6", order: 1, isDefault: true },
  { key: "ENERGY",        label: "Energia",          color: "#EAB308", order: 2, isDefault: true },
  { key: "MARKETING",     label: "Marketing",        color: "#A855F7", order: 3, isDefault: true },
  { key: "TOOLS",         label: "Ferramentas",      color: "#14B8A6", order: 4, isDefault: true },
  { key: "PACKAGING",     label: "Embalagem",        color: "#F43F5E", order: 5, isDefault: true },
  { key: "SHIPPING",      label: "Frete",            color: "#6366F1", order: 6, isDefault: true },
  { key: "OTHER",         label: "Outros",           color: "#6B7280", order: 7, isDefault: true },
];

export const CATEGORY_COLOR_PALETTE = [
  "#F97316", "#3B82F6", "#EAB308", "#A855F7", "#14B8A6", "#F43F5E",
  "#6366F1", "#6B7280", "#22C55E", "#EC4899", "#0EA5E9", "#D946EF",
];

export function mergeCategories(
  customRows: { id: string; key: string; label: string; color: string; order: number }[]
): (ExpenseCategoryDef & { id?: string })[] {
  const customByKey = new Map(customRows.map((c) => [c.key, c]));
  const defaultKeys = new Set(DEFAULT_EXPENSE_CATEGORIES.map((d) => d.key));

  const merged: (ExpenseCategoryDef & { id?: string })[] = DEFAULT_EXPENSE_CATEGORIES.map((d) => {
    const override = customByKey.get(d.key);
    return override
      ? { key: d.key, label: override.label, color: override.color, order: override.order, isDefault: true, id: override.id }
      : { ...d };
  });

  customRows
    .filter((c) => !defaultKeys.has(c.key))
    .forEach((c) => merged.push({ key: c.key, label: c.label, color: c.color, order: c.order, isDefault: false, id: c.id }));

  return merged.sort((a, b) => a.order - b.order);
}
