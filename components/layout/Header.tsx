"use client";

import { Bell, Search, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function Header() {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const name    = session?.user?.name  ?? "Usuário";
  const email   = session?.user?.email ?? "";
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-border bg-surface px-6">
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Busca */}
        <button className="flex h-8 items-center gap-2 rounded-lg border border-border bg-background px-3 text-sm text-text-muted transition-colors hover:border-border hover:text-text-secondary">
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:block">Buscar...</span>
          <kbd className="hidden text-xs text-text-disabled sm:block">⌘K</kbd>
        </button>

        {/* Notificações */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="glass absolute right-0 top-10 z-50 w-80 rounded-xl p-2 shadow-lg animate-slide-up">
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Notificações
                </p>
                <div className="flex flex-col gap-1">
                  <NotifItem title="Orçamento aprovado!"    desc="João Silva aprovou o orçamento #007" time="2 min" type="success" />
                  <NotifItem title="Estoque baixo"          desc="PLA Branco abaixo de 200g"           time="1h"   type="warning" />
                  <NotifItem title="Pagamento recebido"     desc="R$ 450,00 via InfinityPay"            time="3h"   type="info"    />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar / Usuário */}
        <div className="relative">
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
            className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full gradient-primary text-xs font-bold text-white">
              {initials}
            </div>
            <span className="hidden max-w-[120px] truncate sm:block">{name}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="glass absolute right-0 top-10 z-50 w-52 rounded-xl p-2 shadow-lg animate-slide-up">
                <div className="border-b border-border px-3 py-2 mb-1">
                  <p className="text-sm font-medium text-text-primary truncate">{name}</p>
                  <p className="text-xs text-text-muted truncate">{email}</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-error hover:bg-error-subtle transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NotifItem({ title, desc, time, type }: {
  title: string; desc: string; time: string; type: "success" | "warning" | "error" | "info";
}) {
  const colors = { success: "bg-success", warning: "bg-warning", error: "bg-error", info: "bg-info" };
  return (
    <button className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover w-full">
      <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", colors[type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-secondary truncate">{desc}</p>
      </div>
      <span className="text-xs text-text-muted shrink-0">{time}</span>
    </button>
  );
}
