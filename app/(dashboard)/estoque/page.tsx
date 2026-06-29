import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { EstoqueClient } from "./EstoqueClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Estoque" };

export default async function EstoquePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const filaments = await prisma.filament.findMany({
    where:   { userId: session.user.id, active: true },
    orderBy: { createdAt: "desc" },
  });

  return <EstoqueClient initialFilaments={filaments} />;
}
