import { NextResponse } from "next/server";
import { auth }         from "@/auth";
import { prisma }       from "@/lib/prisma";
import { checkFeature } from "@/lib/limits";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const allowed = await checkFeature(session.user.id, "payment");
  if (!allowed) return NextResponse.json({ ok: false, error: "Plano não permite link de pagamento." }, { status: 403 });

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { infinitypayHandle: true },
  });

  if (!user?.infinitypayHandle) {
    return NextResponse.json({ ok: false, error: "InfinityTag não configurado." });
  }

  try {
    // Tenta criar um link de checkout simbólico para validar o handle
    const res = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: user.infinitypayHandle,
        items: [{ quantity: 1, price: 1, description: "Teste de conexão" }],
      }),
    });

    const data = await res.json().catch(() => ({}));

    // 200/201 = handle válido e link criado
    if (res.ok) return NextResponse.json({ ok: true });

    // 404 com mensagem de handle inválido
    if (res.status === 404 || res.status === 422) {
      return NextResponse.json({ ok: false, error: "InfinityTag não encontrado. Verifique se está correto." });
    }

    return NextResponse.json({ ok: false, error: `Erro ${res.status}: ${JSON.stringify(data)}` });
  } catch {
    return NextResponse.json({ ok: false, error: "Não foi possível conectar à API InfinityPay." });
  }
}
