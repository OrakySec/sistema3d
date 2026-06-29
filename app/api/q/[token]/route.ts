import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

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
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  // Registrar visualização
  if (quote.user.settings?.viewTrackingEnabled) {
    await prisma.quote.update({
      where: { publicToken: token },
      data: {
        viewCount:   { increment: 1 },
        lastViewedAt: new Date(),
        status: quote.status === "SENT" ? "VIEWED" : quote.status,
      },
    });
  }

  return NextResponse.json(quote);
}
