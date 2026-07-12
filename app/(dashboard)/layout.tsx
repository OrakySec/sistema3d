import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { PastDueBanner } from "@/components/shared/PastDueBanner";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Dashboard",
    template: "%s | 3D Print Manager",
  },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isPastDue = session?.user?.id
    ? (await prisma.user.findUnique({
        where:  { id: session.user.id },
        select: { subscriptionStatus: true },
      }))?.subscriptionStatus === "PAST_DUE"
    : false;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — oculta no mobile */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Conteúdo principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {isPastDue && <PastDueBanner />}
        <Header />
        <main className="flex-1 overflow-y-auto bg-background p-3 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      {/* Bottom nav — só mobile */}
      <BottomNav />
    </div>
  );
}
