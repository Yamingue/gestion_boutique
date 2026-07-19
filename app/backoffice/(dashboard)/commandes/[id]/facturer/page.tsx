import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import FacturerCommandeForm from "./FacturerCommandeForm";
import { StatutCommandeClient } from "@/lib/enums";

export const metadata = { title: "Générer la facture — Commande" };

export default async function FacturerCommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const commande = await prisma.commande.findUnique({
    where:   { id },
    include: {
      lignes:  { include: { produit: { select: { tauxCommission: true } } } },
      facture: { select: { id: true, numero: true } },
    },
  });

  if (!commande) notFound();

  // Facture déjà générée → renvoyer vers celle-ci
  const dejaFacturee = commande.facture;
  const facturable =
    commande.statut === StatutCommandeClient.ACCEPTEE ||
    commande.statut === StatutCommandeClient.LIVREE;

  const lignes = commande.lignes.map((l) => ({
    id:                l.id,
    nomProduit:        l.nomProduit,
    prixUnitaire:      l.prixUnitaire,
    quantite:          l.quantite,
    montantCommission: l.produit.tauxCommission
      ? Math.round(l.prixUnitaire * l.produit.tauxCommission / 100)
      : 0,
  }));

  return (
    <>
      <Header
        title="Générer la facture"
        subtitle={`Commande ${commande.numero} — ${commande.clientNom}`}
        action={
          <Link href="/backoffice/commandes" className="text-sm text-gray-500 hover:text-gray-700">
            ← Retour aux commandes
          </Link>
        }
      />

      {dejaFacturee ? (
        <div className="max-w-2xl bg-white rounded-2xl shadow-sm p-6 text-center space-y-3">
          <p className="text-gray-700">Une facture a déjà été générée pour cette commande.</p>
          <Link
            href={`/backoffice/factures/${dejaFacturee.id}`}
            className="inline-block bg-brand-bleu hover:bg-brand-bleu/90 text-white text-sm font-semibold px-5 py-2.5 rounded-lg"
          >
            Voir la facture {dejaFacturee.numero}
          </Link>
        </div>
      ) : !facturable ? (
        <div className="max-w-2xl bg-white rounded-2xl shadow-sm p-6 text-center space-y-3">
          <p className="text-gray-700">
            La facture ne peut être générée qu&apos;une fois la commande acceptée.
          </p>
          <Link
            href="/backoffice/commandes"
            className="inline-block text-sm text-gray-500 hover:text-gray-700"
          >
            ← Retour aux commandes
          </Link>
        </div>
      ) : (
        <FacturerCommandeForm
          commandeId={commande.id}
          numero={commande.numero}
          clientNom={commande.clientNom}
          clientTelephone={commande.clientTelephone}
          clientAdresse={commande.clientAdresse}
          statutCommande={commande.statut}
          lignes={lignes}
          total={commande.total}
        />
      )}
    </>
  );
}
