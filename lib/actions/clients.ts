"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non authentifié");
  return session;
}

async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("Accès refusé : réservé aux administrateurs.");
}

export async function creerClient(formData: FormData) {
  await requireAuth();

  const nom       = (formData.get("nom") as string).trim();
  const telephone = (formData.get("telephone") as string).trim();
  const email     = (formData.get("email") as string).trim();
  const adresse   = (formData.get("adresse") as string).trim();

  if (!nom) return { error: "Le nom est obligatoire." };

  await prisma.client.create({
    data: {
      nom,
      telephone: telephone || null,
      email:     email     || null,
      adresse:   adresse   || null,
    },
  });

  revalidatePath("/clients");
  redirect("/clients");
}

export async function modifierClient(id: string, formData: FormData) {
  await requireAuth();

  const nom       = (formData.get("nom") as string).trim();
  const telephone = (formData.get("telephone") as string).trim();
  const email     = (formData.get("email") as string).trim();
  const adresse   = (formData.get("adresse") as string).trim();

  if (!nom) return { error: "Le nom est obligatoire." };

  await prisma.client.update({
    where: { id },
    data: {
      nom,
      telephone: telephone || null,
      email:     email     || null,
      adresse:   adresse   || null,
    },
  });

  revalidatePath("/clients");
  redirect("/clients");
}

/** Version POS : crée le client et le retourne directement (pas de redirect) */
export async function creerClientRapide(formData: FormData) {
  await requireAuth();

  const nom       = (formData.get("nom") as string).trim();
  const telephone = (formData.get("telephone") as string).trim();
  const email     = (formData.get("email") as string).trim();

  if (!nom) return { error: "Le nom est obligatoire.", client: null };

  const client = await prisma.client.create({
    data: {
      nom,
      telephone: telephone || null,
      email:     email     || null,
    },
  });

  revalidatePath("/clients");
  revalidatePath("/vente");
  return { error: null, client };
}

export async function supprimerClient(id: string) {
  await requireAdmin();

  const nbFactures = await prisma.facture.count({ where: { clientId: id } });
  if (nbFactures > 0) {
    throw new Error(`Impossible : ce client a ${nbFactures} facture(s) associée(s).`);
  }

  await prisma.client.delete({ where: { id } });
  revalidatePath("/clients");
}
