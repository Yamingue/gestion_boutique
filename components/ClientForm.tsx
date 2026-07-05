"use client";

import { useState, useTransition } from "react";
import type { Client } from "@/generated/prisma/client";

interface Props {
  client?: Client;
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

export default function ClientForm({ client, action }: Props) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 max-w-xl space-y-5">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nom complet *</label>
          <input name="nom" required defaultValue={client?.nom} className="input" placeholder="Ex : Jean Dupont" />
        </div>

        <div>
          <label className="label">Téléphone</label>
          <input name="telephone" type="tel" defaultValue={client?.telephone ?? ""} className="input" placeholder="+235 66 00 00 00" />
        </div>

        <div>
          <label className="label">Email</label>
          <input name="email" type="email" defaultValue={client?.email ?? ""} className="input" placeholder="jean@exemple.com" />
        </div>

        <div className="col-span-2">
          <label className="label">Adresse</label>
          <textarea name="adresse" rows={2} defaultValue={client?.adresse ?? ""} className="input resize-none" placeholder="Quartier, Ville…" />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          {isPending ? "Enregistrement…" : client ? "Mettre à jour" : "Créer le client"}
        </button>
        <a href="/backoffice/clients" className="text-sm text-gray-500 hover:text-gray-700 self-center">
          Annuler
        </a>
      </div>
    </form>
  );
}
