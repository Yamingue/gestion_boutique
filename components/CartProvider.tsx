"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "panier-public";

export interface LignePanierPublic {
  produitId:    string;
  nom:          string;
  prixUnitaire: number;
  image:        string | null;
  stockActuel:  number;
  quantite:     number;
}

interface CartContextValue {
  items:          LignePanierPublic[];
  ajouter:        (p: Omit<LignePanierPublic, "quantite">) => void;
  changerQte:     (produitId: string, qte: number) => void;
  retirer:        (produitId: string) => void;
  quantiteTotale: number;
  total:          number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems]       = useState<LignePanierPublic[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage indisponible ou contenu invalide : on repart d'un panier vide
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const ajouter = useCallback((p: Omit<LignePanierPublic, "quantite">) => {
    setItems((prev) => {
      const exist = prev.find((l) => l.produitId === p.produitId);
      if (exist) {
        if (exist.quantite >= p.stockActuel) return prev;
        return prev.map((l) =>
          l.produitId === p.produitId ? { ...l, quantite: l.quantite + 1 } : l
        );
      }
      return [...prev, { ...p, quantite: 1 }];
    });
  }, []);

  const changerQte = useCallback((produitId: string, qte: number) => {
    setItems((prev) => {
      if (qte <= 0) return prev.filter((l) => l.produitId !== produitId);
      return prev.map((l) =>
        l.produitId === produitId ? { ...l, quantite: Math.min(qte, l.stockActuel) } : l
      );
    });
  }, []);

  const retirer = useCallback((produitId: string) => {
    setItems((prev) => prev.filter((l) => l.produitId !== produitId));
  }, []);

  const quantiteTotale = items.reduce((s, l) => s + l.quantite, 0);
  const total          = items.reduce((s, l) => s + l.quantite * l.prixUnitaire, 0);

  return (
    <CartContext.Provider value={{ items, ajouter, changerQte, retirer, quantiteTotale, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans un <CartProvider>");
  return ctx;
}
