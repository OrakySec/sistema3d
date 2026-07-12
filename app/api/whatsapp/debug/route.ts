import { NextResponse } from "next/server";
import { auth }         from "@/auth";
import { prisma }       from "@/lib/prisma";

const EVO_URL = process.env.EVOLUTION_API_URL ?? "(não configurado)";
const EVO_KEY = process.env.EVOLUTION_API_KEY ?? "(não configurado)";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { evolutionInstance: true },
  });

  const result: Record<string, unknown> = {
    evo_url:  EVO_URL,
    evo_key_set: EVO_KEY !== "(não configurado)" && EVO_KEY.length > 5,
    instance: user?.evolutionInstance ?? null,
  };

  if (!user?.evolutionInstance) {
    return NextResponse.json({ ...result, step: "no_instance" });
  }

  // Testa /instance/connectionState
  try {
    const r1   = await fetch(`${EVO_URL}/instance/connectionState/${user.evolutionInstance}`, {
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    });
    result.connectionState_status = r1.status;
    result.connectionState_body   = await r1.json();
  } catch (e) {
    result.connectionState_error = String(e);
  }

  // Testa /instance/connect
  try {
    const r2   = await fetch(`${EVO_URL}/instance/connect/${user.evolutionInstance}`, {
      headers: { "Content-Type": "application/json", apikey: EVO_KEY },
    });
    result.connect_status = r2.status;
    result.connect_body   = await r2.json();
  } catch (e) {
    result.connect_error = String(e);
  }

  return NextResponse.json(result);
}
