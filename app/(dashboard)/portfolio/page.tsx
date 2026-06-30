import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { NovoOrcamentoButton } from "@/components/shared/NovoOrcamentoButton";
import { CatalogClient } from "./CatalogClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Catálogo" };

export default async function PortfolioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const products = await prisma.catalogProduct.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, description: true,
      productionCost: true, paintingCost: true,
      filamentGrams: true, printHours: true,
      platform: true, platformFee: true,
      marketplacePrice: true, marketplaceMargin: true,
      directPrice: true, directMargin: true,
      quantity: true, createdAt: true,
    },
  });

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Catálogo
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            {products.length} produto{products.length !== 1 ? "s" : ""} publicado{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <NovoOrcamentoButton />
      </div>

      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-text-muted" />
          <h2 className="font-display text-xl font-bold text-text-primary">Catálogo vazio</h2>
          <p className="mt-2 max-w-sm text-sm text-text-secondary">
            Crie um orçamento Marketplace ou Venda Direta e publique o produto aqui para ter um catálogo privado dos seus preços.
          </p>
          <div className="mt-6">
            <NovoOrcamentoButton />
          </div>
        </div>
      ) : (
        <CatalogClient products={products} />
      )}
    </>
  );
}
