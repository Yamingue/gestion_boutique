"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatutFacture } from "@/generated/prisma/enums";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non authentifié");
  return session;
}

// ── Numérotation automatique FAC-YYYY-MM-NNN ──────────────────────────────

async function genererNumero(): Promise<string> {
  const now   = new Date();
  const annee = now.getFullYear();
  const mois  = now.getMonth() + 1;

  const sequence = await prisma.sequenceFacture.upsert({
    where:  { annee_mois: { annee, mois } },
    update: { dernier: { increment: 1 } },
    create: { annee, mois, dernier: 1 },
  });

  const num     = String(sequence.dernier).padStart(3, "0");
  const moisStr = String(mois).padStart(2, "0");
  return `FAC-${annee}-${moisStr}-${num}`;
}

// ── Création facture ────────────────────────────────────────────────────────

interface LigneInput {
  produitId: string;
  quantite: number;
  prixUnitaire: number;
}

export async function creerFacture(formData: FormData) {
  const session = await requireAuth();

  const clientId    = formData.get("clientId") as string;
  const notes       = (formData.get("notes") as string | null)?.trim() ?? null;
  const statutRaw   = (formData.get("statut") as string | null) ?? "";
  const statut: StatutFacture =
    Object.values(StatutFacture).includes(statutRaw as StatutFacture)
      ? (statutRaw as StatutFacture)
      : StatutFacture.EN_ATTENTE;

  // Lignes encodées en JSON depuis le formulaire client
  const lignesRaw = formData.get("lignes") as string;
  let lignes: LigneInput[] = [];
  try {
    lignes = JSON.parse(lignesRaw);
  } catch {
    return { error: "Lignes de facture invalides." };
  }

  if (!clientId)          return { error: "Veuillez sélectionner un client." };
  if (lignes.length === 0) return { error: "Ajoutez au moins un produit." };

  for (const l of lignes) {
    if (l.quantite <= 0) return { error: "Les quantités doivent être supérieures à 0." };
  }

  const totalTTC = lignes.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);

  // Transaction : numérotation + création + décrémentation stock
  await prisma.$transaction(async (tx) => {
    const numero = await genererNumero();

    await tx.facture.create({
      data: {
        numero,
        clientId,
        vendeurId: session.user.id,
        statut,
        totalTTC,
        notes,
        lignes: {
          create: lignes.map((l) => ({
            produitId:    l.produitId,
            quantite:     l.quantite,
            prixUnitaire: l.prixUnitaire,
          })),
        },
      },
    });

    // Décrémenter le stock de chaque produit
    for (const l of lignes) {
      await tx.produit.update({
        where: { id: l.produitId },
        data:  { stockActuel: { decrement: l.quantite } },
      });
    }
  });

  revalidatePath("/factures");
  revalidatePath("/catalogue");
  revalidatePath("/dashboard");
  revalidatePath("/vente");
  return { error: null };
}

// ── Changer le statut ───────────────────────────────────────────────────────

export async function changerStatut(id: string, statut: StatutFacture) {
  const session = await requireAuth();

  const facture = await prisma.facture.findUnique({
    where: { id },
    include: { lignes: true },
  });
  if (!facture) throw new Error("Facture introuvable.");

  const isAdmin = session.user.role === "ADMIN";

  // Seul l'admin ou le vendeur propriétaire peut modifier
  if (!isAdmin && facture.vendeurId !== session.user.id) {
    throw new Error("Accès refusé.");
  }

  // Un VENDEUR ne peut pas modifier une facture déjà payée ou annulée
  if (!isAdmin && facture.statut !== StatutFacture.EN_ATTENTE) {
    throw new Error("Impossible : seul un administrateur peut modifier une facture déjà validée ou annulée.");
  }

  // Si on annule → réincrémenter le stock
  if (statut === StatutFacture.ANNULEE && facture.statut !== StatutFacture.ANNULEE) {
    await prisma.$transaction(async (tx) => {
      for (const l of facture.lignes) {
        await tx.produit.update({
          where: { id: l.produitId },
          data:  { stockActuel: { increment: l.quantite } },
        });
      }
      await tx.facture.update({ where: { id }, data: { statut } });
    });
  } else {
    await prisma.facture.update({ where: { id }, data: { statut } });
  }

  revalidatePath("/factures");
  revalidatePath("/dashboard");
}
