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
  PRO:    process.env.STRIPE_PRICE_PRO    ?? "",
  STUDIO: process.env.STRIPE_PRICE_STUDIO ?? "",
};

export const STRIPE_PROMO = process.env.STRIPE_PROMO_LAUNCH;
