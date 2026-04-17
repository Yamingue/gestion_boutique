"use client";

import { useState, useTransition } from "react";

interface Props {
  action:    (formData: FormData) => Promise<{ error: string } | void>;
  defaults?: { nom?: string; telephone?: string; email?: string; adresse?: string };
  submitLabel?: string;
}

export default function FournisseurForm({ action, defaults = {}, submitLabel = "Enregistrer" }: Props) {
  const [error, setError]     = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(fd);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-xl">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
        <div>
          <label className="label">Nom du fournisseur *</label>
          <input name="nom" required defaultValue={defaults.nom} className="input" placeholder="Ex : Fournisseur ABC" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Téléphone</label>
            <input name="telephone" type="tel" defaultValue={defaults.telephone ?? ""} className="input" placeholder="+235 66 00 00 00" />
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" defaultValue={defaults.email ?? ""} className="input" placeholder="contact@fournisseur.com" />
          </div>
        </div>
        <div>
          <label className="label">Adresse</label>
          <textarea name="adresse" rows={2} defaultValue={defaults.adresse ?? ""} className="input resize-none" placeholder="Adresse complète…" />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
        >
          {isPending ? "Enregistrement…" : submitLabel}
        </button>
        <a href="/fournisseurs" className="text-sm text-gray-500 hover:text-gray-700 self-center">
          Annuler
        </a>
      </div>
    </form>
  );
}
