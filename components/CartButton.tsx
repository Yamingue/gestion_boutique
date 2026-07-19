"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { ShoppingCart, X, Minus, Plus, Trash2, Package, CheckCircle2, ArrowLeft } from "lucide-react";
import { blobImageSrc } from "@/lib/blobImage";
import { passerCommande } from "@/lib/actions/commandes";
import { useCart } from "./CartProvider";

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

type Vue = "panier" | "formulaire" | "succes";

export default function CartButton() {
  const [open, setOpen] = useState(false);
  const [vue, setVue] = useState<Vue>("panier");
  const [erreur, setErreur] = useState<string | null>(null);
  const [numero, setNumero] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { items, changerQte, retirer, vider, quantiteTotale, total } = useCart();

  function fermer() {
    setOpen(false);
    // Réinitialise la vue après la fermeture (petit délai visuel non nécessaire)
    setVue("panier");
    setErreur(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    const formData = new FormData(e.currentTarget);
    formData.set(
      "lignes",
      JSON.stringify(items.map((l) => ({ produitId: l.produitId, quantite: l.quantite }))),
    );
    startTransition(async () => {
      const res = await passerCommande(formData);
      if (res.error) {
        setErreur(res.error);
        return;
      }
      setNumero(res.numero ?? null);
      vider();
      setVue("succes");
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative text-white/70 hover:text-white transition-colors"
      >
        <ShoppingCart size={20} />
        {quantiteTotale > 0 && (
          <span className="absolute -top-2 -right-2 bg-brand-orange text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {quantiteTotale > 9 ? "9+" : quantiteTotale}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) fermer(); }}
        >
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
            {/* En-tête */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                {vue === "formulaire" ? (
                  <button
                    onClick={() => { setVue("panier"); setErreur(null); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ArrowLeft size={16} />
                  </button>
                ) : (
                  <ShoppingCart size={16} className="text-gray-500" />
                )}
                <span className="font-semibold text-gray-800 text-sm">
                  {vue === "formulaire" ? "Vos coordonnées" : vue === "succes" ? "Commande envoyée" : "Panier"}
                </span>
              </div>
              <button onClick={fermer} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* ── Vue succès ─────────────────────────────────────────────── */}
            {vue === "succes" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
                <CheckCircle2 size={48} className="text-emerald-500" />
                <p className="font-semibold text-gray-800">Merci, votre commande est enregistrée !</p>
                {numero && (
                  <p className="text-sm text-gray-500">
                    Référence : <span className="font-mono font-semibold text-brand-bleu">{numero}</span>
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Nous vous contacterons pour confirmer la livraison.
                </p>
                <button
                  onClick={fermer}
                  className="mt-2 bg-brand-bleu hover:bg-brand-bleu/90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Continuer mes achats
                </button>
              </div>
            ) : vue === "formulaire" ? (
              /* ── Vue formulaire ───────────────────────────────────────── */
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet *</label>
                    <input
                      name="clientNom"
                      required
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-bleu/30"
                      placeholder="Votre nom"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone *</label>
                    <input
                      name="clientTelephone"
                      required
                      inputMode="tel"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-bleu/30"
                      placeholder="Ex : 66 00 00 00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Adresse de livraison</label>
                    <input
                      name="clientAdresse"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-bleu/30"
                      placeholder="Quartier, ville…"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Note (facultatif)</label>
                    <textarea
                      name="notes"
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-bleu/30 resize-none"
                      placeholder="Précisions sur la commande…"
                    />
                  </div>

                  {erreur && (
                    <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{erreur}</p>
                  )}
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-gray-100 shrink-0">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm font-semibold text-gray-700">Total</span>
                    <span className="text-lg font-bold text-brand-bleu">{formatFCFA(total)}</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-brand-orange hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
                  >
                    {isPending ? "Envoi en cours…" : "Confirmer la commande"}
                  </button>
                </div>
              </form>
            ) : (
              /* ── Vue panier ───────────────────────────────────────────── */
              <>
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-200 gap-2">
                      <ShoppingCart size={32} />
                      <p className="text-xs text-gray-400">Votre panier est vide</p>
                    </div>
                  ) : (
                    items.map((l) => (
                      <div key={l.produitId} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                        <div className="w-11 h-11 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                          {l.image ? (
                            <Image
                              src={blobImageSrc(l.image)}
                              alt={l.nom}
                              width={44}
                              height={44}
                              className="object-cover w-full h-full"
                              unoptimized
                            />
                          ) : (
                            <Package size={16} className="text-gray-300" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-800 truncate">{l.nom}</p>
                          <p className="text-xs text-brand-bleu font-bold">
                            {formatFCFA(l.prixUnitaire * l.quantite)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => changerQte(l.produitId, l.quantite - 1)}
                            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-gray-800">{l.quantite}</span>
                          <button
                            onClick={() => changerQte(l.produitId, l.quantite + 1)}
                            disabled={l.quantite >= l.stockActuel}
                            className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-30 text-gray-600 flex items-center justify-center"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <button
                          onClick={() => retirer(l.produitId)}
                          className="text-gray-300 hover:text-red-500 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {items.length > 0 && (
                  <div className="px-4 pb-5 pt-3 border-t border-gray-100 shrink-0">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-semibold text-gray-700">Total</span>
                      <span className="text-lg font-bold text-brand-bleu">{formatFCFA(total)}</span>
                    </div>
                    <button
                      onClick={() => { setErreur(null); setVue("formulaire"); }}
                      className="w-full bg-brand-orange hover:bg-orange-600 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
                    >
                      Passer la commande
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
