import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendConversionEvent } from "@/lib/meta";
import crypto from "crypto";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado." },
        { status: 409 }
      );
    }

    const hashed = await bcrypt.hash(password, 12);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        trialEndsAt,
        subscriptionStatus: "TRIAL",
        settings: {
          create: {},
        },
      },
    });

    const clientIp  = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    const userAgent = req.headers.get("user-agent") ?? null;
    const cookieHeader = req.headers.get("cookie") ?? "";
    const fbc = cookieHeader.match(/_fbc=([^;]+)/)?.[1] ?? null;
    const fbp = cookieHeader.match(/_fbp=([^;]+)/)?.[1] ?? null;
    const userData = { email, name, fbc, fbp, clientIp, userAgent };

    const eventId = crypto.randomUUID();
    await Promise.all([
      sendConversionEvent({ eventName: "CompleteRegistration", eventId, userData }),
      sendConversionEvent({ eventName: "StartTrial", eventId: crypto.randomUUID(), userData }),
    ]);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
