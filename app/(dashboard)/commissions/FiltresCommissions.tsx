"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { User } from "@/generated/prisma/client";

interface Props {
  agents: Pick<User, "id" | "nom">[];
}

export default function FiltresCommissions({ agents }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const query = new URLSearchParams();
    const vendeurId  = fd.get("vendeurId") as string;
    const dateDebut  = fd.get("dateDebut") as string;
    const dateFin    = fd.get("dateFin") as string;
    if (vendeurId)  query.set("vendeurId",  vendeurId);
    if (dateDebut)  query.set("dateDebut",  dateDebut);
    if (dateFin)    query.set("dateFin",    dateFin);
    startTransition(() => router.push(`/commissions?${query.toString()}`));
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-5 flex flex-wrap gap-4 items-end">
      <div>
        <label className="label">Agent / Vendeur</label>
        <select name="vendeurId" defaultValue={params.get("vendeurId") ?? ""} className="input w-48">
          <option value="">— Tous les agents —</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.nom}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Du</label>
        <input
          name="dateDebut"
          type="date"
          defaultValue={params.get("dateDebut") ?? ""}
          className="input"
        />
      </div>

      <div>
        <label className="label">Au</label>
        <input
          name="dateFin"
          type="date"
          defaultValue={params.get("dateFin") ?? ""}
          className="input"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand-bleu hover:bg-blue-800 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
      >
        {isPending ? "Chargement…" : "Calculer"}
      </button>
    </form>
  );
}
