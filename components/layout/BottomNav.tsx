"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, Layers,
  Users, DollarSign, Settings,
} from "lucide-react";

const items = [
  { href: "/dashboard",   label: "Início",      icon: LayoutDashboard, exact: true },
  { href: "/orcamentos",  label: "Orçamentos",  icon: FileText },
  { href: "/producao",    label: "Produção",    icon: Layers },
  { href: "/clientes",    label: "Clientes",    icon: Users },
  { href: "/financeiro",  label: "Financeiro",  icon: DollarSign },
  { href: "/configuracoes", label: "Config",    icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-border bg-surface md:hidden safe-area-bottom">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(href, exact);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-text-muted"
            )}
          >
            <Icon className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "text-text-muted")} />
            <span>{label}</span>
            {active && (
              <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
