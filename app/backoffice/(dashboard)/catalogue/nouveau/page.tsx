import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import ProduitForm from "@/components/ProduitForm";
import { creerProduit } from "@/lib/actions/catalogue";

export const metadata = { title: "Nouveau produit — Catalogue" };

export default async function NouveauProduitPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/backoffice/catalogue");

  const categories = await prisma.categorie.findMany({ orderBy: { nom: "asc" } });

  return (
    <>
      <Header title="Nouveau produit" subtitle="Ajouter un article au catalogue" />
      <ProduitForm categories={categories} action={creerProduit} />
    </>
  );
}
