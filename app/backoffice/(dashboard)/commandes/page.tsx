import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import BoutonsCommande from "./BoutonsCommande";
import CommandeModal from "./CommandeModal";
import { StatutCommandeClient } from "@/lib/enums";
import { Clock, Check, Truck, XCircle, Phone, MapPin } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Commandes clients — Tching's Fils Multiservices" };

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(d);
}

const STATUT_CONFIG: Record<StatutCommandeClient, { label: string; className: string }> = {
  EN_ATTENTE: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  ACCEPTEE:   { label: "Acceptée",   className: "bg-blue-100 text-blue-700" },
  LIVREE:     { label: "Livrée",     className: "bg-emerald-100 text-emerald-700" },
  REFUSEE:    { label: "Refusée",    className: "bg-red-100 text-red-700" },
};

const TABS: { label: string; value: string }[] = [
  { label: "Toutes",     value: "" },
  { label: "En attente", value: "EN_ATTENTE" },
  { label: "Acceptées",  value: "ACCEPTEE" },
  { label: "Livrées",    value: "LIVREE" },
  { label: "Refusées",   value: "REFUSEE" },
];

export default async function CommandesPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string }>;
}) {
  const { statut } = await searchParams;

  const where: Prisma.CommandeWhereInput =
    statut && statut in StatutCommandeClient
      ? { statut: statut as StatutCommandeClient }
      : {};

  const [commandes, stats] = await Promise.all([
    prisma.commande.findMany({
      where,
      include: { lignes: true, facture: { select: { id: true, numero: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commande.groupBy({ by: ["statut"], _count: { id: true } }),
  ]);

  const getCount = (s: StatutCommandeClient) =>
    stats.find((r) => r.statut === s)?._count.id ?? 0;

  const cartes = [
    { label: "En attente", value: getCount("EN_ATTENTE"), icon: Clock,   bg: "bg-yellow-50",  fg: "text-yellow-500" },
    { label: "Acceptées",  value: getCount("ACCEPTEE"),   icon: Check,   bg: "bg-blue-50",    fg: "text-blue-500" },
    { label: "Livrées",    value: getCount("LIVREE"),     icon: Truck,   bg: "bg-emerald-50", fg: "text-emerald-500" },
    { label: "Refusées",   value: getCount("REFUSEE"),    icon: XCircle, bg: "bg-red-50",     fg: "text-red-500" },
  ];

  return (
    <>
      <Header
        title="Commandes clients"
        subtitle={`${commandes.length} commande(s) — boutique en ligne`}
      />

      {/* Cartes résumé */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {cartes.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
              <c.icon size={16} className={c.fg} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{c.label}</p>
              <p className="font-bold text-gray-900 text-sm">{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Onglets statut */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((t) => {
          const active = (statut ?? "") === t.value;
          const href = t.value ? `/backoffice/commandes?statut=${t.value}` : "/backoffice/commandes";
          return (
            <a
              key={t.value}
              href={href}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active ? "bg-brand-bleu text-white" : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {t.label}
            </a>
          );
        })}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <th className="text-left px-5 py-3">N°</th>
              <th className="text-left px-5 py-3">Client</th>
              <th className="text-left px-5 py-3">Articles</th>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-right px-5 py-3">Total</th>
              <th className="text-center px-5 py-3">Statut</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {commandes.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-12">
                  Aucune commande pour le moment.
                </td>
              </tr>
            ) : (
              commandes.map((c) => {
                const cfg = STATUT_CONFIG[c.statut];
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors align-top">
                    <td className="px-5 py-3 font-mono font-medium text-brand-bleu whitespace-nowrap">
                      {c.numero}
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{c.clientNom}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone size={11} /> {c.clientTelephone}
                      </p>
                      {c.clientAdresse && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <MapPin size={11} /> {c.clientAdresse}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-600 text-xs">
                      {c.lignes.map((l) => (
                        <div key={l.id} className="whitespace-nowrap">
                          {l.quantite} × {l.nomProduit}
                        </div>
                      ))}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                      {formatFCFA(c.total)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 align-middle">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <CommandeModal
                          commande={{
                            id:              c.id,
                            numero:          c.numero,
                            clientNom:       c.clientNom,
                            clientTelephone: c.clientTelephone,
                            clientAdresse:   c.clientAdresse,
                            notes:           c.notes,
                            statut:          c.statut,
                            total:           c.total,
                            dateStr:         formatDate(c.createdAt),
                            lignes:          c.lignes.map((l) => ({
                              id:           l.id,
                              nomProduit:   l.nomProduit,
                              prixUnitaire: l.prixUnitaire,
                              quantite:     l.quantite,
                            })),
                            facture:         c.facture,
                          }}
                        />
                        <BoutonsCommande id={c.id} statut={c.statut} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
