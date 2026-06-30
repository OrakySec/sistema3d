"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { addInterval } from "@/lib/recurring";

const expenseSchema = z.object({
  description:        z.string().min(2),
  category:            z.string().min(1),
  customCategory:      z.string().optional(),
  amount:              z.coerce.number().positive(),
  date:                z.string().transform((d) => new Date(d + "T12:00:00")),
  notes:               z.string().optional(),
  isRecurring:         z.string().optional().transform((v) => v === "true"),
  recurringFrequency:  z.enum(["WEEKLY", "MONTHLY", "YEARLY"]).optional(),
});

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

function computeNextOccurrence(data: z.infer<typeof expenseSchema>) {
  if (!data.isRecurring || !data.recurringFrequency) return null;
  return addInterval(data.date, data.recurringFrequency);
}

export async function createExpense(formData: FormData) {
  const userId = await getUserId();
  const raw = Object.fromEntries(formData);
  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) return { error: "Dados inválidos." };

  const { customCategory, ...data } = parsed.data;
  const recurringFrequency = data.isRecurring ? data.recurringFrequency ?? null : null;

  await prisma.expense.create({
    data: {
      userId,
      ...data,
      recurringFrequency,
      nextOccurrence: computeNextOccurrence(parsed.data),
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
  const recurringFrequency = data.isRecurring ? data.recurringFrequency ?? null : null;

  await prisma.expense.update({
    where: { id: expenseId, userId },
    data: {
      ...data,
      recurringFrequency,
      nextOccurrence: computeNextOccurrence(parsed.data),
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
