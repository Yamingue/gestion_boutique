"use client";

import Image from "next/image";
import { Package, Plus } from "lucide-react";
import { blobImageSrc } from "@/lib/blobImage";
import { useCart } from "./CartProvider";
import type { Produit, Categorie } from "@/generated/prisma/client";

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export default function ProduitCardPublic({
  produit,
}: {
  produit: Produit & { categorie: Categorie };
}) {
  const { items, ajouter } = useCart();

  const dansPanier  = items.find((l) => l.produitId === produit.id);
  const enRupture   = produit.stockActuel <= 0;
  const atteintMax  = (dansPanier?.quantite ?? 0) >= produit.stockActuel;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
        {produit.image ? (
          <Image
            src={blobImageSrc(produit.image)}
            alt={produit.nom}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <Package size={32} className="text-gray-300" />
        )}
        {enRupture && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Rupture
          </span>
        )}
        {dansPanier && (
          <span className="absolute top-2 right-2 bg-brand-orange text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {dansPanier.quantite}
          </span>
        )}
      </div>

      <div className="p-3">
        <p className="text-[11px] text-gray-400 uppercase tracking-wide">
          {produit.categorie.nom}
        </p>
        <p className="text-sm font-semibold text-gray-900 truncate">{produit.nom}</p>
        <p className="text-sm font-bold text-brand-bleu mt-1">
          {formatFCFA(produit.prixUnitaire)}
        </p>

        <button
          onClick={() =>
            ajouter({
              produitId:   produit.id,
              nom:         produit.nom,
              prixUnitaire: produit.prixUnitaire,
              image:       produit.image,
              stockActuel: produit.stockActuel,
            })
          }
          disabled={enRupture || atteintMax}
          className="mt-2 w-full flex items-center justify-center gap-1.5 bg-brand-orange hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 rounded-lg transition-colors"
        >
          <Plus size={13} />
          Ajouter
        </button>
      </div>
    </div>
  );
}
