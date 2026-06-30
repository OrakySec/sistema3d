"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { checkLimit } from "@/lib/limits";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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

  const { tags, email, ...data } = parsed.data;
  const tagList = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  await prisma.client.create({
    data: { userId, ...data, email: email || null, tags: tagList },
  });

  revalidatePath("/clientes");
  return { ok: true };
}

// Criação rápida — retorna id e name para uso inline em outros formulários
export async function createClientQuick(name: string, whatsapp?: string) {
  const userId = await getUserId();
  if (!name?.trim()) return { error: "Nome obrigatório." };

  const client = await prisma.client.create({
    data: { userId, name: name.trim(), whatsapp: whatsapp?.trim() || null, tags: [] },
    select: { id: true, name: true },
  });

  revalidatePath("/clientes");
  return { ok: true, client };
}

export async function updateClient(clientId: string, formData: FormData) {
  const userId = await getUserId();
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Dados inválidos." };

  const { tags, email, ...data } = parsed.data;
  const tagList = tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  await prisma.client.update({
    where: { id: clientId, userId },
    data: { ...data, email: email || null, tags: tagList },
  });

  revalidatePath("/clientes");
  return { ok: true };
}

export async function deleteClient(clientId: string) {
  const userId = await getUserId();
  await prisma.client.delete({ where: { id: clientId, userId } });
  revalidatePath("/clientes");
}
