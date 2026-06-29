import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { QuoteDetail } from "./QuoteDetail";
import type { Metadata } from "next";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const quote = await prisma.quote.findUnique({ where: { id }, select: { pieceName: true } });
  return { title: quote?.pieceName ?? "Orçamento" };
}

export default async function QuoteDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const quote = await prisma.quote.findUnique({
    where:   { id, userId: session.user.id },
    include: {
      client:   { select: { id: true, name: true, whatsapp: true } },
      printer:  { select: { name: true } },
      filament: { select: { name: true, type: true, colorHex: true } },
      versions: { orderBy: { order: "asc" } },
      kanbanCard: { select: { id: true, column: true } },
    },
  });

  if (!quote) notFound();

  return <QuoteDetail quote={quote} />;
}
