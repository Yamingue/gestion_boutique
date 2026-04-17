"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as bcrypt from "bcryptjs";
import { Role } from "@/generated/prisma/client";

async function verifierAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Accès non autorisé");
  }
}

export async function creerUtilisateur(formData: FormData) {
  try {
    await verifierAdmin();
    
    const nom = formData.get("nom") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as Role;

    if (!nom || !email || !password || !role) return { error: "Tous les champs sont requis." };

    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist) return { error: "Cet email est déjà utilisé." };

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { nom, email, password: hashedPassword, role },
    });
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la création." };
  }

  revalidatePath("/utilisateurs");
  redirect("/utilisateurs");
}

export async function modifierUtilisateur(id: string, formData: FormData) {
  try {
    await verifierAdmin();
    
    const nom = formData.get("nom") as string;
    const email = formData.get("email") as string;
    const role = formData.get("role") as Role;
    const password = formData.get("password") as string;

    if (!nom || !email || !role) return { error: "Les champs obligatoires sont requis." };

    const data: any = { nom, email, role };
    
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const exist = await prisma.user.findUnique({ where: { email } });
    if (exist && exist.id !== id) return { error: "Cet email est déjà utilisé par un autre compte." };

    await prisma.user.update({
      where: { id },
      data,
    });
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la modification." };
  }

  revalidatePath("/utilisateurs");
  redirect("/utilisateurs");
}

export async function supprimerUtilisateur(id: string) {
  try {
    await verifierAdmin();
    
    const facturesCount = await prisma.facture.count({ where: { vendeurId: id } });
    
    if (facturesCount > 0) {
      return { error: "Impossible de supprimer: cet utilisateur est lié à une ou plusieurs factures." };
    }

    await prisma.user.delete({ where: { id } });
    revalidatePath("/utilisateurs");
  } catch (error: any) {
    return { error: error.message || "Erreur lors de la suppression." };
  }
}
