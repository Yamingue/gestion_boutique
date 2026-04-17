"use client";

import { useTransition } from "react";
import { supprimerClient } from "@/lib/actions/clients";

export default function BoutonSupprimerClient({ id, nom }: { id: string; nom: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(`Supprimer le client « ${nom} » ?`)) return;
    startTransition(async () => {
      try {
        await supprimerClient(id);
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
