"use client";

import { cn } from "@/lib/utils";
import { InfoTip } from "@/components/shared/InfoTip";

interface SettingToggleProps {
  /** Label do toggle */
  label: string;
  /** Descrição curta abaixo do label */
  description?: string;
  /** Texto de ajuda exibido no ⓘ */
  info?: string;
  /** Estado atual */
  enabled: boolean;
  /** Callback ao mudar */
  onChange: (enabled: boolean) => void;
  /** Desabilitar o toggle (ex: feature não disponível no plano) */
  disabled?: boolean;
  /** Mensagem quando desabilitado */
  disabledReason?: string;
  /** Conteúdo adicional renderizado quando enabled=true */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Toggle de configuração com label, descrição e ícone ⓘ de ajuda.
 * Quando há filhos, eles aparecem com animação abaixo ao ativar.
 */
export function SettingToggle({
  label,
  description,
  info,
  enabled,
  onChange,
  disabled,
  disabledReason,
  children,
  className,
}: SettingToggleProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface transition-all duration-200",
        disabled && "opacity-60",
        className
      )}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Texto */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-primary">{label}</p>
            {info && (
              <InfoTip
                title={label}
                content={info}
                side="right"
              />
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-text-secondary">{description}</p>
          )}
          {disabled && disabledReason && (
            <p className="mt-1 text-xs font-medium text-warning">
              {disabledReason}
            </p>
          )}
        </div>

        {/* Switch */}
        <button
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? "Desativar" : "Ativar"} ${label}`}
          disabled={disabled}
          onClick={() => !disabled && onChange(!enabled)}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
            enabled ? "bg-primary" : "bg-surface-hover",
            disabled && "cursor-not-allowed"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
              enabled ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Sub-configurações (aparecem quando enabled) */}
      {children && enabled && (
        <div className="border-t border-border px-4 pb-4 pt-3 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  );
}
