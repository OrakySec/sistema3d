import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_PRICES, STRIPE_PROMO_MONTHLY } from "@/lib/stripe";

type PlanKey = "PRO" | "PRO_ANNUAL" | "STUDIO" | "STUDIO_ANNUAL";
const ANNUAL_PLANS: PlanKey[] = ["PRO_ANNUAL", "STUDIO_ANNUAL"];

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { plan } = await req.json() as { plan: PlanKey };
  const priceId  = STRIPE_PRICES[plan];
  if (!priceId)  return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  const isAnnual = ANNUAL_PLANS.includes(plan);

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { email: true, stripeCustomerId: true },
  });

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email! });
    customerId = customer.id;
    await prisma.user.update({ where: { id: session.user.id }, data: { stripeCustomerId: customerId } });
  }

  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const basePlan = plan.replace("_ANNUAL", "") as "PRO" | "STUDIO";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer:             customerId,
    mode:                 "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    ...(!isAnnual && STRIPE_PROMO_MONTHLY ? { discounts: [{ promotion_code: STRIPE_PROMO_MONTHLY }] } : {}),
    success_url: `${appUrl}/configuracoes?billing=success`,
    cancel_url:  `${appUrl}/configuracoes?billing=cancel`,
    metadata:    { userId: session.user.id, plan: basePlan },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
