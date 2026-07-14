import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin — Usuários" };

const ADMIN_EMAIL = "orakysec@gmail.com";

const PLAN_BADGE: Record<string, string> = {
  FREE:   "bg-zinc-800 text-zinc-400",
  PRO:    "bg-blue-950 text-blue-400",
  STUDIO: "bg-orange-950 text-orange-400",
};

const STATUS_BADGE: Record<string, string> = {
  TRIAL:    "bg-yellow-950 text-yellow-400",
  ACTIVE:   "bg-green-950 text-green-400",
  PAST_DUE: "bg-red-950 text-red-400",
  CANCELED: "bg-zinc-800 text-zinc-500",
  UNPAID:   "bg-red-950 text-red-400",
};

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== ADMIN_EMAIL) redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id:                 true,
      name:               true,
      email:              true,
      plan:               true,
      subscriptionStatus: true,
      createdAt:          true,
      currentPeriodEnd:   true,
      evolutionConnected: true,
      _count: {
        select: { quotes: true, clients: true },
      },
    },
  });

  const total   = users.length;
  const paying  = users.filter((u) => u.plan !== "FREE" && u.subscriptionStatus === "ACTIVE").length;
  const free    = users.filter((u) => u.plan === "FREE").length;
  const pro     = users.filter((u) => u.plan === "PRO"    && u.subscriptionStatus === "ACTIVE").length;
  const studio  = users.filter((u) => u.plan === "STUDIO" && u.subscriptionStatus === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="font-display text-2xl font-bold text-text-primary">Usuários cadastrados</h1>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total",    value: total,   color: "text-text-primary" },
          { label: "Pagantes", value: paying,  color: "text-green-400" },
          { label: "Pro",      value: pro,     color: "text-blue-400" },
          { label: "Studio",   value: studio,  color: "text-orange-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs text-text-muted">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-text-muted">
              <th className="px-4 py-3 font-medium">Nome / Email</th>
              <th className="px-4 py-3 font-medium">Plano</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Orçamentos</th>
              <th className="px-4 py-3 font-medium">Clientes</th>
              <th className="px-4 py-3 font-medium">WhatsApp</th>
              <th className="px-4 py-3 font-medium">Cadastro</th>
              <th className="px-4 py-3 font-medium">Venc. plano</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-hover transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-text-primary">{u.name ?? "—"}</p>
                  <p className="text-xs text-text-muted">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PLAN_BADGE[u.plan] ?? ""}`}>
                    {u.plan}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[u.subscriptionStatus] ?? ""}`}>
                    {u.subscriptionStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">{u._count.quotes}</td>
                <td className="px-4 py-3 text-text-secondary">{u._count.clients}</td>
                <td className="px-4 py-3">
                  {u.evolutionConnected
                    ? <span className="text-xs text-green-400 font-medium">Conectado</span>
                    : <span className="text-xs text-text-muted">—</span>}
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  {new Date(u.createdAt).toLocaleDateString("pt-BR")}
                </td>
                <td className="px-4 py-3 text-text-muted text-xs">
                  {u.currentPeriodEnd
                    ? new Date(u.currentPeriodEnd).toLocaleDateString("pt-BR")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <p className="py-12 text-center text-sm text-text-muted">Nenhum usuário cadastrado.</p>
        )}
      </div>
    </div>
  );
}
