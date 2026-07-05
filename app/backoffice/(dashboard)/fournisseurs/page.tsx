import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import BoutonSupprimerFournisseur from "@/components/BoutonSupprimerFournisseur";
import { Plus, Truck, Phone, Mail, Package } from "lucide-react";

export const metadata = { title: "Fournisseurs — Tching's Fils Multiservices" };

export default async function FournisseursPage() {
  const fournisseurs = await prisma.fournisseur.findMany({
    include: { _count: { select: { commandes: true } } },
    orderBy: { nom: "asc" },
  });

  return (
    <>
      <Header
        title="Fournisseurs"
        subtitle={`${fournisseurs.length} fournisseur(s) enregistré(s)`}
        action={
          <Link
            href="/backoffice/fournisseurs/nouveau"
            className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Nouveau fournisseur
          </Link>
        }
      />

      {fournisseurs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center py-20 gap-3 text-gray-300">
          <Truck size={48} />
          <p className="text-sm text-gray-400">Aucun fournisseur. Commencez par en ajouter un.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {fournisseurs.map((f) => (
            <div key={f.id} className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
              {/* Header carte */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-brand-bleu/10 flex items-center justify-center shrink-0">
                    <Truck size={18} className="text-brand-bleu" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{f.nom}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <Package size={11} />
                      {f._count.commandes} commande(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Coordonnées */}
              <div className="space-y-1.5 text-sm">
                {f.telephone && (
                  <p className="flex items-center gap-2 text-gray-500">
                    <Phone size={13} className="text-gray-400 shrink-0" />
                    {f.telephone}
                  </p>
                )}
                {f.email && (
                  <p className="flex items-center gap-2 text-gray-500 truncate">
                    <Mail size={13} className="text-gray-400 shrink-0" />
                    {f.email}
                  </p>
                )}
                {f.adresse && (
                  <p className="text-gray-400 text-xs leading-relaxed">{f.adresse}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                <Link
                  href={`/backoffice/reappro/nouvelle?fournisseurId=${f.id}`}
                  className="flex-1 text-center text-xs font-semibold bg-brand-bleu/10 hover:bg-brand-bleu/20 text-brand-bleu py-1.5 rounded-lg transition-colors"
                >
                  + Commande
                </Link>
                <Link
                  href={`/backoffice/fournisseurs/${f.id}/modifier`}
                  className="text-xs font-medium text-gray-500 hover:text-brand-bleu transition-colors"
                >
                  Modifier
                </Link>
                <BoutonSupprimerFournisseur id={f.id} nom={f.nom} />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
