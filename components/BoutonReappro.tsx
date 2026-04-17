"use client";

import { useTransition } from "react";
import { receptionnerCommande, annulerCommande } from "@/lib/actions/reappro";
import { StatutCommande } from "@/lib/enums";
import { CheckCircle2, XCircle } from "lucide-react";

export default function BoutonReappro({
  id,
  statut,
}: {
  id:     string;
  statut: StatutCommande;
}) {
  const [isPending, startTransition] = useTransition();

  if (statut !== StatutCommande.EN_COURS) return null;

  function handleReceptionner() {
    if (!confirm("Confirmer la réception ? Le stock sera mis à jour automatiquement.")) return;
    startTransition(async () => {
      try { await receptionnerCommande(id); }
      catch (e: unknown) { alert(e instanceof Error ? e.message : "Erreur."); }
    });
  }

  function handleAnnuler() {
    if (!confirm("Annuler cette commande ?")) return;
    startTransition(async () => {
      try { await annulerCommande(id); }
      catch (e: unknown) { alert(e instanceof Error ? e.message : "Erreur."); }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleReceptionner}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg disabled:opacity-50 transition-colors"
      >
        <CheckCircle2 size={12} />
        Réceptionner
      </button>
      <button
        onClick={handleAnnuler}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg disabled:opacity-50 transition-colors"
      >
        <XCircle size={12} />
        Annuler
      </button>
    </div>
  );
}
