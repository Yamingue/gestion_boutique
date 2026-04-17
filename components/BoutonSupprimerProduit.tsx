"use client";

import { useTransition } from "react";
import { supprimerProduit } from "@/lib/actions/catalogue";

export default function BoutonSupprimerProduit({ id, nom }: { id: string; nom: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Supprimer « ${nom} » ?`)) return;
    startTransition(() => supprimerProduit(id));
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
