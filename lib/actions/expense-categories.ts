"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DEFAULT_EXPENSE_CATEGORIES, mergeCategories } from "@/lib/expense-categories";
import crypto from "crypto";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function getUserCategories(userId: string) {
  const rows = await prisma.expenseCategoryConfig.findMany({ where: { userId }, orderBy: { order: "asc" } });
  return mergeCategories(rows);
}

const categorySchema = z.object({
  label: z.string().min(1, "Nome obrigatório"),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida"),
});

export async function createCategory(formData: FormData) {
  const userId = await getUserId();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const count = await prisma.expenseCategoryConfig.count({ where: { userId } });
  const key = `custom_${crypto.randomBytes(6).toString("hex")}`;

  await prisma.expenseCategoryConfig.create({
    data: {
      userId,
      key,
      label: parsed.data.label,
      color: parsed.data.color,
      order: DEFAULT_EXPENSE_CATEGORIES.length + count,
    },
  });
  revalidatePath("/financeiro");
  return { ok: true, key };
}

export async function updateCategory(key: string, formData: FormData) {
  const userId = await getUserId();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };

  const existing = await prisma.expenseCategoryConfig.findUnique({ where: { userId_key: { userId, key } } });
  const order = existing?.order ?? DEFAULT_EXPENSE_CATEGORIES.find((d) => d.key === key)?.order ?? 0;

  await prisma.expenseCategoryConfig.upsert({
    where:  { userId_key: { userId, key } },
    update: { label: parsed.data.label, color: parsed.data.color },
    create: { userId, key, label: parsed.data.label, color: parsed.data.color, order },
  });

  revalidatePath("/financeiro");
  return { ok: true };
}

export async function deleteCategory(key: string) {
  const userId = await getUserId();
  const isDefault = DEFAULT_EXPENSE_CATEGORIES.some((d) => d.key === key);
  if (isDefault) return { error: "Categorias padrão não podem ser excluídas, apenas renomeadas." };

  const inUse = await prisma.expense.count({ where: { userId, category: key } });
  if (inUse > 0) return { error: `Existem ${inUse} despesa(s) nessa categoria. Mova-as antes de excluir.` };

  await prisma.expenseCategoryConfig.deleteMany({ where: { userId, key } });
  revalidatePath("/financeiro");
  return { ok: true };
}
