import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendConversionEvent } from "@/lib/meta";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { eventName, eventSourceUrl, customData } = await req.json();

    const eventId = crypto.randomUUID();

    // Cookies fbc/fbp
    const cookieHeader = req.headers.get("cookie") ?? "";
    const fbc = cookieHeader.match(/_fbc=([^;]+)/)?.[1] ?? null;
    const fbp = cookieHeader.match(/_fbp=([^;]+)/)?.[1] ?? null;

    // IP e User Agent
    const clientIp  = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;

    // Dados do usuário logado (opcional — eventos anônimos também funcionam)
    let userData = { fbc, fbp, clientIp, userAgent, email: null as string | null, phone: null as string | null, name: null as string | null, city: null as string | null };

    const session = await auth();
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where:  { id: session.user.id },
        select: { email: true, whatsapp: true, name: true, city: true },
      });
      if (user) {
        userData = { ...userData, email: user.email, phone: user.whatsapp, name: user.name, city: user.city };
      }
    }

    // Dispara pixel browser também (para deduplicação)
    const pixelEventId = eventId;

    await sendConversionEvent({ eventName, eventId, eventSourceUrl, userData, customData });

    return NextResponse.json({ ok: true, eventId: pixelEventId });
  } catch (err) {
    console.error("[meta/event]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
