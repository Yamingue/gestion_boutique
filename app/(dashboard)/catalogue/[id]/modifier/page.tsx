import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import ProduitForm from "@/components/ProduitForm";
import { modifierProduit } from "@/lib/actions/catalogue";

export const metadata = { title: "Modifier produit — Catalogue" };

export default async function ModifierProduitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/catalogue");

  const { id } = await params;

  const [produit, categories] = await Promise.all([
    prisma.produit.findUnique({ where: { id } }),
    prisma.categorie.findMany({ orderBy: { nom: "asc" } }),
  ]);

  if (!produit) notFound();

  const action = modifierProduit.bind(null, id);

  return (
    <>
      <Header title={`Modifier — ${produit.nom}`} subtitle={`SKU : ${produit.sku}`} />
      <ProduitForm categories={categories} produit={produit} action={action} />
    </>
  );
}
