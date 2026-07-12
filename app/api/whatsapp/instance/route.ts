import { NextResponse } from "next/server";
import { auth }         from "@/auth";
import { prisma }       from "@/lib/prisma";
import QRCode           from "qrcode";

const EVO_URL = process.env.EVOLUTION_API_URL!;
const EVO_KEY = process.env.EVOLUTION_API_KEY!;

function evoHeaders() {
  return { "Content-Type": "application/json", apikey: EVO_KEY };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// GET — busca status da instância
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { evolutionInstance: true, evolutionConnected: true },
  });

  if (!user?.evolutionInstance) {
    return NextResponse.json({ status: "not_created" });
  }

  try {
    const res  = await fetch(`${EVO_URL}/instance/connectionState/${user.evolutionInstance}`, {
      headers: evoHeaders(),
    });
    const data = await res.json();
    const connected = data?.instance?.state === "open";

    await prisma.user.update({
      where: { id: session.user.id },
      data:  { evolutionConnected: connected },
    });

    return NextResponse.json({
      status:   connected ? "connected" : "disconnected",
      instance: user.evolutionInstance,
      state:    data?.instance?.state,
    });
  } catch {
    return NextResponse.json({ status: "error" });
  }
}

// POST — cria instância e retorna QR Code
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const instanceName = `user_${session.user.id.slice(0, 8)}`;

  try {
    // Tenta deletar instância existente para garantir estado limpo
    await fetch(`${EVO_URL}/instance/delete/${instanceName}`, {
      method:  "DELETE",
      headers: evoHeaders(),
    }).catch(() => {});

    await sleep(500);

    // Cria nova instância
    const createRes = await fetch(`${EVO_URL}/instance/create`, {
      method:  "POST",
      headers: evoHeaders(),
      body: JSON.stringify({
        instanceName,
        integration:  "WHATSAPP-BAILEYS",
        qrcode:       true,
        reject_call:  false,
        groupsIgnore: false,
      }),
    });

    const createData = await createRes.json();
    console.log("[whatsapp/instance POST] create response:", JSON.stringify(createData).slice(0, 500));

    await prisma.user.update({
      where: { id: session.user.id },
      data:  { evolutionInstance: instanceName, evolutionConnected: false },
    });

    async function extractQr(data: Record<string, unknown>): Promise<string | null> {
      let base64 = (data?.base64 ?? (data?.qrcode as Record<string, unknown>)?.base64 ?? null) as string | null;
      if (!base64) {
        const code = (data?.code ?? (data?.qrcode as Record<string, unknown>)?.code ?? null) as string | null;
        if (code && code.length > 10) base64 = await QRCode.toDataURL(code, { width: 256, margin: 2 });
      }
      return base64;
    }

    // Tenta pegar QR da resposta de criação
    let qrcode = await extractQr(createData as Record<string, unknown>);

    // Se não veio, aguarda e busca via /connect
    if (!qrcode) {
      await sleep(2000);
      for (let i = 0; i < 5; i++) {
        if (i > 0) await sleep(2000);
        try {
          const qrRes  = await fetch(`${EVO_URL}/instance/connect/${instanceName}`, {
            headers: evoHeaders(),
          });
          const qrData = await qrRes.json();
          console.log(`[whatsapp/instance POST] connect attempt ${i + 1}:`, JSON.stringify(qrData).slice(0, 300));
          qrcode = await extractQr(qrData as Record<string, unknown>);
          if (qrcode) break;
        } catch {}
      }
    }

    return NextResponse.json({ instance: instanceName, qrcode });
  } catch (err) {
    console.error("[whatsapp/instance POST]", err);
    return NextResponse.json({ error: "Erro ao criar instância" }, { status: 500 });
  }
}

// DELETE — desconecta e remove instância
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { evolutionInstance: true },
  });

  if (user?.evolutionInstance) {
    await fetch(`${EVO_URL}/instance/delete/${user.evolutionInstance}`, {
      method:  "DELETE",
      headers: evoHeaders(),
    }).catch(() => {});
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { evolutionInstance: null, evolutionConnected: false },
  });

  return NextResponse.json({ ok: true });
}
