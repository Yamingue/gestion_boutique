import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Header from "@/components/Header";
import UserForm from "@/components/UserForm";
import { creerUtilisateur } from "@/lib/actions/utilisateurs";

export const metadata = { title: "Nouveau compte — Utilisateurs" };

export default async function NouveauUtilisateurPage() {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.role !== "ADMIN") {
    redirect("/backoffice/dashboard");
  }

  return (
    <>
      <Header title="Nouvel utilisateur" subtitle="Donner accès au système à un collaborateur" />
      <UserForm action={creerUtilisateur} />
    </>
  );
}
