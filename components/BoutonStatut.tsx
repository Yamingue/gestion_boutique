"use client";

import { useTransition } from "react";
import { changerStatut } from "@/lib/actions/factures";
import { StatutFacture } from "@/lib/enums";

const transitionsAdmin: Record<StatutFacture, { label: string; next: StatutFacture } | null> = {
  EN_ATTENTE: { label: "Marquer payée", next: StatutFacture.PAYEE },
  PAYEE:      { label: "Annuler",       next: StatutFacture.ANNULEE },
  ANNULEE:    null,
};

const transitionsVendeur: Record<StatutFacture, { label: string; next: StatutFacture } | null> = {
  EN_ATTENTE: { label: "Marquer payée", next: StatutFacture.PAYEE },
  PAYEE:      null,
  ANNULEE:    null,
};

export default function BoutonStatut({
  id,
  statutActuel,
  isAdmin      = false,
  vendeurId,
  currentUserId,
}: {
  id:            string;
  statutActuel:  StatutFacture;
  isAdmin?:      boolean;
  vendeurId?:    string;
  currentUserId?: string;
}) {
  const [isPending, startTransition] = useTransition();

  // Un vendeur ne peut agir que sur ses propres factures
  const isOwner = currentUserId === vendeurId;
  if (!isAdmin && !isOwner) return null;

  const transitions = isAdmin ? transitionsAdmin : transitionsVendeur;
  const transition  = transitions[statutActuel];
  if (!transition) return null;

  function handleClick() {
    if (!confirm(`${transition!.label} ?`)) return;
    startTransition(async () => {
      try {
        await changerStatut(id, transition!.next);
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Erreur.");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-medium text-brand-orange hover:underline disabled:opacity-50"
    >
      {isPending ? "…" : transition.label}
    </button>
  );
}
