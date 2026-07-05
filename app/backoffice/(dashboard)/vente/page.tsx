import { prisma } from "@/lib/prisma";
import POSInterface from "./POSInterface";

export const metadata = { title: "Vente — Tching's Fils Multiservices" };

export default async function VentePage() {
  const [clients, categories, produits] = await Promise.all([
    prisma.client.findMany({ orderBy: { nom: "asc" } }),
    prisma.categorie.findMany({ orderBy: { nom: "asc" } }),
    prisma.produit.findMany({
      where:   { stockActuel: { gt: 0 } },
      include: { categorie: true },
      orderBy: { nom: "asc" },
    }),
  ]);

  return (
    <POSInterface
      clients={clients}
      categories={categories}
      produits={produits}
    />
  );
}
