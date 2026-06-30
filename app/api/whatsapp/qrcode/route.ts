import { NextResponse } from "next/server";
import { auth }         from "@/auth";
import { prisma }       from "@/lib/prisma";

const EVO_URL = process.env.EVOLUTION_API_URL!;
const EVO_KEY = process.env.EVOLUTION_API_KEY!;

function evoHeaders() {
  return { "Content-Type": "application/json", apikey: EVO_KEY };
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// GET — busca QR Code com retry automático
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

  // Tenta até 3 vezes com intervalo de 1.5s (a Evolution API pode demorar pra gerar o QR)
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await sleep(1500);

    try {
      const res  = await fetch(`${EVO_URL}/instance/connect/${user.evolutionInstance}`, {
        headers: evoHeaders(),
      });

      if (!res.ok) {
        console.error(`[qrcode] attempt ${attempt + 1} status ${res.status}`);
        continue;
      }

      const data = await res.json();
      console.log(`[qrcode] attempt ${attempt + 1} response keys:`, Object.keys(data));

      const qrcode = data?.base64 ?? data?.qrcode?.base64 ?? data?.code ?? null;
      const state  = data?.instance?.state ?? data?.state ?? null;

      if (qrcode) {
        return NextResponse.json({ qrcode, state });
      }

      if (state === "open") {
        return NextResponse.json({ qrcode: null, state: "open" });
      }
    } catch (err) {
      console.error(`[qrcode] attempt ${attempt + 1} error:`, err);
    }
  }

  return NextResponse.json({ error: "QR Code não disponível após 3 tentativas", qrcode: null }, { status: 200 });
}
