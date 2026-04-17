"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerCommande } from "@/lib/actions/reappro";
import type { Fournisseur, Produit, Categorie } from "@/generated/prisma/client";
import { Plus, Trash2, Package } from "lucide-react";

type ProduitAvecCat = Produit & { categorie: Categorie };

interface Ligne {
  produitId:    string;
  nom:          string;
  sku:          string;
  quantite:     number;
  prixUnitaire: number;
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export default function NouvelleCommandeForm({
  fournisseurs,
  produits,
  defaultFournisseurId = "",
}: {
  fournisseurs:         Fournisseur[];
  produits:             ProduitAvecCat[];
  defaultFournisseurId?: string;
}) {
  const router = useRouter();
  const [lignes, setLignes]           = useState<Ligne[]>([]);
  const [error, setError]             = useState("");
  const [isPending, startTransition]  = useTransition();

  const total = lignes.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);

  function ajouterProduit(produitId: string) {
    if (!produitId || lignes.find((l) => l.produitId === produitId)) return;
    const p = produits.find((p) => p.id === produitId);
    if (!p) return;
    setLignes((prev) => [...prev, {
      produitId: p.id, nom: p.nom, sku: p.sku,
      quantite: 1, prixUnitaire: 0,
    }]);
  }

  function updateLigne(produitId: string, field: "quantite" | "prixUnitaire", value: number) {
    setLignes((prev) =>
      prev.map((l) => l.produitId === produitId ? { ...l, [field]: Math.max(0, value) } : l)
    );
  }

  function retirerLigne(produitId: string) {
    setLignes((prev) => prev.filter((l) => l.produitId !== produitId));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    fd.set("lignes", JSON.stringify(lignes.map((l) => ({
      produitId: l.produitId, quantite: l.quantite, prixUnitaire: l.prixUnitaire,
    }))));

    startTransition(async () => {
      const result = await creerCommande(fd);
      if (result?.error) { setError(result.error); return; }
      router.push("/reappro");
    });
  }

  const produitsDispo = produits.filter((p) => !lignes.find((l) => l.produitId === p.id));

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Fournisseur + notes */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Informations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Fournisseur *</label>
            <select name="fournisseurId" required defaultValue={defaultFournisseurId} className="input">
              <option value="" disabled>— Choisir un fournisseur —</option>
              {fournisseurs.map((f) => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Notes (optionnel)</label>
            <input name="notes" className="input" placeholder="Références, conditions…" />
          </div>
        </div>
      </div>

      {/* Produits */}
      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">Produits à commander</h2>

        {/* Sélecteur */}
        <div className="flex gap-2">
          <select
            className="input flex-1"
            onChange={(e) => { ajouterProduit(e.target.value); e.target.value = ""; }}
            defaultValue=""
          >
            <option value="" disabled>— Ajouter un produit —</option>
            {produitsDispo.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} — {p.sku} (stock: {p.stockActuel})
              </option>
            ))}
          </select>
        </div>

        {/* Tableau lignes */}
        {lignes.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-100">
                <th className="text-left py-2">Produit</th>
                <th className="text-left py-2 hidden sm:table-cell">SKU</th>
                <th className="text-center py-2 w-28">Quantité</th>
                <th className="text-right py-2 w-36">Prix achat unit.</th>
                <th className="text-right py-2 w-32">Sous-total</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lignes.map((l) => (
                <tr key={l.produitId}>
                  <td className="py-2.5 font-medium text-gray-900">{l.nom}</td>
                  <td className="py-2.5 text-gray-400 font-mono text-xs hidden sm:table-cell">{l.sku}</td>
                  <td className="py-2.5 text-center">
                    <input
                      type="number" min={1} value={l.quantite}
                      onChange={(e) => updateLigne(l.produitId, "quantite", parseInt(e.target.value) || 1)}
                      className="w-20 text-center rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-bleu"
                    />
                  </td>
                  <td className="py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <input
                        type="number" min={0} value={l.prixUnitaire}
                        onChange={(e) => updateLigne(l.produitId, "prixUnitaire", parseInt(e.target.value) || 0)}
                        className="w-28 text-right rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-bleu"
                      />
                      <span className="text-xs text-gray-400">FCFA</span>
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-semibold text-gray-800">
                    {formatFCFA(l.prixUnitaire * l.quantite)}
                  </td>
                  <td className="py-2.5 text-center">
                    <button type="button" onClick={() => retirerLigne(l.produitId)}
                      className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-gray-300 border border-dashed border-gray-200 rounded-xl">
            <Package size={32} />
            <p className="text-sm text-gray-400">Aucun produit ajouté</p>
          </div>
        )}

        {/* Total */}
        {lignes.length > 0 && (
          <div className="flex justify-end border-t border-gray-100 pt-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Total HT</p>
              <p className="text-2xl font-bold text-brand-bleu">{formatFCFA(total)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || lignes.length === 0}
          className="inline-flex items-center gap-2 bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          <Plus size={15} />
          {isPending ? "Création…" : "Créer la commande"}
        </button>
        <a href="/reappro" className="text-sm text-gray-500 hover:text-gray-700 self-center">Annuler</a>
      </div>
    </form>
  );
}
