import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import { AlertTriangle, Package, CheckCircle2, XCircle } from "lucide-react";

export const metadata = { title: "Alertes stock — Tching's Fils Multiservices" };

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function NiveauBadge({ stock, seuil }: { stock: number; seuil: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
        <XCircle size={11} />
        Rupture
      </span>
    );
  }
  const pct = stock / seuil;
  if (pct <= 0.5) {
    return (
      <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
        <AlertTriangle size={11} />
        Critique
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-2.5 py-1 rounded-full">
      <AlertTriangle size={11} />
      Faible
    </span>
  );
}

function BarreStock({ stock, seuil }: { stock: number; seuil: number }) {
  const pct = seuil > 0 ? Math.min((stock / seuil) * 100, 100) : 0;
  const color =
    stock === 0        ? "bg-red-500"
    : pct <= 50        ? "bg-orange-400"
    :                    "bg-yellow-400";

  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default async function AlertesPage({
  searchParams,
}: {
  searchParams: Promise<{ niveau?: string }>;
}) {
  const { niveau } = await searchParams;

  const [session, tous] = await Promise.all([
    getServerSession(authOptions),
    prisma.produit.findMany({
      where:   { stockActuel: { lte: prisma.produit.fields.seuilAlerte } },
      include: { categorie: true },
      orderBy: [{ stockActuel: "asc" }, { nom: "asc" }],
    }).catch(() =>
      prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM Produit WHERE stockActuel <= seuilAlerte
      `.then(() => prisma.produit.findMany({
        include: { categorie: true },
        orderBy: [{ stockActuel: "asc" }, { nom: "asc" }],
      }))
    ),
  ]);

  const isAdmin = session?.user?.role === "ADMIN";

  // Filtrer par niveau si demandé
  const produits = (tous as Awaited<ReturnType<typeof prisma.produit.findMany<{ include: { categorie: true } }>>>)
    .filter((p) => {
      if (!niveau || niveau === "tous") return true;
      if (niveau === "rupture") return p.stockActuel === 0;
      if (niveau === "critique") return p.stockActuel > 0 && p.stockActuel / p.seuilAlerte <= 0.5;
      if (niveau === "faible")   return p.stockActuel > 0 && p.stockActuel / p.seuilAlerte > 0.5;
      return true;
    });

  const nbRupture  = (tous as typeof produits).filter((p) => p.stockActuel === 0).length;
  const nbCritique = (tous as typeof produits).filter((p) => p.stockActuel > 0 && p.stockActuel / p.seuilAlerte <= 0.5).length;
  const nbFaible   = (tous as typeof produits).filter((p) => p.stockActuel > 0 && p.stockActuel / p.seuilAlerte > 0.5).length;

  const TABS = [
    { value: "tous",     label: "Tous",     count: (tous as typeof produits).length },
    { value: "rupture",  label: "Rupture",  count: nbRupture },
    { value: "critique", label: "Critique", count: nbCritique },
    { value: "faible",   label: "Faible",   count: nbFaible },
  ];

  return (
    <>
      <Header
        title="Alertes stock"
        subtitle={`${(tous as typeof produits).length} produit(s) sous le seuil d'alerte`}
      />

      {/* ── Cartes résumé ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <XCircle size={18} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs text-red-500 font-medium">Rupture totale</p>
            <p className="text-2xl font-bold text-red-700">{nbRupture}</p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-orange-500 font-medium">Stock critique (≤ 50% du seuil)</p>
            <p className="text-2xl font-bold text-orange-600">{nbCritique}</p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-yellow-600 font-medium">Stock faible (&gt; 50% du seuil)</p>
            <p className="text-2xl font-bold text-yellow-700">{nbFaible}</p>
          </div>
        </div>
      </div>

      {/* ── Onglets filtre ────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap mb-5">
        {TABS.map((t) => {
          const active = (niveau ?? "tous") === t.value;
          return (
            <Link
              key={t.value}
              href={t.value === "tous" ? "/alertes" : `/alertes?niveau=${t.value}`}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-bleu text-white"
                  : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {t.label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {t.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ── Contenu ───────────────────────────────────────────────────── */}
      {produits.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 text-gray-300 gap-3">
          <CheckCircle2 size={48} className="text-emerald-300" />
          <p className="text-base font-semibold text-emerald-500">Aucune alerte pour ce filtre</p>
          <p className="text-sm text-gray-400">Tous les stocks sont au-dessus des seuils.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                <th className="px-5 py-3 w-12"></th>
                <th className="text-left px-5 py-3">Produit</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">SKU</th>
                <th className="text-center px-4 py-3">Niveau</th>
                <th className="text-center px-4 py-3">Stock actuel</th>
                <th className="text-center px-4 py-3">Seuil</th>
                <th className="text-right px-5 py-3 hidden sm:table-cell">Prix</th>
                {isAdmin && <th className="px-5 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {produits.map((p) => (
                <tr
                  key={p.id}
                  className={`transition-colors ${
                    p.stockActuel === 0 ? "bg-red-50/40 hover:bg-red-50" : "hover:bg-gray-50"
                  }`}
                >
                  {/* Image */}
                  <td className="px-5 py-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                      {p.image ? (
                        <Image
                          src={p.image} alt={p.nom}
                          width={40} height={40}
                          className="object-cover w-full h-full"
                          unoptimized
                        />
                      ) : (
                        <Package size={16} className="text-gray-300" />
                      )}
                    </div>
                  </td>

                  {/* Nom */}
                  <td className="px-5 py-3">
                    <p className="font-semibold text-gray-900">{p.nom}</p>
                    <BarreStock stock={p.stockActuel} seuil={p.seuilAlerte} />
                  </td>

                  {/* Catégorie */}
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                    {p.categorie.nom}
                  </td>

                  {/* SKU */}
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden md:table-cell">
                    {p.sku}
                  </td>

                  {/* Niveau badge */}
                  <td className="px-4 py-3 text-center">
                    <NiveauBadge stock={p.stockActuel} seuil={p.seuilAlerte} />
                  </td>

                  {/* Stock actuel */}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-lg font-bold ${
                      p.stockActuel === 0 ? "text-red-600" : "text-orange-500"
                    }`}>
                      {p.stockActuel}
                    </span>
                  </td>

                  {/* Seuil */}
                  <td className="px-4 py-3 text-center text-gray-400 text-sm">
                    {p.seuilAlerte}
                  </td>

                  {/* Prix */}
                  <td className="px-5 py-3 text-right text-gray-600 hidden sm:table-cell">
                    {formatFCFA(p.prixUnitaire)}
                  </td>

                  {/* Actions admin */}
                  {isAdmin && (
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/catalogue/${p.id}/modifier`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-bleu hover:underline whitespace-nowrap"
                      >
                        Réapprovisionner
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Message si tout est OK ────────────────────────────────────── */}
      {(tous as typeof produits).length === 0 && (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 size={52} className="text-emerald-400" />
          <p className="text-lg font-bold text-emerald-600">Tous les stocks sont suffisants !</p>
          <p className="text-sm text-gray-400">Aucun produit n&apos;est sous son seuil d&apos;alerte.</p>
        </div>
      )}
    </>
  );
}
