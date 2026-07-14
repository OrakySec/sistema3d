"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, FileText, Layers, Users, DollarSign,
  Package, Printer, BookOpen, Settings, Menu, X,
} from "lucide-react";
import { useState, useEffect } from "react";
import type { Plan } from "@/lib/plans";

// 5 itens fixos no menu inferior
const mainItems = [
  { href: "/dashboard",  label: "Início",     icon: LayoutDashboard, exact: true },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/producao",   label: "Produção",   icon: Layers },
  { href: "/clientes",   label: "Clientes",   icon: Users },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
];

// Itens que ficam no menu "Mais"
const moreItems = [
  { href: "/estoque",        label: "Estoque",      icon: Package },
  { href: "/impressoras",    label: "Impressoras",  icon: Printer },
  { href: "/portfolio",      label: "Catálogo",     icon: BookOpen, requiredPlan: "STUDIO" as Plan },
  { href: "/configuracoes",  label: "Configurações",icon: Settings },
];

interface BottomNavProps {
  plan?: Plan;
}

export function BottomNav({ plan = "FREE" }: BottomNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Notifica o SupportButton quando o menu abre/fecha
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("bottomnav:more", { detail: { open } }));
  }, [open]);

  // Fecha ao navegar
  useEffect(() => { setOpen(false); }, [pathname]);

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  const moreActive = moreItems.some((i) => isActive(i.href));
  const planOrder: Plan[] = ["FREE", "PRO", "STUDIO"];

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Painel "Mais" */}
      {open && (
        <div className="fixed bottom-16 left-0 right-0 z-50 border-t border-border bg-surface md:hidden animate-in slide-in-from-bottom-2 duration-200">
          <div className="grid grid-cols-4 gap-1 p-3">
            {moreItems.map(({ href, label, icon: Icon, requiredPlan }) => {
              const active = isActive(href);
              const locked = requiredPlan
                ? planOrder.indexOf(plan) < planOrder.indexOf(requiredPlan)
                : false;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 rounded-xl py-3 text-[11px] font-medium transition-colors",
                    active ? "bg-primary-subtle text-primary" : "text-text-secondary hover:bg-surface-hover"
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-text-muted")} />
                    {locked && (
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-warning" />
                    )}
                  </div>
                  <span className="text-center leading-tight">{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Barra inferior */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t border-border bg-surface md:hidden safe-area-bottom">
        {mainItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-text-muted"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
              )}
              <Icon className={cn("h-5 w-5 shrink-0", active ? "text-primary" : "text-text-muted")} />
              <span>{label}</span>
            </Link>
          );
        })}

        {/* Botão Mais */}
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
            open || moreActive ? "text-primary" : "text-text-muted"
          )}
        >
          {(open || moreActive) && (
            <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />
          )}
          {open
            ? <X className="h-5 w-5 shrink-0 text-primary" />
            : <Menu className="h-5 w-5 shrink-0" />
          }
          <span>Mais</span>
        </button>
      </nav>
    </>
  );
}
