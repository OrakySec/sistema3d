import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY não configurada");
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-06-24.dahlia" });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_t, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

export const STRIPE_PRICES = {
  PRO:           process.env.STRIPE_PRICE_PRO           ?? "",
  PRO_ANNUAL:    process.env.STRIPE_PRICE_PRO_ANNUAL    ?? "",
  STUDIO:        process.env.STRIPE_PRICE_STUDIO        ?? "",
  STUDIO_ANNUAL: process.env.STRIPE_PRICE_STUDIO_ANNUAL ?? "",
};

// Cupom de lançamento só para planos mensais
export const STRIPE_PROMO_MONTHLY = process.env.STRIPE_PROMO_LAUNCH;
