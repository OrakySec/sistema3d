"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkLimit } from "@/lib/limits";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const FILAMENT_TYPES = ["PLA", "PETG", "ABS", "ASA", "TPU", "NYLON", "RESIN", "OTHER"] as const;

const filamentSchema = z.object({
  name:           z.string().min(2),
  brand:          z.string().optional(),
  type:           z.enum(FILAMENT_TYPES),
  color:          z.string().optional(),
  colorHex:       z.string().optional(),
  purchasedGrams: z.coerce.number().positive(),
  currentGrams:   z.coerce.number().min(0),
  costPerKg:      z.coerce.number().positive(),
  density:        z.coerce.number().positive().optional(),
  lowStockAlert:  z.coerce.number().min(0),
});

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function createFilament(formData: FormData) {
  const userId = await getUserId();
  const parsed = filamentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const count = await prisma.filament.count({ where: { userId } });
  const limitCheck = await checkLimit(userId, "filaments", count);
  if (!limitCheck.allowed) return { error: "LIMIT_EXCEEDED", key: "filaments", plan: limitCheck.plan, limit: limitCheck.limit };

  await prisma.filament.create({ data: { userId, ...parsed.data } });
  revalidatePath("/estoque");
  return { ok: true };
}

export async function updateFilament(filamentId: string, formData: FormData) {
  const userId = await getUserId();
  const parsed = filamentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  await prisma.filament.update({ where: { id: filamentId, userId }, data: parsed.data });
  revalidatePath("/estoque");
  return { ok: true };
}

export async function adjustFilamentStock(filamentId: string, gramsUsed: number) {
  const userId = await getUserId();

  const filament = await prisma.filament.findFirst({ where: { id: filamentId, userId } });
  if (!filament) return { error: "Filamento não encontrado." };

  const newGrams = Math.max(0, filament.currentGrams - gramsUsed);
  await prisma.filament.update({
    where: { id: filamentId },
    data: { currentGrams: newGrams },
  });

  revalidatePath("/estoque");
  return { ok: true, remaining: newGrams };
}

export async function deleteFilament(filamentId: string) {
  const userId = await getUserId();
  await prisma.filament.delete({ where: { id: filamentId, userId } });
  revalidatePath("/estoque");
}
