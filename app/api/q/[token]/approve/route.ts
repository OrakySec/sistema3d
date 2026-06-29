import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: { kanbanCard: true },
  });

  if (!quote) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  if (quote.status === "EXPIRED" || (quote.expiresAt && quote.expiresAt < new Date())) {
    return NextResponse.json({ error: "Este orçamento expirou." }, { status: 410 });
  }

  if (quote.status === "APPROVED") {
    return NextResponse.json({ ok: true, alreadyApproved: true });
  }

  await prisma.$transaction([
    prisma.quote.update({
      where: { publicToken: token },
      data:  { status: "APPROVED", approvedAt: new Date() },
    }),
    // Mover kanban para "Aprovado"
    ...(quote.kanbanCard
      ? [prisma.kanbanCard.update({
          where: { id: quote.kanbanCard.id },
          data:  { column: "APPROVED" },
        })]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
