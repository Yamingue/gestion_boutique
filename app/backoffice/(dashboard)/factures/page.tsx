import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import StatutBadge from "@/components/StatutBadge";
import BoutonStatut from "@/components/BoutonStatut";
import FiltresFactures from "./FiltresFactures";
import { StatutFacture } from "@/lib/enums";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Plus, TrendingUp, Clock, CheckCircle2, XCircle, Download } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Factures — Tching's Fils Multiservices" };

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(d);
}

const TABS = [
  { label: "Toutes",     value: "",           icon: null },
  { label: "En attente", value: "EN_ATTENTE",  icon: Clock },
  { label: "Payées",     value: "PAYEE",       icon: CheckCircle2 },
  { label: "Annulées",   value: "ANNULEE",     icon: XCircle },
];

export default async function FacturesPage({
  searchParams,
}: {
  searchParams: Promise<{
    statut?:    string;
    q?:         string;
    vendeurId?: string;
    dateDebut?: string;
    dateFin?:   string;
  }>;
}) {
  const { statut, q, vendeurId, dateDebut, dateFin } = await searchParams;

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  /* ── Construction du filtre Prisma ──────────────────────────────────── */
  const AND: Prisma.FactureWhereInput[] = [];

  if (statut && statut in StatutFacture)
    AND.push({ statut: statut as StatutFacture });

  if (q?.trim()) {
    AND.push({
      OR: [
        { numero:  { contains: q.trim() } },
        { client:  { nom:      { contains: q.trim() } } },
        { notes:   { contains: q.trim() } },
      ],
    });
  }

  if (vendeurId) AND.push({ vendeurId });

  if (dateDebut || dateFin) {
    const gte = dateDebut ? new Date(dateDebut + "T00:00:00") : undefined;
    const lte = dateFin   ? new Date(dateFin   + "T23:59:59") : undefined;
    AND.push({ createdAt: { gte, lte } });
  }

  const where: Prisma.FactureWhereInput = AND.length ? { AND } : {};

  /* ── Requêtes parallèles ─────────────────────────────────────────────── */
  const [factures, vendeurs, stats] = await Promise.all([
    prisma.facture.findMany({
      where,
      include: { client: true, vendeur: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true } }),
    prisma.facture.groupBy({
      by:      ["statut"],
      where,
      _sum:    { totalTTC: true },
      _count:  { id: true },
    }),
  ]);

  /* ── Calcul des totaux par statut ────────────────────────────────────── */
  const getStats = (s: StatutFacture) => {
    const row = stats.find((r) => r.statut === s);
    return { count: row?._count.id ?? 0, total: row?._sum.totalTTC ?? 0 };
  };

  const totalGeneral = factures.reduce((s, f) => s + f.totalTTC, 0);

  const spParams = new URLSearchParams();
  if (statut) spParams.set("statut", statut);
  if (q) spParams.set("q", q);
  if (vendeurId) spParams.set("vendeurId", vendeurId);
  if (dateDebut) spParams.set("dateDebut", dateDebut);
  if (dateFin) spParams.set("dateFin", dateFin);
  
  const exportUrl = `/api/export-factures?${spParams.toString()}`;

  return (
    <>
      <Header
        title="Factures"
        subtitle={`${factures.length} facture(s) — ${formatFCFA(totalGeneral)}`}
        action={
          <div className="flex items-center gap-3">
            <a
              href={exportUrl}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
              title="Exporter vers Excel"
            >
              <Download size={15} />
              Excel
            </a>
            <Link
              href="/backoffice/factures/nouvelle"
              className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              <Plus size={15} />
              Nouvelle facture
            </Link>
          </div>
        }
      />

      {/* ── Cartes résumé ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        {/* Total filtré */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-brand-bleu" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 truncate">Total filtré</p>
            <p className="font-bold text-gray-900 text-sm truncate">{formatFCFA(totalGeneral)}</p>
            <p className="text-xs text-gray-400">{factures.length} facture(s)</p>
          </div>
        </div>

        {/* En attente */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-50 flex items-center justify-center shrink-0">
            <Clock size={16} className="text-yellow-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 truncate">En attente</p>
            <p className="font-bold text-gray-900 text-sm truncate">
              {formatFCFA(getStats(StatutFacture.EN_ATTENTE).total)}
            </p>
            <p className="text-xs text-gray-400">{getStats(StatutFacture.EN_ATTENTE).count} facture(s)</p>
          </div>
        </div>

        {/* Payées */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 truncate">Payées</p>
            <p className="font-bold text-gray-900 text-sm truncate">
              {formatFCFA(getStats(StatutFacture.PAYEE).total)}
            </p>
            <p className="text-xs text-gray-400">{getStats(StatutFacture.PAYEE).count} facture(s)</p>
          </div>
        </div>

        {/* Annulées */}
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <XCircle size={16} className="text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-400 truncate">Annulées</p>
            <p className="font-bold text-gray-900 text-sm truncate">
              {formatFCFA(getStats(StatutFacture.ANNULEE).total)}
            </p>
            <p className="text-xs text-gray-400">{getStats(StatutFacture.ANNULEE).count} facture(s)</p>
          </div>
        </div>
      </div>

      {/* ── Onglets statut ─────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map((t) => {
          const active = (statut ?? "") === t.value;
          const Icon   = t.icon;

          // Reconstruire l'URL en gardant les autres params
          const buildHref = () => {
            const next = new URLSearchParams();
            if (t.value)    next.set("statut",    t.value);
            if (q)          next.set("q",          q);
            if (vendeurId)  next.set("vendeurId",  vendeurId);
            if (dateDebut)  next.set("dateDebut",  dateDebut);
            if (dateFin)    next.set("dateFin",    dateFin);
            const qs = next.toString();
            return qs ? `/backoffice/factures?${qs}` : "/backoffice/factures";
          };

          return (
            <Link
              key={t.value}
              href={buildHref()}
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-bleu text-white"
                  : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {Icon && <Icon size={13} />}
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* ── Barre de filtres avancés ───────────────────────────────────── */}
      <FiltresFactures vendeurs={vendeurs} />

      {/* ── Tableau ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <th className="text-left px-5 py-3">N°</th>
              <th className="text-left px-5 py-3">Client</th>
              <th className="text-left px-5 py-3">Vendeur</th>
              <th className="text-left px-5 py-3">Date</th>
              <th className="text-right px-5 py-3">Total</th>
              <th className="text-center px-5 py-3">Statut</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {factures.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-12">
                  Aucune facture ne correspond aux filtres.
                </td>
              </tr>
            ) : (
              factures.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-medium text-brand-bleu">
                    <Link href={`/backoffice/factures/${f.id}`} className="hover:underline">
                      {f.numero}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">{f.client.nom}</td>
                  <td className="px-5 py-3 text-gray-500">{f.vendeur.nom}</td>
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{formatDate(f.createdAt)}</td>
                  <td className="px-5 py-3 text-right font-semibold text-gray-900 whitespace-nowrap">
                    {formatFCFA(f.totalTTC)}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <StatutBadge statut={f.statut} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/backoffice/factures/${f.id}`}
                        className="text-brand-bleu hover:underline text-xs font-medium"
                      >
                        Voir
                      </Link>
                      <BoutonStatut
                        id={f.id}
                        statutActuel={f.statut}
                        isAdmin={isAdmin}
                        vendeurId={f.vendeurId}
                        currentUserId={session?.user?.id}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Pied de tableau avec total visible */}
          {factures.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={4} className="px-5 py-3 text-xs text-gray-400 font-medium">
                  {factures.length} facture(s) affichée(s)
                </td>
                <td className="px-5 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                  {formatFCFA(totalGeneral)}
                </td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </>
  );
}
