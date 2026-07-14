import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendConversionEvent } from "@/lib/meta";
import type { Plan } from "@/lib/plans";
import type Stripe from "stripe";
import crypto from "crypto";

const PRICE_TO_PLAN: Record<string, Plan> = {
  [process.env.STRIPE_PRICE_PRO           ?? ""]: "PRO",
  [process.env.STRIPE_PRICE_PRO_ANNUAL    ?? ""]: "PRO",
  [process.env.STRIPE_PRICE_STUDIO        ?? ""]: "STUDIO",
  [process.env.STRIPE_PRICE_STUDIO_ANNUAL ?? ""]: "STUDIO",
};

export async function POST(req: Request) {
  const body      = await req.text();
  const signature = req.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.mode !== "subscription") break;

      const userId = s.metadata?.userId;
      const plan   = s.metadata?.plan as Plan | undefined;
      if (!userId || !plan) break;

      const sub = await stripe.subscriptions.retrieve(s.subscription as string);

      const updatedUser = await prisma.user.update({
        where:  { id: userId },
        select: { email: true, name: true, whatsapp: true, city: true },
        data: {
          plan,
          subscriptionStatus:   "ACTIVE",
          stripeSubscriptionId: sub.id,
          currentPeriodEnd:     new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
        },
      });

      // Plano e valor para rastreamento (falha silenciosa para não derrubar o webhook)
      try {
        const planValues: Record<string, number> = { PRO: 97, STUDIO: 197 };
        await sendConversionEvent({
          eventName:      "Subscribe",
          eventId:        crypto.randomUUID(),
          eventSourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/configuracoes`,
          userData: {
            email:     updatedUser.email,
            name:      updatedUser.name,
            phone:     updatedUser.whatsapp,
            city:      updatedUser.city,
            fbc:       null,
            fbp:       null,
            clientIp:  null,
            userAgent: null,
          },
          customData: {
            value:    planValues[plan] ?? 0,
            currency: "BRL",
            content_name: plan,
          },
        });
      } catch (e) {
        console.error("[webhook] sendConversionEvent falhou:", e);
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub      = event.data.object as Stripe.Subscription;
      const priceId  = sub.items.data[0]?.price.id ?? "";
      const plan     = PRICE_TO_PLAN[priceId];

      const user = await prisma.user.findFirst({
        where: { stripeSubscriptionId: sub.id },
      });
      if (!user) break;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan:               plan ?? user.plan,
          subscriptionStatus: sub.status === "active" ? "ACTIVE" : sub.status === "past_due" ? "PAST_DUE" : "CANCELED",
          currentPeriodEnd:   new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
        },
      });
      break;
    }

    case "customer.subscription.deleted": {
      const sub  = event.data.object as Stripe.Subscription;
      const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: sub.id } });
      if (!user) break;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan:               "FREE",
          subscriptionStatus: "CANCELED",
          stripeSubscriptionId: null,
          currentPeriodEnd:   null,
        },
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
      if (!user) break;

      await prisma.user.update({
        where: { id: user.id },
        data:  { subscriptionStatus: "PAST_DUE" },
      });
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) break;

      const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
      if (!user || user.subscriptionStatus !== "PAST_DUE") break;

      // Pagamento regularizado — volta para ACTIVE
      await prisma.user.update({
        where: { id: user.id },
        data:  { subscriptionStatus: "ACTIVE" },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
