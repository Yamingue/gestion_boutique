import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Search } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";
import { CartProvider } from "@/components/CartProvider";
import CartButton from "@/components/CartButton";
import ProduitCardPublic from "@/components/ProduitCardPublic";

export const metadata = { title: "Catalogue — Tching's Fils Multiservices" };

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; q?: string }>;
}) {
  const { categorie, q } = await searchParams;

  const AND: Prisma.ProduitWhereInput[] = [];
  if (categorie) AND.push({ categorie: { nom: categorie } });
  if (q?.trim()) AND.push({ nom: { contains: q.trim(), mode: "insensitive" } });
  const where: Prisma.ProduitWhereInput = AND.length ? { AND } : {};

  const [produits, categories] = await Promise.all([
    prisma.produit.findMany({
      where,
      include: { categorie: true },
      orderBy: { nom: "asc" },
    }),
    prisma.categorie.findMany({ orderBy: { nom: "asc" } }),
  ]);

  return (
    <CartProvider>
    <main className="min-h-screen bg-gray-50">
      {/* Barre du haut */}
      <header className="bg-brand-bleu">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-orange font-bold text-white shrink-0">
              T
            </div>
            <div className="leading-tight">
              <p className="font-bold text-sm text-white">Tching&apos;s Fils</p>
              <p className="text-[11px] text-white/60">Multiservices</p>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <CartButton />
            <Link href="/login" className="text-sm text-white/70 hover:text-white underline">
              Espace de gestion
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pb-12 pt-2">
          <h1 className="text-2xl font-bold text-white">Notre catalogue</h1>
          <p className="text-sm text-white/70 mt-1">
            {produits.length} produit{produits.length > 1 ? "s" : ""} disponible{produits.length > 1 ? "s" : ""}
          </p>

          {/* Barre de recherche */}
          <form action="/" className="mt-5 max-w-2xl">
            <div className="flex items-stretch bg-white rounded-full shadow-lg overflow-hidden">
              {categorie && <input type="hidden" name="categorie" value={categorie} />}
              <input
                name="q"
                type="search"
                defaultValue={q ?? ""}
                placeholder="Rechercher un produit…"
                className="flex-1 min-w-0 px-4 py-3 text-sm text-gray-800 focus:outline-none"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-brand-orange hover:bg-orange-600 text-white text-sm font-semibold px-5 transition-colors"
              >
                <Search size={15} />
                <span className="hidden sm:inline">Rechercher</span>
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* Filtres catégories */}
      <div className="max-w-6xl mx-auto px-4 -mt-6">
        <div className="flex flex-wrap gap-2 bg-white rounded-2xl shadow-sm p-3">
          <Link
            href={q ? `/?q=${encodeURIComponent(q)}` : "/"}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              !categorie
                ? "bg-brand-orange text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Tous
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/?categorie=${encodeURIComponent(c.nom)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                categorie === c.nom
                  ? "bg-brand-orange text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c.nom}
            </Link>
          ))}
        </div>
      </div>

      {/* Grille produits */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {produits.length === 0 ? (
          <p className="text-center text-gray-400 py-20">
            Aucun produit ne correspond à votre recherche.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {produits.map((p) => (
              <ProduitCardPublic key={p.id} produit={p} />
            ))}
          </div>
        )}
      </div>
    </main>
    </CartProvider>
  );
}
