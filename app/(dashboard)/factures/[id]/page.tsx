import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import StatutBadge from "@/components/StatutBadge";
import BoutonStatut from "@/components/BoutonStatut";

export const metadata = { title: "Détail facture" };

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d);
}

export default async function DetailFacturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [session, facture] = await Promise.all([
    getServerSession(authOptions),
    prisma.facture.findUnique({
    where: { id },
      include: {
        client:  true,
        vendeur: true,
        lignes:  { include: { produit: true } },
      },
    }),
  ]);

  if (!facture) notFound();

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <>
      <Header
        title={facture.numero}
        subtitle={`Émise le ${formatDate(facture.createdAt)}`}
        action={
          <div className="flex items-center gap-3">
            <BoutonStatut
                id={facture.id}
                statutActuel={facture.statut}
                isAdmin={isAdmin}
                vendeurId={facture.vendeurId}
                currentUserId={session?.user?.id}
              />
            <Link
              href={`/factures/${facture.id}/imprimer`}
              target="_blank"
              className="bg-brand-bleu hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              🖨 Imprimer / PDF
            </Link>
          </div>
        }
      />

      <div className="max-w-3xl space-y-5">
        {/* Infos */}
        <div className="bg-white rounded-2xl shadow-sm p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-1">Client</p>
            <p className="font-semibold text-gray-900">{facture.client.nom}</p>
            {facture.client.telephone && <p className="text-gray-500">{facture.client.telephone}</p>}
            {facture.client.email     && <p className="text-gray-500">{facture.client.email}</p>}
            {facture.client.adresse   && <p className="text-gray-500">{facture.client.adresse}</p>}
          </div>
          <div>
            <p className="text-gray-500 mb-1">Vendeur</p>
            <p className="font-semibold text-gray-900">{facture.vendeur.nom}</p>
            <p className="text-gray-500">{facture.vendeur.email}</p>
            <div className="mt-2">
              <StatutBadge statut={facture.statut} />
            </div>
          </div>
        </div>

        {/* Lignes */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Produit</th>
                <th className="text-right px-5 py-3">Prix unit.</th>
                <th className="text-center px-5 py-3">Qté</th>
                <th className="text-right px-5 py-3">Sous-total</th>
                {facture.lignes.some((l) => l.tauxCommission != null) && (
                  <th className="text-right px-5 py-3">Commission</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facture.lignes.map((l) => {
                const sousTotal = l.prixUnitaire * l.quantite;
                const commission = l.tauxCommission != null
                  ? Math.round(sousTotal * l.tauxCommission / 100)
                  : null;
                return (
                  <tr key={l.id}>
                    <td className="px-5 py-3 font-medium text-gray-900">{l.produit.nom}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{formatFCFA(l.prixUnitaire)}</td>
                    <td className="px-5 py-3 text-center text-gray-600">{l.quantite}</td>
                    <td className="px-5 py-3 text-right font-semibold">{formatFCFA(sousTotal)}</td>
                    {facture.lignes.some((ll) => ll.tauxCommission != null) && (
                      <td className="px-5 py-3 text-right">
                        {commission != null ? (
                          <span className="text-amber-700 font-medium">
                            {formatFCFA(commission)}
                            <span className="text-xs text-gray-400 ml-1">({l.tauxCommission}%)</span>
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={3} className="px-5 py-4 text-right font-bold text-gray-700">Total TTC</td>
                <td className="px-5 py-4 text-right text-xl font-bold text-brand-bleu">
                  {formatFCFA(facture.totalTTC)}
                </td>
                {facture.lignes.some((l) => l.tauxCommission != null) && (
                  <td className="px-5 py-4 text-right text-lg font-bold text-amber-700">
                    {formatFCFA(
                      facture.lignes.reduce((s, l) =>
                        s + (l.tauxCommission != null
                          ? Math.round(l.prixUnitaire * l.quantite * l.tauxCommission / 100)
                          : 0), 0)
                    )}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Notes */}
        {facture.notes && (
          <div className="bg-white rounded-2xl shadow-sm p-5 text-sm">
            <p className="text-gray-500 mb-1 font-medium">Notes</p>
            <p className="text-gray-700 whitespace-pre-line">{facture.notes}</p>
          </div>
        )}
      </div>
    </>
  );
}
