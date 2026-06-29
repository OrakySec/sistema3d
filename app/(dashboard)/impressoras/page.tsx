import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ImpressorasClient } from "./ImpressorasClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Impressoras" };

export default async function ImpressorasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const printers = await prisma.printer.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return <ImpressorasClient initialPrinters={printers} />;
}
