import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import NouvelleFactureForm from "./NouvelleFactureForm";

export const metadata = { title: "Nouvelle facture" };

export default async function NouvelleFacturePage() {
  const [clients, produits] = await Promise.all([
    prisma.client.findMany({ orderBy: { nom: "asc" } }),
    prisma.produit.findMany({
      where:   { stockActuel: { gt: 0 } },
      include: { categorie: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  return (
    <>
      <Header title="Nouvelle facture" subtitle="Créer une facture de vente" />
      <NouvelleFactureForm clients={clients} produits={produits} />
    </>
  );
}
