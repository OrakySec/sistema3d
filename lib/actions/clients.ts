"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkLimit } from "@/lib/limits";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { normalizePhone } from "@/lib/whatsapp";

function sanitizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const normalized = normalizePhone(raw);
  // Salva no formato de exibição (XX) XXXXX-XXXX mas com número limpo internamente
  const digits = raw.replace(/\D/g, "");
  if (!normalized) return raw.trim() || null; // salva como veio se não conseguir normalizar
  // Formata para exibição: (11) 99999-9999
  if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  return raw.trim();
}

const clientSchema = z.object({
  name:     z.string().min(2),
  whatsapp: z.string().optional(),
  email:    z.string().email().optional().or(z.literal("")),
  city:     z.string().optional(),
  notes:    z.string().optional(),
  tags:     z.string().optional(),
});

async function getUserId() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export async function createClient(formData: FormData) {
  const userId = await getUserId();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const count = await prisma.client.count({ where: { userId } });
  const limitCheck = await checkLimit(userId, "clients", count);
  if (!limitCheck.allowed) return { error: "LIMIT_EXCEEDED", key: "clients", plan: limitCheck.plan, limit: limitCheck.limit };

  const { tags, email, whatsapp, ...data } = parsed.data;
  const tagList = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  await prisma.client.create({
    data: { userId, ...data, whatsapp: sanitizePhone(whatsapp), email: email || null, tags: tagList },
  });

  revalidatePath("/clientes");
  return { ok: true };
}

// Criação rápida — retorna id e name para uso inline em outros formulários
export async function createClientQuick(name: string, whatsapp?: string) {
  const userId = await getUserId();
  if (!name?.trim()) return { error: "Nome obrigatório." };

  const count = await prisma.client.count({ where: { userId } });
  const check = await checkLimit(userId, "clients", count);
  if (check === "LIMIT_EXCEEDED") return { error: "LIMIT_EXCEEDED" };

  const client = await prisma.client.create({
    data: { userId, name: name.trim(), whatsapp: sanitizePhone(whatsapp), tags: [] },
    select: { id: true, name: true },
  });

  revalidatePath("/clientes");
  return { ok: true, client };
}

export async function updateClient(clientId: string, formData: FormData) {
  const userId = await getUserId();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const { tags, email, whatsapp, ...data } = parsed.data;
  const tagList = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  await prisma.client.update({
    where: { id: clientId, userId },
    data: { ...data, whatsapp: sanitizePhone(whatsapp), email: email || null, tags: tagList },
  });

  revalidatePath("/clientes");
  return { ok: true };
}

export async function deleteClient(clientId: string) {
  const userId = await getUserId();
  await prisma.client.delete({ where: { id: clientId, userId } });
  revalidatePath("/clientes");
}
