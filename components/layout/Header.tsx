"use client";

import { Bell, Search, LogOut, ChevronDown, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { getNotifications, type Notification } from "@/lib/actions/notifications";

export function Header() {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen]   = useState(false);
  const [notifOpen, setNotifOpen]         = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loaded, setLoaded]               = useState(false);
  const [pending, startTransition]        = useTransition();

  const name     = session?.user?.name  ?? "Usuário";
  const email    = session?.user?.email ?? "";
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

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

  function closeNotifs() {
    setNotifOpen(false);
  }

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
              <div className="fixed inset-0 z-40" onClick={closeNotifs} />
              <div className="glass absolute right-0 top-10 z-50 w-80 rounded-xl p-2 shadow-lg animate-slide-up">
                <div className="flex items-center justify-between px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    Notificações
                  </p>
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
                  <div className="flex flex-col gap-1">
                    {notifications.map((n) => (
                      <NotifItem key={n.id} notification={n} onClick={closeNotifs} />
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

  if (n.href) {
    return <a href={n.href}>{content}</a>;
  }
  return content;
}
