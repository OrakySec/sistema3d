"use client";

import { Bell, LogOut, ChevronDown, Loader2, Zap } from "lucide-react";
import { useState, useTransition } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getNotifications, type Notification } from "@/lib/actions/notifications";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":    "Dashboard",
  "/orcamentos":   "Orçamentos",
  "/producao":     "Produção",
  "/clientes":     "Clientes",
  "/financeiro":   "Financeiro",
  "/estoque":      "Estoque",
  "/impressoras":  "Impressoras",
  "/portfolio":    "Catálogo",
  "/configuracoes":"Configurações",
};

function getPageTitle(pathname: string): string {
  for (const [key, val] of Object.entries(PAGE_TITLES)) {
    if (pathname === key || pathname.startsWith(key + "/")) return val;
  }
  return "3D Print Manager";
}

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded]               = useState(false);
  const [pending, startTransition]        = useTransition();

  const name     = session?.user?.name  ?? "Usuário";
  const email    = session?.user?.email ?? "";
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const pageTitle = getPageTitle(pathname);

  function openNotifs() {
    setNotifOpen(true);
    setUserMenuOpen(false);
    if (!loaded) {
      startTransition(async () => {
        const data = await getNotifications();
        setNotifications(data);
        setLoaded(true);
      });
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4 md:h-16 md:px-6">
      {/* Mobile: logo + título da página */}
      <div className="flex items-center gap-2.5 md:hidden">
        <Link href="/dashboard" className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary shrink-0">
          <Zap className="h-3.5 w-3.5 text-white" />
        </Link>
        <span className="font-display text-sm font-bold text-text-primary">{pageTitle}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-1.5 md:gap-2">
        {/* Notificações */}
        <div className="relative">
          <button
            onClick={openNotifs}
            className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <Bell className="h-4 w-4" />
            {(loaded ? notifications.length > 0 : true) && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              {/* Mobile: painel full-width fixo no topo. Desktop: dropdown */}
              <div className="glass fixed left-0 right-0 top-14 z-50 mx-3 rounded-xl p-2 shadow-lg animate-slide-up md:absolute md:left-auto md:right-0 md:top-10 md:mx-0 md:w-80 md:fixed-none">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Notificações</p>
                  {notifications.length > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                      {notifications.length}
                    </span>
                  )}
                </div>

                {pending ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Bell className="mb-2 h-8 w-8 text-text-disabled" />
                    <p className="text-sm text-text-muted">Nenhuma notificação</p>
                    <p className="text-xs text-text-disabled mt-0.5">Tudo em dia por aqui!</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <NotifItem key={n.id} notification={n} onClick={() => setNotifOpen(false)} />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Avatar / Usuário */}
        <div className="relative">
          <button
            onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
            className="flex h-8 items-center gap-1.5 rounded-lg px-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary md:gap-2 md:px-2"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-full gradient-primary text-xs font-bold text-white shrink-0">
              {initials}
            </div>
            <span className="hidden max-w-[100px] truncate md:block">{name}</span>
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

function NotifItem({ notification: n, onClick }: { notification: Notification; onClick: () => void }) {
  const colors = {
    success: "bg-success",
    warning: "bg-warning",
    error:   "bg-error",
    info:    "bg-info",
  };

  const content = (
    <button
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-hover w-full"
      onClick={onClick}
    >
      <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", colors[n.type])} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{n.title}</p>
        <p className="text-xs text-text-secondary">{n.desc}</p>
      </div>
      <span className="text-xs text-text-muted shrink-0">{n.time}</span>
    </button>
  );

  if (n.href) return <a href={n.href}>{content}</a>;
  return content;
}
