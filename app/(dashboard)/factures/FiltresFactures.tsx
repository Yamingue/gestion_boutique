"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useCallback } from "react";
import type { User } from "@/generated/prisma/client";
import { Search, X, Loader2 } from "lucide-react";

interface Props {
  vendeurs: Pick<User, "id" | "nom">[];
}

export default function FiltresFactures({ vendeurs }: Props) {
  const router      = useRouter();
  const pathname    = usePathname();
  const params      = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      // reset to page 1 on filter change
      next.delete("page");
      startTransition(() => router.replace(`${pathname}?${next.toString()}`));
    },
    [params, pathname, router]
  );

  const reset = () =>
    startTransition(() => router.replace(pathname));

  const hasFilters =
    params.has("q") ||
    params.has("vendeurId") ||
    params.has("dateDebut") ||
    params.has("dateFin");

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-end">

      {/* Recherche libre */}
      <div className="flex-1 min-w-48">
        <label className="label text-xs">Rechercher</label>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            placeholder="N° facture, client…"
            defaultValue={params.get("q") ?? ""}
            onChange={(e) => set("q", e.target.value)}
            className="input text-sm pl-7"
          />
        </div>
      </div>

      {/* Filtre vendeur */}
      {vendeurs.length > 1 && (
        <div className="min-w-40">
          <label className="label text-xs">Vendeur</label>
          <select
            value={params.get("vendeurId") ?? ""}
            onChange={(e) => set("vendeurId", e.target.value)}
            className="input text-sm"
          >
            <option value="">Tous les vendeurs</option>
            {vendeurs.map((v) => (
              <option key={v.id} value={v.id}>{v.nom}</option>
            ))}
          </select>
        </div>
      )}

      {/* Date début */}
      <div className="min-w-36">
        <label className="label text-xs">Du</label>
        <input
          type="date"
          value={params.get("dateDebut") ?? ""}
          onChange={(e) => set("dateDebut", e.target.value)}
          className="input text-sm"
        />
      </div>

      {/* Date fin */}
      <div className="min-w-36">
        <label className="label text-xs">Au</label>
        <input
          type="date"
          value={params.get("dateFin") ?? ""}
          onChange={(e) => set("dateFin", e.target.value)}
          className="input text-sm"
        />
      </div>

      {/* Bouton reset */}
      {hasFilters && (
        <button
          onClick={reset}
          disabled={pending}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 border border-gray-200 hover:border-red-300 px-3 py-2 rounded-lg transition-colors self-end"
        >
          {pending
            ? <Loader2 size={13} className="animate-spin" />
            : <X size={13} />
          }
          Réinitialiser
        </button>
      )}
    </div>
  );
}
