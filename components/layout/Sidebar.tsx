"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Layers,
  Users,
  DollarSign,
  Package,
  Printer,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/orcamentos",
    label: "Orçamentos",
    icon: FileText,
  },
  {
    href: "/producao",
    label: "Produção",
    icon: Layers,
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: Users,
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    icon: DollarSign,
  },
  {
    href: "/estoque",
    label: "Estoque",
    icon: Package,
  },
  {
    href: "/impressoras",
    label: "Impressoras",
    icon: Printer,
  },
  {
    href: "/portfolio",
    label: "Catálogo",
    icon: BookOpen,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-surface transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center border-b border-border",
          collapsed ? "justify-center p-4" : "gap-3 px-5 py-4"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <p className="font-display text-sm font-bold leading-none text-text-primary">
              3D Print
            </p>
            <p className="font-display text-xs font-semibold leading-none text-primary">
              Manager
            </p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary-subtle text-primary"
                  : "text-text-secondary hover:bg-surface-hover hover:text-text-primary",
                collapsed && "justify-center px-0"
              )}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 shrink-0 transition-colors",
                  active ? "text-primary" : "text-text-muted group-hover:text-text-secondary"
                )}
              />
              {!collapsed && (
                <span className="truncate animate-fade-in">{item.label}</span>
              )}
              {/* Indicador ativo */}
              {active && !collapsed && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-1 border-t border-border p-2">
        <Link
          href="/configuracoes"
          title={collapsed ? "Configurações" : undefined}
          className={cn(
            "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-all duration-150 hover:bg-surface-hover hover:text-text-primary",
            collapsed && "justify-center px-0"
          )}
        >
          <Settings className="h-4.5 w-4.5 shrink-0 text-text-muted group-hover:text-text-secondary" />
          {!collapsed && <span>Configurações</span>}
        </Link>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-all duration-150 hover:bg-surface-hover hover:text-text-primary",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 shrink-0" />
              <span>Recolher menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
