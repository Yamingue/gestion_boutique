"use client";

import { useState, useTransition, useRef } from "react";
import { creerCategorie } from "@/lib/actions/catalogue";

export default function CategorieForm() {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await creerCategorie(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}
      <div>
        <label className="label">Nom de la catégorie *</label>
        <input
          name="nom"
          required
          placeholder="Ex : Répéteur, Mini UPS…"
          className="input"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
      >
        {isPending ? "Création…" : "Créer la catégorie"}
      </button>
    </form>
  );
}
