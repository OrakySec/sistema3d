import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ImpressorasClient } from "./ImpressorasClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Impressoras" };

export default async function ImpressorasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [printers, user] = await Promise.all([
    prisma.printer.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { plan: true, stripeCustomerId: true } }),
  ]);

  return (
    <ImpressorasClient
      initialPrinters={printers}
      plan={user?.plan ?? "FREE"}
      isFirstSubscriber={!user?.stripeCustomerId}
    />
  );
}
