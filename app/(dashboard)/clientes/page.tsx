import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ClientesClient } from "./ClientesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Clientes" };

export default async function ClientesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const clients = await prisma.client.findMany({
    where:   { userId: session.user.id },
    include: { _count: { select: { quotes: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <ClientesClient initialClients={clients} />;
}
