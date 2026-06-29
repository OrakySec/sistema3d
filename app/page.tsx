import { redirect } from "next/navigation";

/**
 * Rota raiz — redireciona para o dashboard ou login
 * A verificação de auth é feita pelo middleware
 */
export default function HomePage() {
  redirect("/dashboard");
}
