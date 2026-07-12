import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { MetaPixel } from "@/components/shared/MetaPixel";
import "./globals.css";

// ── Fontes ─────────────────────────────────────────────────
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
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
      className={`${jakarta.variable} ${grotesk.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-text-primary antialiased">
        <MetaPixel />
        <SessionProvider>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
