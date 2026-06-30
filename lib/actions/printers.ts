"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkLimit } from "@/lib/limits";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const printerSchema = z.object({
  name:                 z.string().min(2),
  model:                z.string().optional(),
  powerWatts:           z.coerce.number().positive(),
  purchasePrice:        z.coerce.number().positive(),
  estimatedHours:       z.coerce.number().positive(),
  monthlyMaintenance:   z.coerce.number().min(0),
  totalHours:           z.coerce.number().min(0).optional(),
});

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function createPrinter(formData: FormData) {
  const userId = await getUserId();
  const parsed = printerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const count = await prisma.printer.count({ where: { userId } });
  const limitCheck = await checkLimit(userId, "printers", count);
  if (!limitCheck.allowed) return { error: "LIMIT_EXCEEDED", key: "printers", plan: limitCheck.plan, limit: limitCheck.limit };

  await prisma.printer.create({ data: { userId, ...parsed.data } });
  revalidatePath("/impressoras");
  return { ok: true };
}

export async function updatePrinter(printerId: string, formData: FormData) {
  const userId = await getUserId();
  const parsed = printerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  await prisma.printer.update({ where: { id: printerId, userId }, data: parsed.data });
  revalidatePath("/impressoras");
  return { ok: true };
}

export async function togglePrinterActive(printerId: string, active: boolean) {
  const userId = await getUserId();
  await prisma.printer.update({ where: { id: printerId, userId }, data: { active } });
  revalidatePath("/impressoras");
}

export async function deletePrinter(printerId: string) {
  const userId = await getUserId();
  await prisma.printer.delete({ where: { id: printerId, userId } });
  revalidatePath("/impressoras");
}
