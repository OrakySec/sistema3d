import { NextResponse } from "next/server";
import { auth }         from "@/auth";
import { prisma }       from "@/lib/prisma";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "(não configurado)";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "(não configurado)";

const HEADERS = { "Content-Type": "application/json", apikey: EVO_KEY };

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { evolutionInstance: true },
  });

  const result: Record<string, unknown> = {
    evo_url:     EVO_URL,
    evo_key_set: EVO_KEY !== "(não configurado)" && EVO_KEY.length > 5,
    instance:    user?.evolutionInstance ?? null,
  };

  // Testa /instance/fetchInstances (lista todas as instâncias)
  try {
    const r0 = await fetch(`${EVO_URL}/instance/fetchInstances`, { headers: HEADERS });
    result.fetchInstances_status = r0.status;
    const body = await r0.text();
    try { result.fetchInstances_body = JSON.parse(body); } catch { result.fetchInstances_body = body.slice(0, 200); }
  } catch (e) {
    result.fetchInstances_error = String(e);
  }

  // Testa criação de instância
  const testName = `dbg_${session.user.id.slice(0, 6)}`;
  try {
    const r1 = await fetch(`${EVO_URL}/instance/create`, {
      method:  "POST",
      headers: HEADERS,
      body: JSON.stringify({ instanceName: testName, integration: "WHATSAPP-BAILEYS", qrcode: true }),
    });
    result.create_status = r1.status;
    const body = await r1.text();
    try { result.create_body = JSON.parse(body); } catch { result.create_body = body.slice(0, 300); }

    // Limpa instância de teste
    await fetch(`${EVO_URL}/instance/delete/${testName}`, {
      method: "DELETE", headers: HEADERS,
    }).catch(() => {});
  } catch (e) {
    result.create_error = String(e);
  }

  return NextResponse.json(result);
}
