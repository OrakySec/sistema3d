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

async function codeToBase64(code: string): Promise<string> {
  return QRCode.toDataURL(code, { width: 256, margin: 2 });
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

  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) await sleep(2000);

    try {
      const res = await fetch(`${EVO_URL}/instance/connect/${user.evolutionInstance}`, {
        headers: evoHeaders(),
      });

      if (!res.ok) {
        console.error(`[qrcode] attempt ${attempt + 1} status ${res.status}`);
        continue;
      }

      const data = await res.json();
      console.log(`[qrcode] attempt ${attempt + 1} response:`, JSON.stringify(data).slice(0, 300));

      const state = data?.instance?.state ?? data?.state ?? null;

      if (state === "open") {
        return NextResponse.json({ qrcode: null, state: "open" });
      }

      // Tenta pegar base64 diretamente
      let qrcode: string | null = data?.base64 ?? data?.qrcode?.base64 ?? null;

      // Se não veio base64 mas veio o código texto, converte aqui no servidor
      if (!qrcode) {
        const code = data?.code ?? data?.qrcode?.code ?? null;
        if (code && typeof code === "string" && code.length > 10) {
          qrcode = await codeToBase64(code);
        }
      }

      if (qrcode) {
        return NextResponse.json({ qrcode, state });
      }
    } catch (err) {
      console.error(`[qrcode] attempt ${attempt + 1} error:`, err);
    }
  }

  return NextResponse.json({
    error:  "QR Code não disponível. A Evolution API pode estar iniciando. Aguarde 10 segundos e tente novamente.",
    qrcode: null,
  }, { status: 200 });
}
