export interface MarketplacePlatform {
  value: string;
  label: string;
  fee: number; // % padrão
}

export const MARKETPLACE_PLATFORMS: MarketplacePlatform[] = [
  { value: "mercado_livre", label: "Mercado Livre", fee: 14 },
  { value: "shopee",        label: "Shopee",        fee: 12 },
  { value: "etsy",          label: "Etsy",          fee: 6.5 },
  { value: "amazon",        label: "Amazon",        fee: 15 },
  { value: "outro",         label: "Outro",         fee: 0  },
];

export function getPlatformLabel(value: string): string {
  return MARKETPLACE_PLATFORMS.find((p) => p.value === value)?.label ?? value;
}
