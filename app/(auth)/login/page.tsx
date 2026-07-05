import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Connexion — Tching's Fils Multiservices" };

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/backoffice/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-bleu">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        {/* Logo / En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-orange mb-4">
            <span className="text-white text-2xl font-bold">T</span>
          </div>
          <h1 className="text-xl font-bold text-brand-bleu leading-tight">
            Tching&apos;s Fils Multiservices
          </h1>
          <p className="text-sm text-gray-500 mt-1">Espace de gestion</p>
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
