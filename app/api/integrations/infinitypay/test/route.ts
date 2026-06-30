import { NextResponse } from "next/server";
import { auth }         from "@/auth";
import { prisma }       from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { infinitypayApiKey: true },
  });

  if (!user?.infinitypayApiKey) {
    return NextResponse.json({ ok: false, error: "Chave da API não configurada." });
  }

  try {
    const res = await fetch("https://api.infinitepay.io/v2/transactions?limit=1", {
      headers: {
        Authorization: `Bearer ${user.infinitypayApiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (res.ok || res.status === 200) {
      return NextResponse.json({ ok: true });
    }

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ ok: false, error: "Chave inválida ou sem permissão." });
    }

    return NextResponse.json({ ok: false, error: `Erro ${res.status} na API InfinityPay.` });
  } catch {
    return NextResponse.json({ ok: false, error: "Não foi possível conectar à API InfinityPay." });
  }
}
