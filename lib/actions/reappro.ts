"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatutCommande } from "@/generated/prisma/enums";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non authentifié.");
  return session;
}

async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("Accès refusé.");
  return session;
}

// ── Numérotation automatique CMD-YYYY-MM-NNN ──────────────────────────────

async function genererNumero(): Promise<string> {
  const now   = new Date();
  const annee = now.getFullYear();
  const mois  = now.getMonth() + 1;

  const seq = await prisma.sequenceCommande.upsert({
    where:  { annee_mois: { annee, mois } },
    update: { dernier: { increment: 1 } },
    create: { annee, mois, dernier: 1 },
  });

  return `CMD-${annee}-${String(mois).padStart(2, "0")}-${String(seq.dernier).padStart(3, "0")}`;
}

// ── Créer une commande ────────────────────────────────────────────────────

interface LigneInput {
  produitId:    string;
  quantite:     number;
  prixUnitaire: number;
}

export async function creerCommande(formData: FormData) {
  const session = await requireAdmin();

  const fournisseurId = formData.get("fournisseurId") as string;
  const notes         = (formData.get("notes") as string | null)?.trim() ?? null;
  const lignesRaw     = formData.get("lignes") as string;

  let lignes: LigneInput[] = [];
  try { lignes = JSON.parse(lignesRaw); } catch {
    return { error: "Lignes invalides." };
  }

  if (!fournisseurId)   return { error: "Sélectionnez un fournisseur." };
  if (!lignes.length)   return { error: "Ajoutez au moins un produit." };

  for (const l of lignes) {
    if (l.quantite <= 0) return { error: "Les quantités doivent être > 0." };
  }

  const totalHT = lignes.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);

  await prisma.$transaction(async (tx) => {
    const numero = await genererNumero();
    await tx.commandeReappro.create({
      data: {
        numero,
        fournisseurId,
        createdById: session.user.id,
        totalHT,
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
  });

  revalidatePath("/reappro");
  revalidatePath("/alertes");
  return { error: null };
}

// ── Réceptionner (valider) → incrémente le stock ─────────────────────────

export async function receptionnerCommande(id: string) {
  await requireAdmin();

  const commande = await prisma.commandeReappro.findUnique({
    where:   { id },
    include: { lignes: true },
  });
  if (!commande)                              throw new Error("Commande introuvable.");
  if (commande.statut !== StatutCommande.EN_COURS) throw new Error("Seule une commande EN_COURS peut être réceptionnée.");

  await prisma.$transaction(async (tx) => {
    // Incrémenter le stock de chaque produit
    for (const l of commande.lignes) {
      await tx.produit.update({
        where: { id: l.produitId },
        data:  { stockActuel: { increment: l.quantite } },
      });
    }

    await tx.commandeReappro.update({
      where: { id },
      data:  { statut: StatutCommande.RECUE, receivedAt: new Date() },
    });
  });

  revalidatePath("/reappro");
  revalidatePath("/alertes");
  revalidatePath("/catalogue");
  revalidatePath("/dashboard");
}

// ── Annuler ───────────────────────────────────────────────────────────────

export async function annulerCommande(id: string) {
  await requireAdmin();

  const commande = await prisma.commandeReappro.findUnique({ where: { id } });
  if (!commande)                              throw new Error("Commande introuvable.");
  if (commande.statut !== StatutCommande.EN_COURS) throw new Error("Seule une commande EN_COURS peut être annulée.");

  await prisma.commandeReappro.update({
    where: { id },
    data:  { statut: StatutCommande.ANNULEE },
  });

  revalidatePath("/reappro");
}
