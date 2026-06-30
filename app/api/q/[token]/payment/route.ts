import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";

interface Props {
  params: Promise<{ token: string }>;
}

export async function POST(_req: Request, { params }: Props) {
  const { token } = await params;

  const quote = await prisma.quote.findUnique({
    where:  { publicToken: token },
    select: {
      id:            true,
      pieceName:     true,
      totalPrice:    true,
      status:        true,
      user: {
        select: {
          infinitypayHandle: true,
          settings: {
            select: {
              paymentLinkEnabled:    true,
              paymentDepositPercent: true,
            },
          },
        },
      },
    },
  });

  if (!quote) return NextResponse.json({ error: "Orçamento não encontrado" }, { status: 404 });
  if (quote.status !== "APPROVED") return NextResponse.json({ error: "Orçamento não aprovado" }, { status: 400 });
  if (!quote.user.infinitypayHandle) return NextResponse.json({ error: "Pagamento não configurado" }, { status: 400 });
  if (!quote.user.settings?.paymentLinkEnabled) return NextResponse.json({ error: "Pagamento não ativado" }, { status: 400 });

  const depositPercent = quote.user.settings.paymentDepositPercent ?? 50;
  const depositValue   = Math.round(quote.totalPrice * (depositPercent / 100) * 100); // em centavos

  try {
    const res = await fetch("https://api.checkout.infinitepay.io/links", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle:    quote.user.infinitypayHandle,
        order_nsu: quote.id,
        items: [{
          quantity:    1,
          price:       depositValue,
          description: `Entrada ${depositPercent}% — ${quote.pieceName}`,
        }],
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("[payment] InfinityPay error:", res.status, data);
      return NextResponse.json({ error: "Erro ao gerar link de pagamento. Tente novamente." }, { status: 502 });
    }

    const url = data?.receipt_url ?? data?.url ?? data?.payment_url ?? null;
    if (!url) {
      return NextResponse.json({ error: "InfinityPay não retornou o link." }, { status: 502 });
    }

    // Salva o link no orçamento
    await prisma.quote.update({
      where: { id: quote.id },
      data:  { paymentLinkUrl: url, depositAmount: depositValue / 100 },
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error("[payment]", err);
    return NextResponse.json({ error: "Erro de conexão com InfinityPay." }, { status: 502 });
  }
}
