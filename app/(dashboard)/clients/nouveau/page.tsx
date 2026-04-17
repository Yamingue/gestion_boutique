import Header from "@/components/Header";
import ClientForm from "@/components/ClientForm";
import { creerClient } from "@/lib/actions/clients";

export const metadata = { title: "Nouveau client" };

export default function NouveauClientPage() {
  return (
    <>
      <Header title="Nouveau client" subtitle="Ajouter un client" />
      <ClientForm action={creerClient} />
    </>
  );
}
