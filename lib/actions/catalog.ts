"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkFeature } from "@/lib/limits";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const catalogSchema = z.object({
  name:              z.string().min(1),
  description:       z.string().optional(),
  productionCost:    z.coerce.number().min(0),
  filamentCost:      z.coerce.number().min(0),
  energyCost:        z.coerce.number().min(0),
  printerCost:       z.coerce.number().min(0),
  paintingCost:      z.coerce.number().min(0),
  filamentGrams:     z.coerce.number().min(0),
  printHours:        z.coerce.number().min(0),
  printerId:         z.string().optional(),
  filamentId:        z.string().optional(),
  directPrice:       z.coerce.number().optional(),
  directMargin:      z.coerce.number().optional(),
  platform:          z.string().optional(),
  platformFee:       z.coerce.number().optional(),
  marketplacePrice:  z.coerce.number().optional(),
  marketplaceMargin: z.coerce.number().optional(),
  quantity:          z.coerce.number().int().min(1).default(1),
  quoteId:           z.string().optional(),
});

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function publishToCatalog(formData: FormData) {
  const userId = await getUserId();

  const allowed = await checkFeature(userId, "portfolio");
  if (!allowed) return { error: "FEATURE_BLOCKED" };

  const parsed = catalogSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const data = parsed.data;
  await prisma.catalogProduct.create({
    data: {
      userId,
      name:              data.name,
      description:       data.description,
      productionCost:    data.productionCost,
      filamentCost:      data.filamentCost,
      energyCost:        data.energyCost,
      printerCost:       data.printerCost,
      paintingCost:      data.paintingCost,
      filamentGrams:     data.filamentGrams,
      printHours:        data.printHours,
      printerId:         data.printerId  || null,
      filamentId:        data.filamentId || null,
      directPrice:       data.directPrice,
      directMargin:      data.directMargin,
      platform:          data.platform   || null,
      platformFee:       data.platformFee,
      marketplacePrice:  data.marketplacePrice,
      marketplaceMargin: data.marketplaceMargin,
      quantity:          data.quantity,
      quoteId:           data.quoteId    || null,
    },
  });

  revalidatePath("/portfolio");
  return { ok: true };
}

export async function deleteCatalogProduct(id: string) {
  const userId = await getUserId();
  await prisma.catalogProduct.delete({ where: { id, userId } });
  revalidatePath("/portfolio");
}

export async function updateCatalogProduct(id: string, formData: FormData) {
  const userId = await getUserId();
  const parsed = catalogSchema.partial().safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  await prisma.catalogProduct.update({
    where: { id, userId },
    data: parsed.data,
  });
  revalidatePath("/portfolio");
  return { ok: true };
}
