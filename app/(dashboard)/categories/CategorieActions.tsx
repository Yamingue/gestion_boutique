"use client";

import { useActionState, useState } from "react";
import { modifierCategorie, supprimerCategorie } from "@/lib/actions/catalogue";

interface Props {
  categorie: { id: string; nom: string };
  nbProduits: number;
}

const initialState = { error: "" };

export default function CategorieActions({ categorie, nbProduits }: Props) {
  const [editing, setEditing] = useState(false);

  const action = modifierCategorie.bind(null, categorie.id);
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData) => {
      const result = await action(formData);
      if (!result?.error) setEditing(false);
      return result ?? initialState;
    },
    initialState
  );

  async function handleSupprimer() {
    if (!confirm(`Supprimer « ${categorie.nom} » ?`)) return;
    try {
      await supprimerCategorie(categorie.id);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erreur lors de la suppression.");
    }
  }

  if (editing) {
    return (
      <form action={formAction} className="flex items-center gap-2 justify-end">
        {state?.error && (
          <span className="text-xs text-red-500">{state.error}</span>
        )}
        <input
          name="nom"
          required
          defaultValue={categorie.nom}
          className="input w-36 py-1 text-xs"
          autoFocus
        />
        <button
          type="submit"
          disabled={pending}
          className="text-xs bg-brand-bleu text-white px-2 py-1 rounded-lg disabled:opacity-60"
        >
          {pending ? "…" : "OK"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Annuler
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-3 justify-end">
      <button
        onClick={() => setEditing(true)}
        className="text-brand-bleu hover:underline text-xs font-medium"
      >
        Modifier
      </button>
      <button
        onClick={handleSupprimer}
        disabled={nbProduits > 0}
        title={nbProduits > 0 ? `${nbProduits} produit(s) utilisent cette catégorie` : ""}
        className="text-red-500 hover:underline text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Supprimer
      </button>
    </div>
  );
}
