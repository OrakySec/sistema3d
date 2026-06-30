"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const EXPENSE_CATEGORIES = [
  "FILAMENT", "PRINTER_PARTS", "ENERGY", "MARKETING",
  "TOOLS", "PACKAGING", "SHIPPING", "OTHER",
] as const;

const expenseSchema = z.object({
  description:    z.string().min(2),
  category:       z.enum(EXPENSE_CATEGORIES),
  customCategory: z.string().optional(),
  amount:         z.coerce.number().positive(),
  date:           z.string().transform((d) => new Date(d + "T12:00:00")),
  notes:          z.string().optional(),
});

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function createExpense(formData: FormData) {
  const userId = await getUserId();
  const raw = Object.fromEntries(formData);
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) return { error: "Dados inválidos." };

  const { customCategory, ...data } = parsed.data;
  await prisma.expense.create({
    data: {
      userId,
      ...data,
      customCategory: data.category === "OTHER" ? (customCategory || null) : null,
    },
  });
  revalidatePath("/financeiro");
  return { ok: true };
}

export async function updateExpense(expenseId: string, formData: FormData) {
  const userId = await getUserId();
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const { customCategory, ...data } = parsed.data;
  await prisma.expense.update({
    where: { id: expenseId, userId },
    data: {
      ...data,
      customCategory: data.category === "OTHER" ? (customCategory || null) : null,
    },
  });
  revalidatePath("/financeiro");
  return { ok: true };
}

export async function deleteExpense(expenseId: string) {
  const userId = await getUserId();
  await prisma.expense.delete({ where: { id: expenseId, userId } });
  revalidatePath("/financeiro");
}
