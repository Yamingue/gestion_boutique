import { notFound } from "next/navigation";
import Header from "@/components/Header";
import FournisseurForm from "@/components/FournisseurForm";
import { modifierFournisseur } from "@/lib/actions/fournisseurs";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Modifier fournisseur" };

export default async function ModifierFournisseurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fournisseur = await prisma.fournisseur.findUnique({ where: { id } });
  if (!fournisseur) notFound();

  const action = modifierFournisseur.bind(null, id);

  return (
    <>
      <Header title="Modifier le fournisseur" subtitle={fournisseur.nom} />
      <FournisseurForm
        action={action}
        defaults={{
          nom:       fournisseur.nom,
          telephone: fournisseur.telephone ?? "",
          email:     fournisseur.email     ?? "",
          adresse:   fournisseur.adresse   ?? "",
        }}
        submitLabel="Enregistrer les modifications"
      />
    </>
  );
}
