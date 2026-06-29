import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const EVO_URL = process.env.EVOLUTION_API_URL!;
const EVO_KEY = process.env.EVOLUTION_API_KEY!;

// GET — busca QR Code atualizado da instância
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { evolutionInstance: true },
  });

  if (!user?.evolutionInstance) {
    return NextResponse.json({ error: "Instância não criada" }, { status: 404 });
  }

  try {
    const res = await fetch(`${EVO_URL}/instance/connect/${user.evolutionInstance}`, {
      headers: { apikey: EVO_KEY },
    });
    const data = await res.json();

    return NextResponse.json({
      qrcode:     data?.base64 ?? data?.qrcode?.base64 ?? null,
      pairingCode: data?.pairingCode ?? null,
      state:      data?.instance?.state ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao buscar QR Code" }, { status: 500 });
  }
}
