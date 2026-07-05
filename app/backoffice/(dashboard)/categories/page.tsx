import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import CategorieForm from "./CategorieForm";
import CategorieActions from "./CategorieActions";

export const metadata = { title: "Catégories — Tching's Fils Multiservices" };

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/backoffice/catalogue");

  const categories = await prisma.categorie.findMany({
    include: { _count: { select: { produits: true } } },
    orderBy: { nom: "asc" },
  });

  return (
    <>
      <Header title="Catégories" subtitle="Gérer les catégories de produits" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire création */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Nouvelle catégorie</h2>
            <CategorieForm />
          </div>
        </div>

        {/* Liste */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                  <th className="text-left px-5 py-3">Nom</th>
                  <th className="text-center px-5 py-3">Produits</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center text-gray-400 py-10">
                      Aucune catégorie. Créez-en une.
                    </td>
                  </tr>
                )}
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{c.nom}</td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {c._count.produits}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <CategorieActions categorie={{ id: c.id, nom: c.nom }} nbProduits={c._count.produits} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
