"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatutCommandeClient, StatutFacture } from "@/generated/prisma/enums";

async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non authentifié");
  return session;
}

// ── Numérotation automatique CDE-YYYY-MM-NNN ──────────────────────────────

async function genererNumero(): Promise<string> {
  const now   = new Date();
  const annee = now.getFullYear();
  const mois  = now.getMonth() + 1;

  const sequence = await prisma.sequenceCommandeClient.upsert({
    where:  { annee_mois: { annee, mois } },
    update: { dernier: { increment: 1 } },
    create: { annee, mois, dernier: 1 },
  });

  const num     = String(sequence.dernier).padStart(3, "0");
  const moisStr = String(mois).padStart(2, "0");
  return `CDE-${annee}-${moisStr}-${num}`;
}

// ── Passer une commande (action PUBLIQUE, sans authentification) ───────────

interface LigneInput {
  produitId: string;
  quantite:  number;
}

export async function passerCommande(formData: FormData) {
  const clientNom       = (formData.get("clientNom") as string | null)?.trim() ?? "";
  const clientTelephone = (formData.get("clientTelephone") as string | null)?.trim() ?? "";
  const clientAdresse   = (formData.get("clientAdresse") as string | null)?.trim() || null;
  const notes           = (formData.get("notes") as string | null)?.trim() || null;

  const lignesRaw = formData.get("lignes") as string;
  let lignes: LigneInput[] = [];
  try {
    lignes = JSON.parse(lignesRaw);
  } catch {
    return { error: "Panier invalide." };
  }

  if (!clientNom)       return { error: "Veuillez indiquer votre nom." };
  if (!clientTelephone) return { error: "Veuillez indiquer votre numéro de téléphone." };
  if (lignes.length === 0) return { error: "Votre panier est vide." };

  // Normalisation / agrégation des quantités par produit
  const parProduit = new Map<string, number>();
  for (const l of lignes) {
    const q = Math.floor(Number(l.quantite));
    if (!l.produitId || !Number.isFinite(q) || q <= 0)
      return { error: "Quantité invalide dans le panier." };
    parProduit.set(l.produitId, (parProduit.get(l.produitId) ?? 0) + q);
  }

  // Re-validation du stock côté serveur (le panier localStorage peut être périmé)
  const produits = await prisma.produit.findMany({
    where:  { id: { in: [...parProduit.keys()] } },
    select: { id: true, nom: true, prixUnitaire: true, stockActuel: true },
  });

  const lignesValidees: {
    produitId: string; nomProduit: string; prixUnitaire: number; quantite: number;
  }[] = [];

  for (const [produitId, quantite] of parProduit) {
    const p = produits.find((x) => x.id === produitId);
    if (!p) return { error: "Un produit du panier n'existe plus." };
    if (p.stockActuel < quantite) {
      return {
        error: `Stock insuffisant pour « ${p.nom} » : ${p.stockActuel} disponible(s).`,
      };
    }
    lignesValidees.push({
      produitId,
      nomProduit:   p.nom,
      prixUnitaire: p.prixUnitaire,
      quantite,
    });
  }

  const total = lignesValidees.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);

  // Aucune décrémentation de stock à ce stade : elle a lieu à la livraison.
  const commande = await prisma.$transaction(async (tx) => {
    const numero = await genererNumero();
    return tx.commande.create({
      data: {
        numero,
        clientNom,
        clientTelephone,
        clientAdresse,
        notes,
        total,
        statut: StatutCommandeClient.EN_ATTENTE,
        lignes: { create: lignesValidees },
      },
      select: { id: true, numero: true },
    });
  });

  revalidatePath("/backoffice/commandes");
  revalidatePath("/backoffice/dashboard");
  return { error: null, numero: commande.numero };
}

// ── Accepter une commande (admin) : EN_ATTENTE → ACCEPTEE ──────────────────

export async function accepterCommande(id: string) {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("Accès refusé.");

  const commande = await prisma.commande.findUnique({ where: { id }, select: { statut: true } });
  if (!commande) throw new Error("Commande introuvable.");
  if (commande.statut !== StatutCommandeClient.EN_ATTENTE)
    throw new Error("Seule une commande en attente peut être acceptée.");

  await prisma.commande.update({
    where: { id },
    data:  { statut: StatutCommandeClient.ACCEPTEE, acceptedAt: new Date() },
  });

  revalidatePath("/backoffice/commandes");
  revalidatePath("/backoffice/dashboard");
}

// ── Décrémentation du stock (appliquée une seule fois par commande) ────────

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function retirerStock(
  tx: TxClient,
  lignes: { produitId: string; quantite: number }[],
) {
  // Re-vérification avant décrément
  for (const l of lignes) {
    const p = await tx.produit.findUnique({
      where: { id: l.produitId },
      select: { nom: true, stockActuel: true },
    });
    if (!p) throw new Error("Un produit de la commande n'existe plus.");
    if (p.stockActuel < l.quantite)
      throw new Error(`Stock insuffisant pour « ${p.nom} » : ${p.stockActuel} disponible(s).`);
  }
  for (const l of lignes) {
    await tx.produit.update({
      where: { id: l.produitId },
      data:  { stockActuel: { decrement: l.quantite } },
    });
  }
}

