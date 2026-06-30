"use server";

import { prisma } from "@/lib/prisma";
import { auth }   from "@/auth";
import { redirect } from "next/navigation";

export interface Notification {
  id:    string;
  title: string;
  desc:  string;
  time:  string;
  type:  "success" | "warning" | "error" | "info";
  href?: string;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return "agora";
  if (mins  < 60) return `${mins}min`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

export async function getNotifications(): Promise<Notification[]> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000);

  const [lowStock, recentApproved, expiringSoon] = await Promise.all([
    // Filamentos com estoque baixo (compara duas colunas via raw)
    prisma.$queryRaw<{ id: string; name: string; currentGrams: number; lowStockAlert: number; updatedAt: Date }[]>`
      SELECT id, name, "currentGrams", "lowStockAlert", "updatedAt"
      FROM "Filament"
      WHERE "userId" = ${userId}
        AND active = true
        AND "currentGrams" <= "lowStockAlert"
      LIMIT 5
    `.catch(() => [] as any[]),

    // Orçamentos aprovados nos últimos 7 dias
    prisma.quote.findMany({
      where:  { userId, status: "APPROVED", approvedAt: { gte: sevenDaysAgo } },
      select: { id: true, pieceName: true, totalPrice: true, approvedAt: true, client: { select: { name: true } } },
      orderBy: { approvedAt: "desc" },
      take:   5,
    }).catch(() => [] as any[]),

    // Orçamentos enviados há mais de 2 dias sem resposta
    prisma.quote.findMany({
      where: {
        userId,
        status: { in: ["SENT", "VIEWED"] },
        updatedAt: { lte: new Date(Date.now() - 2 * 86_400_000) },
      },
      select: { id: true, pieceName: true, updatedAt: true, client: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take:   3,
    }).catch(() => [] as any[]),
  ]);

  const notifications: Notification[] = [];

  // Orçamentos aprovados
  for (const q of recentApproved) {
    notifications.push({
      id:    `approved-${q.id}`,
      title: "Orçamento aprovado!",
      desc:  `${q.client?.name ?? "Cliente"} aprovou "${q.pieceName}" — ${q.totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
      time:  timeAgo(new Date(q.approvedAt)),
      type:  "success",
      href:  `/orcamentos`,
    });
  }

  // Estoque baixo
  for (const f of lowStock) {
    notifications.push({
      id:    `stock-${f.id}`,
      title: "Estoque baixo",
      desc:  `${f.name} — ${f.currentGrams}g restantes (alerta em ${f.lowStockAlert}g)`,
      time:  timeAgo(new Date(f.updatedAt)),
      type:  "warning",
      href:  `/estoque`,
    });
  }

  // Orçamentos sem resposta
  for (const q of expiringSoon) {
    notifications.push({
      id:    `pending-${q.id}`,
      title: "Orçamento sem resposta",
      desc:  `${q.client?.name ?? "Cliente"} ainda não respondeu "${q.pieceName}"`,
      time:  timeAgo(new Date(q.updatedAt)),
      type:  "info",
      href:  `/orcamentos`,
    });
  }

  return notifications;
}
