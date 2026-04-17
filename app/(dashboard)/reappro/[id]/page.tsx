import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import BoutonReappro from "@/components/BoutonReappro";
import { StatutCommande } from "@/lib/enums";
import {
  Truck, Phone, Mail, MapPin,
  Clock, CheckCircle2, XCircle, Package, CalendarCheck,
} from "lucide-react";

export const metadata = { title: "Détail commande — Réapprovisionnement" };

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" }).format(d);
}

function StatutCard({ statut, receivedAt }: { statut: StatutCommande; receivedAt: Date | null }) {
  if (statut === StatutCommande.EN_COURS) return (
    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
      <Clock size={16} className="text-yellow-600 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-yellow-700">En cours</p>
        <p className="text-xs text-yellow-600">En attente de réception — stock non modifié</p>
      </div>
    </div>
  );

  if (statut === StatutCommande.RECUE) return (
    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-emerald-700">Reçue — stock mis à jour</p>
        {receivedAt && <p className="text-xs text-emerald-600">Réceptionnée le {formatDate(receivedAt)}</p>}
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
      <XCircle size={16} className="text-gray-400 shrink-0" />
      <p className="text-sm font-semibold text-gray-500">Annulée</p>
    </div>
  );
}

export default async function DetailCommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const commande = await prisma.commandeReappro.findUnique({
    where:   { id },
    include: {
      fournisseur: true,
      createdBy:   true,
      lignes:      { include: { produit: { include: { categorie: true } } } },
    },
  });

  if (!commande) notFound();

  return (
    <>
      <Header
        title={commande.numero}
        subtitle={`Créée le ${formatDate(commande.createdAt)} par ${commande.createdBy.nom}`}
        action={
          <div className="flex items-center gap-3">
            <BoutonReappro id={commande.id} statut={commande.statut} />
            <Link href="/reappro" className="text-sm text-gray-500 hover:text-gray-700">
              ← Retour
            </Link>
          </div>
        }
      />

      <div className="max-w-4xl space-y-5">

        {/* Statut */}
        <StatutCard statut={commande.statut} receivedAt={commande.receivedAt} />

        {/* Infos fournisseur */}
        <div className="bg-white rounded-2xl shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Fournisseur</p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-brand-bleu/10 flex items-center justify-center shrink-0">
                <Truck size={16} className="text-brand-bleu" />
              </div>
              <p className="font-bold text-gray-900">{commande.fournisseur.nom}</p>
            </div>
            <div className="space-y-1.5 text-sm">
              {commande.fournisseur.telephone && (
                <p className="flex items-center gap-2 text-gray-500">
                  <Phone size={13} className="text-gray-400" />
                  {commande.fournisseur.telephone}
                </p>
              )}
              {commande.fournisseur.email && (
                <p className="flex items-center gap-2 text-gray-500">
                  <Mail size={13} className="text-gray-400" />
                  {commande.fournisseur.email}
                </p>
              )}
              {commande.fournisseur.adresse && (
                <p className="flex items-center gap-2 text-gray-500">
                  <MapPin size={13} className="text-gray-400" />
                  {commande.fournisseur.adresse}
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Détails</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Créée par</span>
                <span className="font-medium">{commande.createdBy.nom}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Date création</span>
                <span className="font-medium">{formatDate(commande.createdAt)}</span>
              </div>
              {commande.receivedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 flex items-center gap-1">
                    <CalendarCheck size={13} /> Réceptionnée
                  </span>
                  <span className="font-medium text-emerald-600">{formatDate(commande.receivedAt)}</span>
                </div>
              )}
              {commande.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-gray-400 text-xs mb-1">Notes</p>
                  <p className="text-gray-700">{commande.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lignes produits */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3">Produit</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Catégorie</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">SKU</th>
                <th className="text-center px-4 py-3">Qté commandée</th>
                <th className="text-right px-4 py-3">Prix unit. HT</th>
                <th className="text-right px-5 py-3">Sous-total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {commande.lignes.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <Package size={13} className="text-gray-400" />
                      </div>
                      {l.produit.nom}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{l.produit.categorie.nom}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs hidden md:table-cell">{l.produit.sku}</td>
                  <td className="px-4 py-3 text-center font-bold text-brand-bleu">{l.quantite}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatFCFA(l.prixUnitaire)}</td>
                  <td className="px-5 py-3 text-right font-semibold">{formatFCFA(l.prixUnitaire * l.quantite)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-200">
                <td colSpan={5} className="px-5 py-4 text-right font-bold text-gray-700">Total HT</td>
                <td className="px-5 py-4 text-right text-xl font-bold text-brand-bleu">
                  {formatFCFA(commande.totalHT)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>
    </>
  );
}
