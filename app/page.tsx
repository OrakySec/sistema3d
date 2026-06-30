import { redirect } from "next/navigation";
import { auth } from "@/auth";
import LandingPage from "./_landing/LandingPage";

export const metadata = {
  title: "3D Print Manager — Gestão profissional para impressão 3D",
  description: "Calcule orçamentos com custo real, envie links de aprovação online, controle produção e financeiro. O sistema de gestão para makers de impressão 3D.",
  robots: "index, follow",
};

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return <LandingPage />;
}
