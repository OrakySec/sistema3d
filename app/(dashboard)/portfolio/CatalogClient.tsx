"use client";

import { useState, useTransition } from "react";
import { Trash2, Store, ShoppingBag, Package, Loader2, BookOpen } from "lucide-react";
import { formatBRL } from "@/lib/calculations";
import { deleteCatalogProduct } from "@/lib/actions/catalog";
import { MARKETPLACE_PLATFORMS } from "@/lib/marketplace";

interface CatalogProduct {
  id: string;
  name: string;
  description?: string | null;
  productionCost: number;
  paintingCost: number;
  filamentGrams: number;
  printHours: number;
  platform?: string | null;
  platformFee?: number | null;
  marketplacePrice?: number | null;
  marketplaceMargin?: number | null;
  directPrice?: number | null;
  directMargin?: number | null;
  quantity: number;
  createdAt: Date;
}

function getPlatformLabel(value: string) {
  return MARKETPLACE_PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const [deleting, startDelete] = useTransition();
  const isMarketplace = !!product.platform;
  const price  = isMarketplace ? product.marketplacePrice  : product.directPrice;
  const margin = isMarketplace ? product.marketplaceMargin : product.directMargin;
  const cost   = product.productionCost + product.paintingCost;

  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface transition-shadow hover:shadow-card">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isMarketplace
              ? <Store className="h-4 w-4 shrink-0 text-primary" />
              : <ShoppingBag className="h-4 w-4 shrink-0 text-success" />
            }
            <h3 className="truncate font-display text-sm font-bold text-text-primary">{product.name}</h3>
          </div>
          {product.description && (
            <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{product.description}</p>
          )}
        </div>
        <button
          onClick={() => startDelete(() => deleteCatalogProduct(product.id))}
          disabled={deleting}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-error-subtle hover:text-error transition-colors disabled:opacity-50"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Corpo */}
      <div className="flex flex-col gap-3 p-5">
        {/* Canal */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-muted">Canal</span>
          {isMarketplace
            ? <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">
                <Store className="h-3 w-3" /> {getPlatformLabel(product.platform!)}
                {product.platformFee != null && ` (${product.platformFee}%)`}
              </span>
            : <span className="flex items-center gap-1 rounded-full border border-success/20 bg-success-subtle px-2 py-0.5 text-xs font-medium text-success">
                <ShoppingBag className="h-3 w-3" /> Venda Direta
              </span>
          }
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-background p-3">
            <p className="text-xs text-text-muted">Custo</p>
            <p className="font-display text-base font-bold text-text-primary">{formatBRL(cost)}</p>
          </div>
          <div className="rounded-lg bg-background p-3">
            <p className="text-xs text-text-muted">Preço</p>
            <p className="font-display text-base font-bold text-primary">{price != null ? formatBRL(price) : "—"}</p>
          </div>
        </div>

        {margin != null && (
          <div className="flex items-center justify-between rounded-lg border border-success/20 bg-success-subtle px-3 py-2">
            <span className="text-xs text-text-secondary">Margem</span>
            <span className="text-sm font-bold text-success">{margin.toFixed(1)}%</span>
          </div>
        )}

        {/* Detalhes */}
        <div className="flex gap-3 text-xs text-text-muted">
          <span>{product.filamentGrams}g filamento</span>
          <span>·</span>
          <span>{product.printHours}h impressão</span>
          {product.quantity > 1 && <><span>·</span><span>{product.quantity} un.</span></>}
        </div>
      </div>

      {/* Rodapé: data */}
      <div className="mt-auto border-t border-border px-5 py-3">
        <p className="text-xs text-text-muted">
          Publicado em {new Date(product.createdAt).toLocaleDateString("pt-BR")}
        </p>
      </div>
    </div>
  );
}

interface CatalogClientProps {
  products: CatalogProduct[];
}

export function CatalogClient({ products }: CatalogClientProps) {
  const [filter, setFilter] = useState<"all" | "direct" | "marketplace">("all");

  const filtered = products.filter((p) => {
    if (filter === "direct")      return !p.platform;
    if (filter === "marketplace") return !!p.platform;
    return true;
  });

  return (
    <div>
      {/* Filtros */}
      <div className="mb-5 flex gap-2 flex-wrap">
        {(["all", "direct", "marketplace"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? "border-primary bg-primary text-white"
                : "border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary"
            }`}
          >
            {f === "all" && <Package className="h-3.5 w-3.5" />}
            {f === "direct" && <ShoppingBag className="h-3.5 w-3.5" />}
            {f === "marketplace" && <Store className="h-3.5 w-3.5" />}
            {f === "all" ? "Todos" : f === "direct" ? "Venda Direta" : "Marketplace"}
            {" "}
            <span className="opacity-60">
              ({f === "all" ? products.length : products.filter((p) => f === "direct" ? !p.platform : !!p.platform).length})
            </span>
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
          <BookOpen className="mb-4 h-10 w-10 text-text-muted" />
          <p className="font-display text-base font-semibold text-text-primary">Nenhum produto neste filtro</p>
          <p className="mt-1 text-sm text-text-muted">Publique produtos via Calculadora Marketplace ou Venda Direta.</p>
        </div>
      )}
    </div>
  );
}
