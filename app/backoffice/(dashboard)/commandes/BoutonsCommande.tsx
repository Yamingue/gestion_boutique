"use client";

import { useTransition } from "react";
import { Check, Truck, X } from "lucide-react";
import { accepterCommande, confirmerLivraison, refuserCommande } from "@/lib/actions/commandes";
import { StatutCommandeClient } from "@/lib/enums";

export default function BoutonsCommande({
  id,
  statut,
}: {
  id:     string;
  statut: StatutCommandeClient;
}) {
  const [isPending, startTransition] = useTransition();

  function run(fn: () => Promise<void>, confirmation: string) {
    if (!confirm(confirmation)) return;
    startTransition(async () => {
      try {
        await fn();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Erreur.");
      }
    });
  }

  if (statut === StatutCommandeClient.LIVREE || statut === StatutCommandeClient.REFUSEE) {
    return null;
  }

  const btnBase =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {statut === StatutCommandeClient.EN_ATTENTE && (
        <button
          onClick={() => run(() => accepterCommande(id), "Accepter cette commande ?")}
          disabled={isPending}
          className={`${btnBase} bg-emerald-600 hover:bg-emerald-700 text-white`}
        >
          <Check size={13} /> Accepter
        </button>
      )}

      {statut === StatutCommandeClient.ACCEPTEE && (
        <button
          onClick={() => run(() => confirmerLivraison(id), "Confirmer la livraison ? Le stock sera décrémenté.")}
          disabled={isPending}
          className={`${btnBase} bg-brand-bleu hover:bg-brand-bleu/90 text-white`}
        >
          <Truck size={13} /> Confirmer livraison
        </button>
      )}

      <button
        onClick={() => run(() => refuserCommande(id), "Refuser cette commande ?")}
        disabled={isPending}
        className={`${btnBase} bg-white text-red-600 border border-red-200 hover:bg-red-50`}
      >
        <X size={13} /> Refuser
      </button>
    </div>
  );
}
