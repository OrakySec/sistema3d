export interface QuoteInputs {
  filamentGrams: number;
  printHours: number;
  profitMargin: number;
  paintingHours: number;
  filamentCostPerKg: number;
  printerPowerWatts: number;
  printerPurchasePrice: number;
  printerEstimatedHours: number;
  printerMonthlyMaintenance: number;
  energyCostKwh: number;
  paintingHourlyRate: number;
}

export interface QuoteBreakdown {
  filamentCost: number;
  energyCost: number;
  printerCost: number;
  paintingCost: number;
  productionCost: number;
  profitAmount: number;
  totalPrice: number;
}

export function calculateQuote(inputs: QuoteInputs): QuoteBreakdown {
  const filamentCost = (inputs.filamentGrams / 1000) * inputs.filamentCostPerKg;

  const energyCost = (inputs.printerPowerWatts / 1000) * inputs.printHours * inputs.energyCostKwh;

  const hoursPerMonth = 730;
  const depreciationPerHour = inputs.printerPurchasePrice / inputs.printerEstimatedHours;
  const maintenancePerHour = inputs.printerMonthlyMaintenance / hoursPerMonth;
  const printerCost = (depreciationPerHour + maintenancePerHour) * inputs.printHours;

  const paintingCost = inputs.paintingHours * inputs.paintingHourlyRate;

  const productionCost = filamentCost + energyCost + printerCost;
  const profitAmount = productionCost * (inputs.profitMargin / 100);
  const totalPrice = productionCost + profitAmount + paintingCost;

  return {
    filamentCost,
    energyCost,
    printerCost,
    paintingCost,
    productionCost,
    profitAmount,
    totalPrice,
  };
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Dada uma margem-alvo e custo, retorna o preço mínimo que cobre a taxa da plataforma */
export function marketplaceSuggestedPrice(productionCost: number, paintingCost: number, margin: number, platformFee: number): number {
  const priceBeforeFee = productionCost * (1 + margin / 100) + paintingCost;
  return platformFee >= 100 ? priceBeforeFee : priceBeforeFee / (1 - platformFee / 100);
}

/** Dado um preço final (com taxa já embutida), retorna a margem real sobre o custo de produção */
export function marginFromMarketplacePrice(price: number, productionCost: number, paintingCost: number, platformFee: number): number {
  if (productionCost <= 0) return 0;
  const netRevenue = price * (1 - platformFee / 100);
  return ((netRevenue - paintingCost - productionCost) / productionCost) * 100;
}

/** Dado um preço final de venda direta, retorna a margem sobre custo de produção */
export function marginFromDirectPrice(price: number, productionCost: number, paintingCost: number): number {
  if (productionCost <= 0) return 0;
  return ((price - paintingCost - productionCost) / productionCost) * 100;
}
