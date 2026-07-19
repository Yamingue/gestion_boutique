"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, MapPin, FileText, Printer } from "lucide-react";
import { genererFacture } from "@/lib/actions/commandes";
import { StatutCommandeClient } from "@/lib/enums";

interface LigneFacturer {
  id:                string;
  nomProduit:        string;
  prixUnitaire:      number;
  quantite:          number;
  montantCommission: number;
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

const STATUT_BADGE: Record<StatutCommandeClient, { label: string; className: string }> = {
  EN_ATTENTE: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  ACCEPTEE:   { label: "Acceptée",   className: "bg-blue-100 text-blue-700" },
  LIVREE:     { label: "Livrée",     className: "bg-emerald-100 text-emerald-700" },
  REFUSEE:    { label: "Refusée",    className: "bg-red-100 text-red-700" },
};

export default function FacturerCommandeForm({
  commandeId,
  numero,
  clientNom,
  clientTelephone,
  clientAdresse,
  statutCommande,
  lignes,
  total,
}: {
  commandeId:      string;
  numero:          string;
  clientNom:       string;
  clientTelephone: string;
  clientAdresse:   string | null;
  statutCommande:  StatutCommandeClient;
  lignes:          LigneFacturer[];
  total:           number;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function soumettre(pdf: boolean) {
    if (!formRef.current) return;
    setError("");
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      try {
        const res = await genererFacture(commandeId, formData);
        router.push(
          pdf
            ? `/backoffice/factures/${res.factureId}/imprimer`
            : `/backoffice/factures/${res.factureId}`,
        );
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erreur lors de la génération.");
      }
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    soumettre(false);
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {statutCommande !== StatutCommandeClient.LIVREE && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Cette commande n&apos;est pas encore livrée. Générer la facture ne modifie pas le stock :
          le stock sera décrémenté uniquement à la validation de la livraison.
        </p>
      )}

      {/* Client (issu de la commande) */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h2 className="font-semibold text-gray-800">Client</h2>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-brand-bleu">{numero}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUT_BADGE[statutCommande].className}`}>
              {STATUT_BADGE[statutCommande].label}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <p className="flex items-center gap-2 text-gray-700">
            <User size={14} className="text-gray-400" /> {clientNom}
          </p>
          <p className="flex items-center gap-2 text-gray-700">
            <Phone size={14} className="text-gray-400" /> {clientTelephone}
          </p>
          {clientAdresse && (
            <p className="flex items-center gap-2 text-gray-700">
              <MapPin size={14} className="text-gray-400" /> {clientAdresse}
            </p>
          )}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Le client sera rattaché à un fiche existante (même téléphone) ou créé automatiquement.
        </p>
      </div>

      {/* Produits (non modifiables — repris de la commande) */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Articles</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-100">
              <th className="text-left py-2">Produit</th>
              <th className="text-right py-2 w-32">Prix unit.</th>
              <th className="text-center py-2 w-24">Commission</th>
              <th className="text-center py-2 w-20">Qté</th>
              <th className="text-right py-2 w-32">Sous-total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {lignes.map((l) => (
              <tr key={l.id}>
                <td className="py-2 font-medium text-gray-800">{l.nomProduit}</td>
                <td className="py-2 text-right text-gray-600">{formatFCFA(l.prixUnitaire)}</td>
                <td className="py-2 text-center">
                  {l.montantCommission > 0 ? (
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {formatFCFA(l.montantCommission)}
                    </span>
                  ) : (
                    <span className="text-gray-300">—</span>
                  )}
                </td>
                <td className="py-2 text-center font-bold text-brand-bleu">{l.quantite}</td>
                <td className="py-2 text-right font-semibold text-gray-900">
                  {formatFCFA(l.prixUnitaire * l.quantite)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end border-t border-gray-100 pt-3 mt-2">
          <div className="text-right">
            <p className="text-sm text-gray-500">Total TTC</p>
            <p className="text-2xl font-bold text-brand-bleu">{formatFCFA(total)}</p>
          </div>
        </div>
      </div>

      {/* Options facture */}
      <div className="bg-white rounded-2xl shadow-sm p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Statut de la facture</label>
          <select name="statut" defaultValue="PAYEE" className="input">
            <option value="PAYEE">Payée</option>
            <option value="EN_ATTENTE">En attente</option>
          </select>
        </div>
        <div>
          <label className="label">Notes (optionnel)</label>
          <input name="notes" className="input" placeholder={`Commande ${numero}`} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          <FileText size={15} />
          {isPending ? "Génération en cours…" : "Valider la facture"}
        </button>
        <button
          type="button"
          onClick={() => soumettre(true)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 bg-brand-bleu hover:bg-brand-bleu/90 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Printer size={15} />
          {isPending ? "Génération en cours…" : "Valider et générer le PDF"}
        </button>
        <a href="/backoffice/commandes" className="text-sm text-gray-500 hover:text-gray-700 self-center">
          Annuler
        </a>
      </div>
    </form>
  );
}
