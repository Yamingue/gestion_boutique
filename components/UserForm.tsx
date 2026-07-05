"use client";

import { useState, useTransition } from "react";
import { User } from "@/generated/prisma/client";

interface Props {
  user?: User;
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

export default function UserForm({ user, action }: Props) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    
    if (!user && !formData.get("password")) {
      setError("Le mot de passe est obligatoire pour la création.");
      return;
    }

    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm p-6 max-w-xl space-y-5 border border-gray-100"
    >
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 border border-red-100">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Nom */}
        <div className="col-span-2">
          <label className="label text-sm font-medium text-gray-700 block mb-1">Nom complet *</label>
          <input name="nom" required defaultValue={user?.nom} className="input w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-bleu focus:border-transparent transition-all" placeholder="Ex: Jean Dupont" />
        </div>

        {/* Email */}
        <div className="col-span-2 sm:col-span-1">
          <label className="label text-sm font-medium text-gray-700 block mb-1">Adresse e-mail *</label>
          <input
            name="email"
            type="email"
            required
            defaultValue={user?.email}
            className="input w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-bleu focus:border-transparent transition-all"
            placeholder="jean@shop.com"
          />
        </div>

        {/* Rôle */}
        <div className="col-span-2 sm:col-span-1">
          <label className="label text-sm font-medium text-gray-700 block mb-1">Rôle d'accès *</label>
          <select
            name="role"
            required
            defaultValue={user?.role ?? "VENDEUR"}
            className="input w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-bleu focus:border-transparent transition-all"
          >
            <option value="VENDEUR">Vendeur (Point de vente)</option>
            <option value="ADMIN">Administrateur (Accès total)</option>
          </select>
        </div>

        {/* Password */}
        <div className="col-span-2">
          <label className="label text-sm font-medium text-gray-700 block mb-1">
            Mot de passe {user ? "(Optionnel - Seulement pour modifier)" : "*"}
          </label>
          <input
            name="password"
            type="password"
            required={!user}
            className="input w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-bleu focus:border-transparent transition-all"
            placeholder={user ? "Laisser vide pour ne pas modifier" : "Entrer un mot de passe sécurisé"}
            minLength={6}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-bleu hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors shadow-sm"
        >
          {isPending ? "Enregistrement…" : user ? "Mettre à jour" : "Créer le compte"}
        </button>
        <a href="/backoffice/utilisateurs" className="text-sm text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-5 py-2.5 rounded-lg font-medium transition-colors">
          Annuler
        </a>
      </div>
    </form>
  );
}
