import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entrar | 3D Print Manager",
  description: "Faça login no seu painel de gestão de impressão 3D.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Painel lateral decorativo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface">
        {/* Gradiente de fundo */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />

        {/* Grid decorativo */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(#F97316 1px, transparent 1px), linear-gradient(to right, #F97316 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Conteúdo do painel */}
        <div className="relative z-10 flex flex-col justify-between p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-glow">
              <span className="text-xl">⚡</span>
            </div>
            <div>
              <p className="font-display text-lg font-bold text-text-primary leading-none">
                3D Print
              </p>
              <p className="font-display text-sm font-semibold text-primary leading-none">
                Manager
              </p>
            </div>
          </div>

          {/* Depoimento / quote */}
          <div className="max-w-sm">
            <p className="font-display text-2xl font-bold leading-snug text-text-primary">
              "Triplicou minha eficiência. Agora sei exatamente quanto cobrar e quanto lucro tenho."
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-sm font-bold text-white">
                RF
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Rafael Fernandes</p>
                <p className="text-xs text-text-muted">Maker profissional, São Paulo</p>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "📊", label: "Dashboard financeiro" },
              { icon: "🖨️", label: "Fila de impressão" },
              { icon: "📋", label: "Orçamentos inteligentes" },
              { icon: "💬", label: "WhatsApp automático" },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface-hover p-3"
              >
                <span className="text-lg">{f.icon}</span>
                <span className="text-xs font-medium text-text-secondary">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        {children}
      </div>
    </div>
  );
}
