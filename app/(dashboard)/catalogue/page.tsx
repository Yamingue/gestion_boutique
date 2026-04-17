import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import BoutonSupprimerProduit from "@/components/BoutonSupprimerProduit";
import { Package, AlertTriangle, Plus } from "lucide-react";

export const metadata = { title: "Catalogue — Tching's Fils Multiservices" };

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export default async function CataloguePage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const produits = await prisma.produit.findMany({
    include: { categorie: true },
    orderBy: { nom: "asc" },
  });

  const enAlerte = produits.filter((p) => p.stockActuel <= p.seuilAlerte);

  return (
    <>
      <Header
        title="Catalogue"
        subtitle={`${produits.length} produit(s) — ${enAlerte.length} en alerte`}
        action={
          isAdmin && (
            <Link
              href="/catalogue/nouveau"
              className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={15} />
              Nouveau produit
            </Link>
          )
        }
      />

      {enAlerte.length > 0 && (
        <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>
            <strong>{enAlerte.length} produit(s)</strong> en dessous du seuil d&apos;alerte :{" "}
            {enAlerte.map((p) => p.nom).join(", ")}
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <th className="px-5 py-3 w-14"></th>
              <th className="text-left px-5 py-3">Produit</th>
              <th className="text-left px-5 py-3">SKU</th>
              <th className="text-left px-5 py-3">Catégorie</th>
              <th className="text-right px-5 py-3">Prix</th>
              <th className="text-right px-5 py-3">Stock</th>
              {isAdmin && <th className="px-5 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {produits.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="text-center text-gray-400 py-10">
                  Aucun produit. Commencez par en ajouter un.
                </td>
              </tr>
            )}
            {produits.map((p) => {
              const alerte = p.stockActuel <= p.seuilAlerte;
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                      {p.image ? (
                        <Image src={p.image} alt={p.nom} width={40} height={40}
                          className="object-cover w-full h-full" unoptimized />
                      ) : (
                        <Package size={18} className="text-gray-300" />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">{p.nom}</td>
                  <td className="px-5 py-3 text-gray-500 font-mono">{p.sku}</td>
                  <td className="px-5 py-3 text-gray-500">{p.categorie.nom}</td>
                  <td className="px-5 py-3 text-right text-gray-700">{formatFCFA(p.prixUnitaire)}</td>
                  <td className="px-5 py-3 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        alerte
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {alerte
                      ? <span className="inline-flex items-center gap-1">{p.stockActuel} <AlertTriangle size={11} /> seuil: {p.seuilAlerte}</span>
                      : p.stockActuel
                    }
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right space-x-3">
                      <Link
                        href={`/catalogue/${p.id}/modifier`}
                        className="text-brand-bleu hover:underline text-xs font-medium"
                      >
                        Modifier
                      </Link>
                      <BoutonSupprimerProduit id={p.id} nom={p.nom} />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
