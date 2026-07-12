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

  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  const [user, settings, clientsCount, printersCount, filamentsCount, quotesCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        businessName: true, whatsapp: true, city: true,
        infinitypayHandle: true, infinitypayEnabled: true, evolutionConnected: true,
        plan: true, subscriptionStatus: true, currentPeriodEnd: true,
        stripeCustomerId: true, stripeSubscriptionId: true,
      },
    }),
    prisma.userSettings.findUnique({ where: { userId } }),
    prisma.client.count({ where: { userId } }),
    prisma.printer.count({ where: { userId } }),
    prisma.filament.count({ where: { userId } }),
    prisma.quote.count({ where: { userId, createdAt: { gte: start } } }),
  ]);

  return (
    <ConfiguracoesClient
      whatsappConnected={!!user?.evolutionConnected}
      infinitypayHandle={user?.infinitypayHandle ?? undefined}
      plan={user?.plan ?? "FREE"}
      subscriptionStatus={user?.subscriptionStatus ?? "TRIAL"}
      currentPeriodEnd={user?.currentPeriodEnd?.toISOString() ?? null}
      hasStripeId={!!user?.stripeSubscriptionId}
      usageCounts={{ clients: clientsCount, printers: printersCount, filaments: filamentsCount, quotesThisMonth: quotesCount }}
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
        autoReplyMessage:            settings?.autoReplyMessage           ?? "Olá! Recebi sua mensagem e responderei em breve. 😊",
        quoteReminderMessage:        settings?.quoteReminderMessage       ?? "Olá {{nome}}! Seu orçamento de {{valor}} expira em {{data}}. Posso ajudar com alguma dúvida?",
        productionMessage:           settings?.productionMessage          ?? "",
        postProdMessage:             settings?.postProdMessage            ?? "",
        readyMessage:                settings?.readyMessage               ?? "",
        followupEnabled:             settings?.followupEnabled            ?? false,
        followup7DaysEnabled:        settings?.followup7DaysEnabled       ?? true,
        followup7DaysMessage:        settings?.followup7DaysMessage       ?? "Olá {{nome}}! 😊 Passando para saber se ficou satisfeito com sua impressão 3D. Ficou alguma dúvida?",
        followup30DaysEnabled:       settings?.followup30DaysEnabled      ?? true,
        followup30DaysMessage:       settings?.followup30DaysMessage      ?? "Olá {{nome}}! 👋 Faz um mês desde sua última impressão 3D. Tem algum novo projeto que posso ajudar?",
        npsEnabled:                  settings?.npsEnabled                 ?? false,
        npsDaysAfterDelivery:        settings?.npsDaysAfterDelivery       ?? 7,
        npsMessage:                  settings?.npsMessage                 ?? "Olá {{nome}}! Em uma escala de 0 a 10, quanto você recomendaria nosso serviço para um amigo? Responda com o número 😊",
        autoDeductStock:             settings?.autoDeductStock            ?? true,
        lowStockAlertEnabled:        settings?.lowStockAlertEnabled       ?? true,
        portfolioEnabled:            settings?.portfolioEnabled           ?? true,
        portfolioLeadFormEnabled:    settings?.portfolioLeadFormEnabled   ?? false,
        portfolioTestimonialsEnabled: settings?.portfolioTestimonialsEnabled ?? false,
      }}
    />
  );
}
