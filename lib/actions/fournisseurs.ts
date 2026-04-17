"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") throw new Error("Accès refusé.");
}

export async function creerFournisseur(formData: FormData) {
  await requireAdmin();

  const nom       = (formData.get("nom") as string).trim();
  const telephone = (formData.get("telephone") as string).trim();
  const email     = (formData.get("email") as string).trim();
  const adresse   = (formData.get("adresse") as string).trim();

  if (!nom) return { error: "Le nom est obligatoire." };

  await prisma.fournisseur.create({
    data: {
      nom,
      telephone: telephone || null,
      email:     email     || null,
      adresse:   adresse   || null,
    },
  });

  revalidatePath("/fournisseurs");
  redirect("/fournisseurs");
}

export async function modifierFournisseur(id: string, formData: FormData) {
  await requireAdmin();

  const nom       = (formData.get("nom") as string).trim();
  const telephone = (formData.get("telephone") as string).trim();
  const email     = (formData.get("email") as string).trim();
  const adresse   = (formData.get("adresse") as string).trim();

  if (!nom) return { error: "Le nom est obligatoire." };

  await prisma.fournisseur.update({
    where: { id },
    data: {
      nom,
      telephone: telephone || null,
      email:     email     || null,
      adresse:   adresse   || null,
    },
  });

  revalidatePath("/fournisseurs");
  redirect("/fournisseurs");
}

export async function supprimerFournisseur(id: string) {
  await requireAdmin();

  const nb = await prisma.commandeReappro.count({ where: { fournisseurId: id } });
  if (nb > 0) {
    throw new Error(`Impossible : ce fournisseur a ${nb} commande(s) associée(s).`);
  }

  await prisma.fournisseur.delete({ where: { id } });
  revalidatePath("/fournisseurs");
}
