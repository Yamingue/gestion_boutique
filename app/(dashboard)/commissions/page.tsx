import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import FiltresCommissions from "./FiltresCommissions";

export const metadata = { title: "Commissions par agent" };

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(d);
}

interface SearchParams {
  vendeurId?: string;
  dateDebut?: string;
  dateFin?: string;
}

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const { vendeurId, dateDebut, dateFin } = await searchParams;

  const agents = await prisma.user.findMany({
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });

  // Construire les filtres de date
  const dateDebutParsed = dateDebut ? new Date(dateDebut + "T00:00:00") : undefined;
  const dateFinParsed   = dateFin   ? new Date(dateFin   + "T23:59:59") : undefined;

  // Récupérer les factures PAYEES avec leurs lignes et montant de commission
  const factures = await prisma.facture.findMany({
    where: {
      statut: "PAYEE",
      ...(vendeurId ? { vendeurId } : {}),
      ...(dateDebutParsed || dateFinParsed
        ? {
            createdAt: {
              ...(dateDebutParsed ? { gte: dateDebutParsed } : {}),
              ...(dateFinParsed   ? { lte: dateFinParsed   } : {}),
            },
          }
        : {}),
    },
    include: {
      vendeur: { select: { id: true, nom: true, email: true } },
      lignes: {
        select: {
          quantite: true,
          prixUnitaire: true,
          montantCommission: true,
          produit: { select: { nom: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Regrouper par vendeur
  const parAgent = new Map<
    string,
    {
      nom: string;
      email: string;
      nbFactures: number;
      totalVentes: number;
      totalCommission: number;
      details: { factureId: string; produit: string; quantite: number; prixUnit: number; taux: number; montant: number }[];
    }
  >();

  for (const f of factures) {
    const key = f.vendeur.id;
    if (!parAgent.has(key)) {
      parAgent.set(key, {
        nom: f.vendeur.nom,
        email: f.vendeur.email,
        nbFactures: 0,
        totalVentes: 0,
        totalCommission: 0,
        details: [],
      });
    }
    const agent = parAgent.get(key)!;
    agent.nbFactures++;
    for (const l of f.lignes) {
      const sousTotal = l.prixUnitaire * l.quantite;
      agent.totalVentes += sousTotal;
      if (l.montantCommission != null && l.montantCommission > 0) {
        agent.totalCommission += l.montantCommission;
        agent.details.push({
          factureId: f.numero,
          produit: l.produit.nom,
          quantite: l.quantite,
          prixUnit: l.prixUnitaire,
          taux: 0,
          montant: l.montantCommission,
        });
      }
    }
  }

  const lignesAgents = Array.from(parAgent.values());
  const grandTotalVentes      = lignesAgents.reduce((s, a) => s + a.totalVentes, 0);
  const grandTotalCommissions = lignesAgents.reduce((s, a) => s + a.totalCommission, 0);

  const hasFilters = !!(vendeurId || dateDebut || dateFin);

  return (
    <>
      <Header
        title="Commissions par agent"
        subtitle="Calcul des commissions sur les factures payées"
      />

      <div className="space-y-6 max-w-5xl">
        <Suspense>
          <FiltresCommissions agents={agents} />
        </Suspense>

        {!hasFilters && (
          <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-5 py-4 border border-dashed border-gray-200">
            Sélectionnez un agent et/ou une période, puis cliquez sur <strong>Calculer</strong> pour afficher les commissions.
          </p>
        )}

        {hasFilters && lignesAgents.length === 0 && (
          <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-5 py-4 text-center">
            Aucune facture payée trouvée pour ces critères.
          </p>
        )}

        {hasFilters && lignesAgents.length > 0 && (
          <>
            {/* Tableau récapitulatif par agent */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Récapitulatif par agent</h2>
                {(dateDebut || dateFin) && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Période : {dateDebut ? formatDate(new Date(dateDebut)) : "—"} → {dateFin ? formatDate(new Date(dateFin)) : "—"}
                  </p>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Agent</th>
                    <th className="text-center px-5 py-3">Factures payées</th>
                    <th className="text-right px-5 py-3">Total ventes</th>
                    <th className="text-right px-5 py-3">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lignesAgents.map((a) => (
                    <tr key={a.email} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium text-gray-900">{a.nom}</p>
                        <p className="text-xs text-gray-400">{a.email}</p>
                      </td>
                      <td className="px-5 py-3 text-center text-gray-600">{a.nbFactures}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{formatFCFA(a.totalVentes)}</td>
                      <td className="px-5 py-3 text-right font-bold text-amber-700">
                        {a.totalCommission > 0 ? formatFCFA(a.totalCommission) : <span className="text-gray-300 font-normal">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="px-5 py-4 font-bold text-gray-700" colSpan={2}>Total</td>
                    <td className="px-5 py-4 text-right font-bold text-brand-bleu">{formatFCFA(grandTotalVentes)}</td>
                    <td className="px-5 py-4 text-right font-bold text-amber-700">{formatFCFA(grandTotalCommissions)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Détail des lignes avec commission */}
            {lignesAgents.some((a) => a.details.length > 0) && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-800">Détail des commissions</h2>
                </div>
                {lignesAgents
                  .filter((a) => a.details.length > 0)
                  .map((a) => (
                    <div key={a.email}>
                      <div className="px-5 py-2 bg-amber-50 border-b border-amber-100">
                        <p className="font-semibold text-amber-800 text-sm">{a.nom}</p>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 text-xs uppercase border-b border-gray-100">
                            <th className="text-left px-5 py-2">Facture</th>
                            <th className="text-left px-5 py-2">Produit</th>
                            <th className="text-center px-5 py-2">Qté</th>
                            <th className="text-right px-5 py-2">Prix unit.</th>
                            <th className="text-right px-5 py-2">Commission</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {a.details.map((d, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="px-5 py-2 font-mono text-xs text-gray-500">{d.factureId}</td>
                              <td className="px-5 py-2 text-gray-800">{d.produit}</td>
                              <td className="px-5 py-2 text-center text-gray-600">{d.quantite}</td>
                              <td className="px-5 py-2 text-right text-gray-600">{formatFCFA(d.prixUnit)}</td>
                              <td className="px-5 py-2 text-right font-semibold text-amber-700">{formatFCFA(d.montant)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-amber-200 bg-amber-50">
                            <td colSpan={4} className="px-5 py-2 text-right font-semibold text-amber-800 text-sm">
                              Total commission — {a.nom}
                            </td>
                            <td className="px-5 py-2 text-right font-bold text-amber-800">
                              {formatFCFA(a.totalCommission)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
