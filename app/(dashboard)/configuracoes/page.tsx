import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ConfiguracoesClient } from "./ConfiguracoesClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Configurações" };

export default async function ConfiguracoesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { businessName: true, whatsapp: true, city: true, infinitypayHandle: true, infinitypayEnabled: true, evolutionConnected: true },
    }),
    prisma.userSettings.findUnique({ where: { userId } }),
  ]);

  return (
    <ConfiguracoesClient
      whatsappConnected={!!user?.evolutionConnected}
      infinitypayHandle={user?.infinitypayHandle ?? undefined}
      initialUser={{
        businessName: user?.businessName ?? "",
        whatsapp:     user?.whatsapp     ?? "",
        city:         user?.city         ?? "",
      }}
      initialSettings={{
        energyCostKwh:               settings?.energyCostKwh             ?? 0.75,
        defaultProfitMargin:         settings?.defaultProfitMargin        ?? 30,
        paintingHourlyRate:          settings?.paintingHourlyRate         ?? 0,
        quoteExpirationEnabled:      settings?.quoteExpirationEnabled     ?? true,
        quoteExpirationDays:         settings?.quoteExpirationDays        ?? 5,
        quoteReminderEnabled:        settings?.quoteReminderEnabled       ?? true,
        paymentLinkEnabled:          settings?.paymentLinkEnabled         ?? false,
        paymentDepositPercent:       settings?.paymentDepositPercent      ?? 50,
        viewTrackingEnabled:         settings?.viewTrackingEnabled        ?? true,
        whatsappAutoEnabled:         settings?.whatsappAutoEnabled        ?? false,
        silentHoursEnabled:          settings?.silentHoursEnabled         ?? false,
        silentHoursStart:            settings?.silentHoursStart           ?? "22:00",
        silentHoursEnd:              settings?.silentHoursEnd             ?? "08:00",
        autoReplyEnabled:            settings?.autoReplyEnabled           ?? false,
        autoReplyMessage:            settings?.autoReplyMessage           ?? "Oi! Recebi sua mensagem e responderei em breve. 😊",
        followupEnabled:             settings?.followupEnabled            ?? false,
        followup7DaysEnabled:        settings?.followup7DaysEnabled       ?? true,
        followup30DaysEnabled:       settings?.followup30DaysEnabled      ?? true,
        npsEnabled:                  settings?.npsEnabled                 ?? false,
        npsDaysAfterDelivery:        settings?.npsDaysAfterDelivery       ?? 7,
        autoDeductStock:             settings?.autoDeductStock            ?? true,
        lowStockAlertEnabled:        settings?.lowStockAlertEnabled       ?? true,
        portfolioEnabled:            settings?.portfolioEnabled           ?? true,
        portfolioLeadFormEnabled:    settings?.portfolioLeadFormEnabled   ?? false,
        portfolioTestimonialsEnabled: settings?.portfolioTestimonialsEnabled ?? false,
      }}
    />
  );
}
