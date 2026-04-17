"use client";

import { useTransition } from "react";
import { supprimerUtilisateur } from "@/lib/actions/utilisateurs";
import { Trash2 } from "lucide-react";

export default function BoutonSupprimerUtilisateur({ id, disabled }: { id: string, disabled?: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ? Cette ligne sera supprimée définitivement.")) return;
    
    startTransition(async () => {
      const result = await supprimerUtilisateur(id);
      if (result?.error) {
        alert(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending || disabled}
      className={`p-2 rounded-lg transition-colors ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
      title={disabled ? "Impossible (des factures de ce vendeur existent)" : "Supprimer"}
    >
      <Trash2 size={18} />
    </button>
  );
}
