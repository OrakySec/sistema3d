import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClientesClient } from "./ClientesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [clients, user] = await Promise.all([
    prisma.client.findMany({
      where:   { userId },
      include: { _count: { select: { quotes: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, stripeCustomerId: true } }),
  ]);

  return (
    <ClientesClient
      initialClients={clients}
      plan={user?.plan ?? "FREE"}
      isFirstSubscriber={!user?.stripeCustomerId}
    />
  );
}
