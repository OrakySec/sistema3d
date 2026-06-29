import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/components/providers/SessionProvider";
import "./globals.css";

// ── Fontes ─────────────────────────────────────────────────
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

// ── Viewport ────────────────────────────────────────────────
export const viewport: Viewport = {
  themeColor: "#09090B",
  colorScheme: "dark",
};

// ── Metadata ────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "3D Print Manager",
    template: "%s | 3D Print Manager",
  },
  description:
    "Sistema de gestão profissional para impressoras 3D — orçamentos, produção, clientes e financeiro.",
  keywords: ["impressão 3D", "orçamento", "gestão", "3D Print"],
  authors: [{ name: "3D Print Manager" }],
  robots: "noindex, nofollow", // App privado — não indexar
};

// ── Layout ──────────────────────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${outfit.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-text-primary antialiased">
        <SessionProvider>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