// ── Confirmer la livraison (admin) : ACCEPTEE → LIVREE ─────────────────────

export async function confirmerLivraison(id: string) {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("Accès refusé.");

  await prisma.$transaction(async (tx) => {
    const commande = await tx.commande.findUnique({
      where:   { id },
      include: { lignes: true },
    });
    if (!commande) throw new Error("Commande introuvable.");
    if (commande.statut !== StatutCommandeClient.ACCEPTEE)
      throw new Error("Seule une commande acceptée peut être livrée.");

    // Stock déjà retiré (ex: facture générée avant) → on ne décrémente pas deux fois
    if (!commande.stockDecremente) {
      await retirerStock(tx, commande.lignes);
    }

    await tx.commande.update({
      where: { id },
      data:  { statut: StatutCommandeClient.LIVREE, livreeAt: new Date(), stockDecremente: true },
    });
  });

  revalidatePath("/backoffice/commandes");
  revalidatePath("/backoffice/catalogue");
  revalidatePath("/backoffice/dashboard");
}

// ── Générer une facture à partir d'une commande livrée ────────────────────

async function genererNumeroFacture(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<string> {
  const now   = new Date();
  const annee = now.getFullYear();
  const mois  = now.getMonth() + 1;

  const sequence = await tx.sequenceFacture.upsert({
    where:  { annee_mois: { annee, mois } },
    update: { dernier: { increment: 1 } },
    create: { annee, mois, dernier: 1 },
  });

  const num     = String(sequence.dernier).padStart(3, "0");
  const moisStr = String(mois).padStart(2, "0");
  return `FAC-${annee}-${moisStr}-${num}`;
}

export async function genererFacture(commandeId: string, formData?: FormData) {
  const session = await requireAuth();

  const statutRaw = (formData?.get("statut") as string | null) ?? "";
  const statut: StatutFacture =
    Object.values(StatutFacture).includes(statutRaw as StatutFacture)
      ? (statutRaw as StatutFacture)
      : StatutFacture.PAYEE; // commande finalisée = payée par défaut
  const notesForm = (formData?.get("notes") as string | null)?.trim() || null;

  const factureId = await prisma.$transaction(async (tx) => {
    const commande = await tx.commande.findUnique({
      where:   { id: commandeId },
      include: { lignes: { include: { produit: true } } },
    });
    if (!commande) throw new Error("Commande introuvable.");
    if (commande.statut !== StatutCommandeClient.ACCEPTEE &&
        commande.statut !== StatutCommandeClient.LIVREE)
      throw new Error("La facture ne peut être générée qu'une fois la commande acceptée.");
    if (commande.factureId)
      throw new Error("Une facture a déjà été générée pour cette commande.");

    // Client : réutilise un client existant (même téléphone) ou en crée un
    let client = commande.clientTelephone
      ? await tx.client.findFirst({ where: { telephone: commande.clientTelephone } })
      : null;
    if (!client) {
      client = await tx.client.create({
        data: {
          nom:       commande.clientNom,
          telephone: commande.clientTelephone || null,
          adresse:   commande.clientAdresse   || null,
        },
      });
    }

    // La génération de facture NE touche PAS au stock :
    // le stock n'est décrémenté qu'à la validation de la livraison.
    const totalTTC = commande.lignes.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);
    const numero   = await genererNumeroFacture(tx);

    const facture = await tx.facture.create({
      data: {
        numero,
        clientId:  client.id,
        vendeurId: session.user.id,
        statut,
        totalTTC,
        notes:     notesForm ?? `Commande ${commande.numero}`,
        lignes: {
          create: commande.lignes.map((l) => ({
            produitId:        l.produitId,
            quantite:         l.quantite,
            prixUnitaire:     l.prixUnitaire,
            // Commission par unité, calculée comme dans le POS
            montantCommission: l.produit.tauxCommission
              ? Math.round(l.prixUnitaire * l.produit.tauxCommission / 100)
              : 0,
          })),
        },
      },
      select: { id: true },
    });

    // Lien commande → facture (le stock sera retiré à la validation de la livraison)
    await tx.commande.update({
      where: { id: commande.id },
      data:  { factureId: facture.id },
    });

    return facture.id;
  });

  revalidatePath("/backoffice/commandes");
  revalidatePath("/backoffice/factures");
  revalidatePath("/backoffice/dashboard");
  return { factureId };
}

// ── Refuser une commande (admin) : EN_ATTENTE | ACCEPTEE → REFUSEE ─────────

export async function refuserCommande(id: string) {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("Accès refusé.");

  const commande = await prisma.commande.findUnique({ where: { id }, select: { statut: true } });
  if (!commande) throw new Error("Commande introuvable.");
  if (commande.statut === StatutCommandeClient.LIVREE)
    throw new Error("Une commande déjà livrée ne peut plus être refusée.");
  if (commande.statut === StatutCommandeClient.REFUSEE) return;

  // Le stock n'a pas encore été décrémenté avant la livraison : rien à restaurer.
  await prisma.commande.update({
    where: { id },
    data:  { statut: StatutCommandeClient.REFUSEE },
  });

  revalidatePath("/backoffice/commandes");
  revalidatePath("/backoffice/dashboard");
}
