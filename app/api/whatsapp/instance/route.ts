import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const EVO_URL = process.env.EVOLUTION_API_URL!;
const EVO_KEY = process.env.EVOLUTION_API_KEY!;

function evoHeaders() {
  return { "Content-Type": "application/json", apikey: EVO_KEY };
}

// GET — busca status da instância do usuário
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { evolutionInstance: true, evolutionConnected: true },
  });

  if (!user?.evolutionInstance) {
    return NextResponse.json({ status: "not_created" });
  }

  try {
    const res = await fetch(`${EVO_URL}/instance/connectionState/${user.evolutionInstance}`, {
      headers: evoHeaders(),
    });
    const data = await res.json();
    const connected = data?.instance?.state === "open";

    // Atualiza status no banco
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
    const res = await fetch(`${EVO_URL}/instance/create`, {
      method:  "POST",
      headers: evoHeaders(),
      body: JSON.stringify({
        instanceName,
        integration: "WHATSAPP-BAILEYS",
        qrcode:      true,
        reject_call: false,
        groupsIgnore: false,
      }),
    });

    const data = await res.json();

    // Salva a instância no usuário
    await prisma.user.update({
      where: { id: session.user.id },
      data:  { evolutionInstance: instanceName, evolutionConnected: false },
    });

    return NextResponse.json({
      instance: instanceName,
      qrcode:   data?.qrcode?.base64 ?? data?.base64 ?? null,
      pairingCode: data?.qrcode?.pairingCode ?? null,
    });
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
