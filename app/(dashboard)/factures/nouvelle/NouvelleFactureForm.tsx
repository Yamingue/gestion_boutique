"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerFacture } from "@/lib/actions/factures";
import type { Client, Produit, Categorie } from "@/generated/prisma/client";

type ProduitAvecCategorie = Produit & { categorie: Categorie };

interface LigneForm {
  produitId: string;
  nom: string;
  prixUnitaire: number;
  stockActuel: number;
  quantite: number;
  tauxCommission: number | null;
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export default function NouvelleFactureForm({
  clients,
  produits,
}: {
  clients: Client[];
  produits: ProduitAvecCategorie[];
}) {
  const router = useRouter();
  const [lignes, setLignes] = useState<LigneForm[]>([]);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const total = lignes.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);

  function ajouterProduit(produitId: string) {
    if (!produitId) return;
    if (lignes.find((l) => l.produitId === produitId)) return;
    const p = produits.find((p) => p.id === produitId);
    if (!p) return;
    setLignes((prev) => [
      ...prev,
      {
        produitId: p.id,
        nom: p.nom,
        prixUnitaire: p.prixUnitaire,
        stockActuel: p.stockActuel,
        quantite: 1,
        tauxCommission: p.tauxCommission ?? null,
      },
    ]);
  }

  function retirerLigne(produitId: string) {
    setLignes((prev) => prev.filter((l) => l.produitId !== produitId));
  }

  function changerQuantite(produitId: string, qte: number) {
    setLignes((prev) =>
      prev.map((l) =>
        l.produitId === produitId
          ? { ...l, quantite: Math.max(1, Math.min(qte, l.stockActuel)) }
          : l
      )
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (lignes.length === 0) { setError("Ajoutez au moins un produit."); return; }

    const formData = new FormData(e.currentTarget);
    formData.set("lignes", JSON.stringify(
      lignes.map((l) => ({
        produitId: l.produitId,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        tauxCommission: l.tauxCommission,
      }))
    ));

    startTransition(async () => {
      const result = await creerFacture(formData);
      if (result?.error) setError(result.error);
      else router.push("/factures");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Client */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Client</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Sélectionner un client *</label>
            <select name="clientId" required defaultValue="" className="input">
              <option value="" disabled>— Choisir un client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.nom} {c.telephone ? `— ${c.telephone}` : ""}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Notes (optionnel)</label>
            <textarea name="notes" rows={2} className="input resize-none" placeholder="Remarques, conditions…" />
          </div>
        </div>
      </div>

      {/* Produits */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">Produits</h2>

        {/* Sélecteur d'ajout */}
        <div className="mb-4">
          <label className="label">Ajouter un produit</label>
          <select
            className="input"
            onChange={(e) => { ajouterProduit(e.target.value); e.target.value = ""; }}
            defaultValue=""
          >
            <option value="" disabled>— Choisir un produit —</option>
            {produits
              .filter((p) => !lignes.find((l) => l.produitId === p.id))
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom} — {formatFCFA(p.prixUnitaire)} (stock: {p.stockActuel})
                </option>
              ))}
          </select>
        </div>

        {/* Tableau des lignes */}
        {lignes.length > 0 && (
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="text-left py-2">Produit</th>
                <th className="text-right py-2 w-32">Prix unit.</th>
                <th className="text-center py-2 w-24">Commission</th>
                <th className="text-center py-2 w-28">Quantité</th>
                <th className="text-right py-2 w-32">Sous-total</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lignes.map((l) => (
                <tr key={l.produitId}>
                  <td className="py-2 font-medium text-gray-800">{l.nom}</td>
                  <td className="py-2 text-right text-gray-600">{formatFCFA(l.prixUnitaire)}</td>
                  <td className="py-2 text-center text-sm">
                    {l.tauxCommission != null
                      ? <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{l.tauxCommission}%</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="number"
                      min={1}
                      max={l.stockActuel}
                      value={l.quantite}
                      onChange={(e) => changerQuantite(l.produitId, parseInt(e.target.value) || 1)}
                      className="w-20 text-center rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-bleu"
                    />
                    <p className="text-xs text-gray-400 mt-0.5">/ {l.stockActuel}</p>
                  </td>
                  <td className="py-2 text-right font-semibold text-gray-900">
                    {formatFCFA(l.prixUnitaire * l.quantite)}
                  </td>
                  <td className="py-2 text-center">
                    <button
                      type="button"
                      onClick={() => retirerLigne(l.produitId)}
                      className="text-red-400 hover:text-red-600 text-lg leading-none"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {lignes.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-xl">
            Aucun produit ajouté
          </p>
        )}

        {/* Total */}
        {lignes.length > 0 && (
          <div className="flex justify-end border-t border-gray-100 pt-3">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total TTC</p>
              <p className="text-2xl font-bold text-brand-bleu">{formatFCFA(total)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || lignes.length === 0}
          className="bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {isPending ? "Création en cours…" : "Valider la facture"}
        </button>
        <a href="/factures" className="text-sm text-gray-500 hover:text-gray-700 self-center">
          Annuler
        </a>
      </div>
    </form>
  );
}
