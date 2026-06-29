import { prisma } from "@/lib/prisma";
import { QuoteApproval } from "./QuoteApproval";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    select: {
      pieceName: true,
      totalPrice: true,
      user: { select: { businessName: true, name: true } },
    },
  });

  if (!quote) {
    return { title: "Orçamento não encontrado" };
  }

  const maker = quote.user.businessName ?? quote.user.name ?? "Maker 3D";
  const price = quote.totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return {
    title: `${quote.pieceName} — ${price} | ${maker}`,
    description: `Orçamento de impressão 3D de ${maker}. Clique para visualizar e aprovar.`,
    robots: "noindex, nofollow",
  };
}

export default async function PublicQuotePage({ params }: Props) {
  const { token } = await params;

  let data = null;
  let error: string | undefined;

  try {
    const quote = await prisma.quote.findUnique({
      where: { publicToken: token },
      include: {
        client:   { select: { name: true } },
        printer:  { select: { name: true } },
        filament: { select: { name: true, type: true, colorHex: true } },
        versions: { orderBy: { order: "asc" } },
        user: {
          select: {
            businessName: true,
            name:         true,
            image:        true,
            city:         true,
            settings: {
              select: {
                paymentLinkEnabled:    true,
                paymentDepositPercent: true,
                viewTrackingEnabled:   true,
              },
            },
          },
        },
      },
    });

    if (!quote) {
      error = "not_found";
    } else {
      // Registrar visualização no servidor (sem round-trip extra)
      if (quote.user.settings?.viewTrackingEnabled) {
        await prisma.quote.update({
          where: { publicToken: token },
          data: {
            viewCount:    { increment: 1 },
            lastViewedAt: new Date(),
            status: quote.status === "SENT" ? "VIEWED" : quote.status,
          },
        });
      }

      // Verificar expiração
      if (quote.expiresAt && quote.expiresAt < new Date() && quote.status !== "APPROVED") {
        await prisma.quote.update({
          where: { publicToken: token },
          data: { status: "EXPIRED" },
        });
        data = { ...quote, status: "EXPIRED" };
      } else {
        data = quote;
      }
    }
  } catch (e) {
    console.error("[public-quote]", e);
    error = "server_error";
  }

  return <QuoteApproval token={token} initialData={data as any} initialError={error} />;
}
