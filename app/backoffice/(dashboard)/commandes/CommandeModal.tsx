"use client";

import { useState } from "react";
import Link from "next/link";
import { X, User, Phone, MapPin, Package, FileText, Eye, Printer } from "lucide-react";
import BoutonsCommande from "./BoutonsCommande";
import { StatutCommandeClient } from "@/lib/enums";

export interface CommandeModalData {
  id:              string;
  numero:          string;
  clientNom:       string;
  clientTelephone: string;
  clientAdresse:   string | null;
  notes:           string | null;
  statut:          StatutCommandeClient;
  total:           number;
  dateStr:         string;
  lignes:          { id: string; nomProduit: string; prixUnitaire: number; quantite: number }[];
  facture:         { id: string; numero: string } | null;
}

const STATUT_CONFIG: Record<StatutCommandeClient, { label: string; className: string }> = {
  EN_ATTENTE: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  ACCEPTEE:   { label: "Acceptée",   className: "bg-blue-100 text-blue-700" },
  LIVREE:     { label: "Livrée",     className: "bg-emerald-100 text-emerald-700" },
  REFUSEE:    { label: "Refusée",    className: "bg-red-100 text-red-700" },
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export default function CommandeModal({ commande }: { commande: CommandeModalData }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUT_CONFIG[commande.statut];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
      >
        <Eye size={13} /> Voir
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* En-tête */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-brand-bleu">{commande.numero}</span>
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.className}`}>
                  {cfg.label}
                </span>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Contenu défilant */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Client */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Client — passée le {commande.dateStr}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <p className="flex items-center gap-2 text-gray-700">
                    <User size={14} className="text-gray-400" /> {commande.clientNom}
                  </p>
                  <p className="flex items-center gap-2 text-gray-700">
                    <Phone size={14} className="text-gray-400" /> {commande.clientTelephone}
                  </p>
                  {commande.clientAdresse && (
                    <p className="flex items-center gap-2 text-gray-700">
                      <MapPin size={14} className="text-gray-400" /> {commande.clientAdresse}
                    </p>
                  )}
                </div>
                {commande.notes && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    {commande.notes}
                  </p>
                )}
              </div>

              {/* Articles */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                      <th className="text-left px-4 py-2.5">Article</th>
                      <th className="text-right px-3 py-2.5">Prix unitaire</th>
                      <th className="text-center px-3 py-2.5">Qté</th>
                      <th className="text-right px-4 py-2.5">Prix total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {commande.lignes.map((l) => (
                      <tr key={l.id}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                              <Package size={12} className="text-gray-400" />
                            </div>
                            {l.nomProduit}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600">{formatFCFA(l.prixUnitaire)}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-brand-bleu">{l.quantite}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                          {formatFCFA(l.prixUnitaire * l.quantite)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700">Total</td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-brand-bleu">
                        {formatFCFA(commande.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pied : actions */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 shrink-0 flex-wrap">
              <BoutonsCommande id={commande.id} statut={commande.statut} />

              {commande.facture ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href={`/backoffice/factures/${commande.facture.id}`}
                    className="inline-flex items-center gap-1.5 bg-brand-bleu hover:bg-brand-bleu/90 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <FileText size={15} />
                    Voir la facture {commande.facture.numero}
                  </Link>
                  <a
                    href={`/backoffice/factures/${commande.facture.id}/imprimer`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-white text-brand-bleu border border-brand-bleu/30 hover:bg-brand-bleu/5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    <Printer size={15} />
                    Facture PDF
                  </a>
                </div>
              ) : commande.statut === StatutCommandeClient.ACCEPTEE ||
                  commande.statut === StatutCommandeClient.LIVREE ? (
                <Link
                  href={`/backoffice/commandes/${commande.id}/facturer`}
                  className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <FileText size={15} />
                  Générer la facture
                </Link>
              ) : (
                <span className="text-xs text-gray-400">
                  Facture générable une fois la commande acceptée.
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
