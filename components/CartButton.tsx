"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, X, Minus, Plus, Trash2, Package } from "lucide-react";
import { blobImageSrc } from "@/lib/blobImage";
import { useCart } from "./CartProvider";

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export default function CartButton() {
  const [open, setOpen] = useState(false);
  const { items, changerQte, retirer, quantiteTotale, total } = useCart();

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
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-sm bg-white h-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-gray-500" />
                <span className="font-semibold text-gray-800 text-sm">Panier</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

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
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
