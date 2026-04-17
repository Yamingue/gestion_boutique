import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import UserForm from "@/components/UserForm";
import { modifierUtilisateur } from "@/lib/actions/utilisateurs";

export const metadata = { title: "Modification compte — Utilisateurs" };

export default async function EditerUtilisateurPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
  });

  if (!user) notFound();

  // On crée un wrapper d'action pour injecter l'ID statiquement
  const actionLiee = modifierUtilisateur.bind(null, user.id);

  return (
    <>
      <Header title="Modifier l'utilisateur" subtitle={`Édition des accès de ${user.nom}`} />
      <UserForm user={user} action={actionLiee} />
    </>
  );
}
