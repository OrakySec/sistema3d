import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ reason: z.string().optional() });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  const { reason } = schema.parse(body);

  const quote = await prisma.quote.findUnique({
    where: { publicToken: token },
    include: { kanbanCard: true },
  });

  if (!quote) {
    return NextResponse.json({ error: "Orçamento não encontrado." }, { status: 404 });
  }

  if (quote.status === "APPROVED") {
    return NextResponse.json({ error: "Orçamento já foi aprovado." }, { status: 409 });
  }

  await prisma.$transaction([
    prisma.quote.update({
      where: { publicToken: token },
      data:  { status: "REJECTED", rejectedAt: new Date() },
    }),
    ...(quote.kanbanCard
      ? [prisma.kanbanCard.update({
          where: { id: quote.kanbanCard.id },
          data:  { column: "CANCELLED", notes: reason ? `Recusado: ${reason}` : undefined },
        })]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
