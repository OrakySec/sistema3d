/**
 * Webhook da Evolution API — recebe eventos de mensagens recebidas.
 * Usado para: resposta automática.
 *
 * Configure em: Evolution Manager → sua instância → Webhook → URL → <app>/api/whatsapp/webhook
 * Events: MESSAGES_UPSERT
 */
import { NextResponse } from "next/server";
import { prisma }       from "@/lib/prisma";
import { sendWhatsAppMessage, normalizePhone, interpolate, isSilentHour } from "@/lib/whatsapp";

// Guarda o timestamp da última autoresposta por número (em memória — OK para single instance)
const lastAutoReply = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const body  = await req.json();
    const event = body?.event;

    // Só trata mensagens recebidas (não envia autoresposta para mensagens próprias)
    if (event !== "messages.upsert") return NextResponse.json({ ok: true });

    const msg      = body?.data;
    const fromMe   = msg?.key?.fromMe ?? true;
    if (fromMe) return NextResponse.json({ ok: true });

    const instanceName = body?.instance as string | undefined;
    if (!instanceName) return NextResponse.json({ ok: true });

    const fromNumber = msg?.key?.remoteJid?.replace("@s.whatsapp.net", "") ?? null;
    if (!fromNumber) return NextResponse.json({ ok: true });

    // Encontra o usuário dono desta instância
    const user = await prisma.user.findFirst({
      where:  { evolutionInstance: instanceName, evolutionConnected: true },
      select: { id: true, evolutionInstance: true },
    });
    if (!user) return NextResponse.json({ ok: true });

    const settings = await prisma.userSettings.findUnique({ where: { userId: user.id } });
    if (!settings?.whatsappAutoEnabled || !settings.autoReplyEnabled || !settings.autoReplyMessage) {
      return NextResponse.json({ ok: true });
    }

    // Horário silencioso
    if (settings.silentHoursEnabled && isSilentHour(settings.silentHoursStart, settings.silentHoursEnd)) {
      return NextResponse.json({ ok: true });
    }

    // Throttle: não envia mais de 1 autoresposta por número a cada 24h
    const lastSent = lastAutoReply.get(fromNumber) ?? 0;
    const now      = Date.now();
    if (now - lastSent < 24 * 60 * 60 * 1000) {
      return NextResponse.json({ ok: true });
    }

    // Busca nome do cliente pelo número
    const normalized = normalizePhone(fromNumber);
    let clientName = "cliente";
    if (normalized) {
      const client = await prisma.client.findFirst({
        where: { userId: user.id, whatsapp: { contains: normalized.slice(-9) } },
        select: { name: true },
      });
      if (client?.name) clientName = client.name.split(" ")[0];
    }

    await sendWhatsAppMessage({
      instanceName,
      phone:   fromNumber,
      message: interpolate(settings.autoReplyMessage, { nome: clientName }),
    });

    lastAutoReply.set(fromNumber, now);
  } catch (err) {
    console.error("[whatsapp/webhook]", err);
  }

  return NextResponse.json({ ok: true });
}
