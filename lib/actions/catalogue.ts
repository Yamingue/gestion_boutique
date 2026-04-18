"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

// ── Helpers ────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") throw new Error("Accès refusé");
}

function formInt(value: FormDataEntryValue | null, fallback = 0) {
  const n = parseInt(value as string, 10);
  return isNaN(n) ? fallback : n;
}

const TYPES_ACCEPTES = ["image/jpeg", "image/png", "image/webp"];
const TAILLE_MAX = 10 * 1024 * 1024; // 10 Mo

async function sauvegarderImage(file: File): Promise<string> {
  if (!TYPES_ACCEPTES.includes(file.type)) {
    throw new Error("Format non supporté. Utilisez JPG, PNG ou WebP.");
  }
  if (file.size > TAILLE_MAX) {
    throw new Error("L'image ne doit pas dépasser 10 Mo.");
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const nomFichier = `produits/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const blob = await put(nomFichier, file, { access: "private" });
  return blob.url;
}

async function supprimerImage(imageUrl: string) {
  try {
    // Uniquement les URLs Vercel Blob (les anciennes images locales sont ignorées)
    if (imageUrl.includes("blob.vercel-storage.com")) {
      await del(imageUrl);
    }
  } catch {
    // Ignore si le blob n'existe plus
  }
}

// ── Catégories ─────────────────────────────────────────────────────────────

export async function creerCategorie(formData: FormData) {
  await requireAdmin();
  const nom = (formData.get("nom") as string).trim();
  if (!nom) return { error: "Le nom est requis." };

  const existe = await prisma.categorie.findFirst({ where: { nom } });
  if (existe) return { error: `La catégorie « ${nom} » existe déjà.` };

  await prisma.categorie.create({ data: { nom } });
  revalidatePath("/categories");
}

export async function modifierCategorie(id: string, formData: FormData) {
  await requireAdmin();
  const nom = (formData.get("nom") as string).trim();
  if (!nom) return { error: "Le nom est requis." };

  const doublon = await prisma.categorie.findFirst({ where: { nom, NOT: { id } } });
  if (doublon) return { error: `La catégorie « ${nom} » existe déjà.` };

  await prisma.categorie.update({ where: { id }, data: { nom } });
  revalidatePath("/categories");
}

export async function supprimerCategorie(id: string) {
  await requireAdmin();
  const nbProduits = await prisma.produit.count({ where: { categorieId: id } });
  if (nbProduits > 0) {
    throw new Error(`Impossible : ${nbProduits} produit(s) utilisent cette catégorie.`);
  }
  await prisma.categorie.delete({ where: { id } });
  revalidatePath("/categories");
}

// ── Produits ───────────────────────────────────────────────────────────────

export async function creerProduit(formData: FormData) {
  await requireAdmin();

  const nom          = (formData.get("nom") as string).trim();
  const sku          = (formData.get("sku") as string).trim().toUpperCase();
  const categorieId  = formData.get("categorieId") as string;
  const prixUnitaire = formInt(formData.get("prixUnitaire"));
  const stockActuel  = formInt(formData.get("stockActuel"));
  const seuilAlerte  = formInt(formData.get("seuilAlerte"), 10);
  const imageFile    = formData.get("image") as File | null;

  if (!nom || !sku || !categorieId || prixUnitaire <= 0) {
    return { error: "Tous les champs obligatoires doivent être remplis." };
  }

  const exists = await prisma.produit.findUnique({ where: { sku } });
  if (exists) return { error: `Le SKU « ${sku} » existe déjà.` };

  let image: string | null = null;
  if (imageFile && imageFile.size > 0) {
    try {
      image = await sauvegarderImage(imageFile);
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : "Erreur upload image." };
    }
  }

  await prisma.produit.create({
    data: { nom, sku, categorieId, prixUnitaire, stockActuel, seuilAlerte, image },
  });

  revalidatePath("/catalogue");
  redirect("/catalogue");
}

export async function modifierProduit(id: string, formData: FormData) {
  await requireAdmin();

  const nom          = (formData.get("nom") as string).trim();
  const sku          = (formData.get("sku") as string).trim().toUpperCase();
  const categorieId  = formData.get("categorieId") as string;
  const prixUnitaire = formInt(formData.get("prixUnitaire"));
  const stockActuel  = formInt(formData.get("stockActuel"));
  const seuilAlerte  = formInt(formData.get("seuilAlerte"), 10);
  const imageFile    = formData.get("image") as File | null;

  if (!nom || !sku || !categorieId || prixUnitaire <= 0) {
    return { error: "Tous les champs obligatoires doivent être remplis." };
  }

  const doublon = await prisma.produit.findFirst({ where: { sku, NOT: { id } } });
  if (doublon) return { error: `Le SKU « ${sku} » est déjà utilisé.` };

  const produitActuel = await prisma.produit.findUnique({ where: { id } });

  let image = produitActuel?.image ?? null;
  if (imageFile && imageFile.size > 0) {
    try {
      const nouvelleImage = await sauvegarderImage(imageFile);
      // Supprimer l'ancienne image du disque
      if (produitActuel?.image) await supprimerImage(produitActuel.image);
      image = nouvelleImage;
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : "Erreur upload image." };
    }
  }

  await prisma.produit.update({
    where: { id },
    data: { nom, sku, categorieId, prixUnitaire, stockActuel, seuilAlerte, image },
  });

  revalidatePath("/catalogue");
  redirect("/catalogue");
}

export async function supprimerProduit(id: string) {
  await requireAdmin();
  const produit = await prisma.produit.findUnique({ where: { id } });
  if (produit?.image) await supprimerImage(produit.image);
  await prisma.produit.delete({ where: { id } });
  revalidatePath("/catalogue");
}
