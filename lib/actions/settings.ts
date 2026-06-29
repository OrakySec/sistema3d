"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const settingsSchema = z.object({
  // Perfil
  businessName: z.string().optional(),
  whatsapp:     z.string().optional(),
  city:         z.string().optional(),

  // Custos
  energyCostKwh:       z.coerce.number().min(0).optional(),
  defaultProfitMargin: z.coerce.number().min(0).optional(),
  paintingHourlyRate:  z.coerce.number().min(0).optional(),

  // Orçamentos
  quoteExpirationEnabled: z.coerce.boolean().optional(),
  quoteExpirationDays:    z.coerce.number().min(1).max(30).optional(),
  quoteReminderEnabled:   z.coerce.boolean().optional(),
  paymentLinkEnabled:     z.coerce.boolean().optional(),
  paymentDepositPercent:  z.coerce.number().min(0).max(100).optional(),
  viewTrackingEnabled:    z.coerce.boolean().optional(),

  // WhatsApp
  whatsappAutoEnabled:      z.coerce.boolean().optional(),
  silentHoursEnabled:       z.coerce.boolean().optional(),
  silentHoursStart:         z.string().optional(),
  silentHoursEnd:           z.string().optional(),
  autoReplyEnabled:         z.coerce.boolean().optional(),
  autoReplyMessage:         z.string().optional(),
  followupEnabled:          z.coerce.boolean().optional(),
  followup7DaysEnabled:     z.coerce.boolean().optional(),
  followup30DaysEnabled:    z.coerce.boolean().optional(),
  npsEnabled:               z.coerce.boolean().optional(),
  npsDaysAfterDelivery:     z.coerce.number().min(1).optional(),

  // Estoque
  autoDeductStock:      z.coerce.boolean().optional(),
  lowStockAlertEnabled: z.coerce.boolean().optional(),

  // Portfólio
  portfolioEnabled:             z.coerce.boolean().optional(),
  portfolioLeadFormEnabled:     z.coerce.boolean().optional(),
  portfolioTestimonialsEnabled: z.coerce.boolean().optional(),
});

export async function saveSettings(data: z.infer<typeof settingsSchema>) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const parsed = settingsSchema.safeParse(data);
  if (!parsed.success) return { error: "Dados inválidos." };

  const { businessName, whatsapp, city, ...settingsData } = parsed.data;

  await prisma.$transaction([
    // Atualiza perfil do usuário
    prisma.user.update({
      where: { id: userId },
      data: {
        businessName: businessName ?? undefined,
        whatsapp:     whatsapp     ?? undefined,
        city:         city         ?? undefined,
      },
    }),
    // Atualiza configurações (upsert — cria se não existir)
    prisma.userSettings.upsert({
      where:  { userId },
      update: settingsData,
      create: { userId, ...settingsData },
    }),
  ]);

  revalidatePath("/configuracoes");
  return { ok: true };
}

export async function getSettings() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { businessName: true, whatsapp: true, city: true } }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  return { user, settings };
}
