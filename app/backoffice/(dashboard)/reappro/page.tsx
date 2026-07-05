import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import BoutonReappro from "@/components/BoutonReappro";
import { StatutCommande } from "@/lib/enums";
import { Plus, Clock, CheckCircle2, XCircle, Package } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";

export const metadata = { title: "Réapprovisionnement — Tching's Fils Multiservices" };

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function StatutBadgeCommande({ statut }: { statut: StatutCommande }) {
  const map: Record<StatutCommande, { label: string; cls: string }> = {
    EN_COURS: { label: "En cours",  cls: "bg-yellow-100 text-yellow-700" },
    RECUE:    { label: "Reçue",     cls: "bg-emerald-100 text-emerald-700" },
    ANNULEE:  { label: "Annulée",   cls: "bg-gray-100 text-gray-500" },
  };
  const { label, cls } = map[statut];
  return <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export default async function ReapproPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string }>;
}) {
  const { statut, q } = await searchParams;

  const AND: Prisma.CommandeReapproWhereInput[] = [];
  if (statut && statut in StatutCommande) AND.push({ statut: statut as StatutCommande });
  if (q?.trim()) AND.push({
    OR: [
      { numero:       { contains: q.trim() } },
      { fournisseur:  { nom: { contains: q.trim() } } },
    ],
  });

  const where: Prisma.CommandeReapproWhereInput = AND.length ? { AND } : {};

  const [commandes, stats] = await Promise.all([
    prisma.commandeReappro.findMany({
      where,
      include: { fournisseur: true, createdBy: true, lignes: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.commandeReappro.groupBy({
      by:    ["statut"],
      _count: { id: true },
    }),
  ]);

  const getNb = (s: StatutCommande) => stats.find((r) => r.statut === s)?._count.id ?? 0;

  const TABS = [
    { value: "",          label: "Toutes",    icon: Package,       count: commandes.length },
    { value: "EN_COURS",  label: "En cours",  icon: Clock,         count: getNb(StatutCommande.EN_COURS) },
    { value: "RECUE",     label: "Reçues",    icon: CheckCircle2,  count: getNb(StatutCommande.RECUE) },
    { value: "ANNULEE",   label: "Annulées",  icon: XCircle,       count: getNb(StatutCommande.ANNULEE) },
  ];

  return (
    <>
      <Header
        title="Réapprovisionnement"
        subtitle={`${commandes.length} commande(s)`}
        action={
          <Link
            href="/backoffice/reappro/nouvelle"
            className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Nouvelle commande
          </Link>
        }
      />

      {/* Cartes résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
            <Clock size={16} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-yellow-600">En cours</p>
            <p className="text-2xl font-bold text-yellow-700">{getNb(StatutCommande.EN_COURS)}</p>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CheckCircle2 size={16} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-emerald-600">Reçues</p>
            <p className="text-2xl font-bold text-emerald-700">{getNb(StatutCommande.RECUE)}</p>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <XCircle size={16} className="text-gray-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Annulées</p>
            <p className="text-2xl font-bold text-gray-500">{getNb(StatutCommande.ANNULEE)}</p>
          </div>
        </div>
      </div>

      {/* Onglets + recherche */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => {
            const active = (statut ?? "") === t.value;
            const Icon   = t.icon;
            const href   = t.value
              ? `/backoffice/reappro?statut=${t.value}${q ? `&q=${q}` : ""}`
              : `/backoffice/reappro${q ? `?q=${q}` : ""}`;
            return (
              <Link
                key={t.value}
                href={href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  active ? "bg-brand-bleu text-white" : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon size={13} />
                {t.label}
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
                  {t.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Recherche */}
        <form className="ml-auto">
          {statut && <input type="hidden" name="statut" value={statut} />}
          <input
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="N° commande, fournisseur…"
            className="input text-sm w-56"
          />
        </form>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <th className="text-left px-5 py-3">N°</th>
              <th className="text-left px-5 py-3">Fournisseur</th>
              <th className="text-left px-5 py-3 hidden sm:table-cell">Créée par</th>
              <th className="text-left px-5 py-3 hidden md:table-cell">Date</th>
              <th className="text-center px-4 py-3">Lignes</th>
              <th className="text-right px-5 py-3 hidden sm:table-cell">Total HT</th>
              <th className="text-center px-5 py-3">Statut</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {commandes.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-12">
                  Aucune commande trouvée.
                </td>
              </tr>
            ) : (
              commandes.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono font-medium text-brand-bleu">
                    <Link href={`/backoffice/reappro/${c.id}`} className="hover:underline">{c.numero}</Link>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">{c.fournisseur.nom}</td>
                  <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{c.createdBy.nom}</td>
                  <td className="px-5 py-3 text-gray-500 hidden md:table-cell whitespace-nowrap">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{c.lignes.length}</td>
                  <td className="px-5 py-3 text-right font-semibold hidden sm:table-cell">{formatFCFA(c.totalHT)}</td>
                  <td className="px-5 py-3 text-center">
                    <StatutBadgeCommande statut={c.statut} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/backoffice/reappro/${c.id}`} className="text-xs text-brand-bleu hover:underline font-medium">
                        Voir
                      </Link>
                      <BoutonReappro id={c.id} statut={c.statut} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
