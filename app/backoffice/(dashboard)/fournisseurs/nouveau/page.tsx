import Header from "@/components/Header";
import FournisseurForm from "@/components/FournisseurForm";
import { creerFournisseur } from "@/lib/actions/fournisseurs";

export const metadata = { title: "Nouveau fournisseur" };

export default function NouveauFournisseurPage() {
  return (
    <>
      <Header title="Nouveau fournisseur" subtitle="Ajouter un fournisseur au carnet" />
      <FournisseurForm action={creerFournisseur} submitLabel="Créer le fournisseur" />
    </>
  );
}
