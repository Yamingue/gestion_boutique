"use client";

import { useTransition } from "react";
import { supprimerFournisseur } from "@/lib/actions/fournisseurs";

export default function BoutonSupprimerFournisseur({ id, nom }: { id: string; nom: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Supprimer le fournisseur « ${nom} » ?`)) return;
    startTransition(async () => {
      try {
        await supprimerFournisseur(id);
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Erreur lors de la suppression.");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-red-500 hover:underline text-xs font-medium disabled:opacity-50"
    >
      {isPending ? "…" : "Supprimer"}
    </button>
  );
}
