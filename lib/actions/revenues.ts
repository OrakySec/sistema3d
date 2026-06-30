"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const revenueSchema = z.object({
  description:    z.string().min(2),
  grossAmount:    z.coerce.number().positive(),
  productionCost: z.coerce.number().min(0),
  date:           z.string().transform((d) => new Date(d + "T12:00:00")),
  notes:          z.string().optional(),
});

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function createRevenue(formData: FormData) {
  const userId = await getUserId();
  const parsed = revenueSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const { grossAmount, productionCost, ...rest } = parsed.data;
  await prisma.revenue.create({
    data: {
      userId,
      grossAmount,
      productionCost,
      netProfit: grossAmount - productionCost,
      ...rest,
    },
  });
  revalidatePath("/financeiro");
  return { ok: true };
}

export async function deleteRevenue(revenueId: string) {
  const userId = await getUserId();
  await prisma.revenue.delete({ where: { id: revenueId, userId } });
  revalidatePath("/financeiro");
}
