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
