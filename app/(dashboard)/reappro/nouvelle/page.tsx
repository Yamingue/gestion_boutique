import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import NouvelleCommandeForm from "./NouvelleCommandeForm";

export const metadata = { title: "Nouvelle commande — Réapprovisionnement" };

export default async function NouvelleCommandePage({
  searchParams,
}: {
  searchParams: Promise<{ fournisseurId?: string }>;
}) {
  const { fournisseurId } = await searchParams;

  const [fournisseurs, produits] = await Promise.all([
    prisma.fournisseur.findMany({ orderBy: { nom: "asc" } }),
    prisma.produit.findMany({ include: { categorie: true }, orderBy: { nom: "asc" } }),
  ]);

  return (
    <>
      <Header
        title="Nouvelle commande"
        subtitle="Créer un bon de commande fournisseur"
      />
      <NouvelleCommandeForm
        fournisseurs={fournisseurs}
        produits={produits}
        defaultFournisseurId={fournisseurId ?? ""}
      />
    </>
  );
}
