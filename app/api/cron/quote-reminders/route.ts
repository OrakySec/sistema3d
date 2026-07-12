/**
 * Cron job — envia lembretes de orçamentos que expiram amanhã.
 * Chamar 1x/dia: GET /api/cron/quote-reminders?secret=<CRON_SECRET>
 */
import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";
import { sendWhatsAppMessage, normalizePhone, interpolate, isSilentHour } from "@/lib/whatsapp";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  // Orçamentos que expiram amanhã, status SENT, com cliente tendo whatsapp
  const quotes = await prisma.quote.findMany({
    where: {
      expiresAt: { gte: tomorrow, lt: dayAfter },
      status:    "SENT",
      client:    { whatsapp: { not: null } },
    },
    include: {
      client: { select: { name: true, whatsapp: true } },
      user:   { select: { id: true, evolutionInstance: true, evolutionConnected: true } },
    },
  });

  let sent = 0;

  for (const quote of quotes) {
    const settings = await prisma.userSettings.findUnique({ where: { userId: quote.userId } });

    if (
      !settings?.whatsappAutoEnabled ||
      !settings.quoteReminderEnabled ||
      !settings.quoteReminderMessage ||
      !quote.user.evolutionInstance ||
      !quote.user.evolutionConnected ||
      !quote.client?.whatsapp ||
      !normalizePhone(quote.client.whatsapp)
    ) continue;

    if (settings.silentHoursEnabled && isSilentHour(settings.silentHoursStart, settings.silentHoursEnd)) {
      continue;
    }

    const valor = quote.totalPrice.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const data  = quote.expiresAt?.toLocaleDateString("pt-BR") ?? "";
    const nome  = quote.client.name?.split(" ")[0] ?? "cliente";

    await sendWhatsAppMessage({
      instanceName: quote.user.evolutionInstance,
      phone:        quote.client.whatsapp!,
      message:      interpolate(settings.quoteReminderMessage, { nome, valor, data }),
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
