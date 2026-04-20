"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import type { Categorie, Produit } from "@/generated/prisma/client";

interface Props {
  categories: Categorie[];
  produit?: Produit;
  action: (formData: FormData) => Promise<{ error: string } | void>;
}

export default function ProduitForm({ categories, produit, action }: Props) {
  const [preview, setPreview] = useState<string | null>(produit?.image ?? null);
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

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form
      onSubmit={handleSubmit}
      encType="multipart/form-data"
      className="bg-white rounded-2xl shadow-sm p-6 max-w-xl space-y-5"
    >
      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Nom */}
        <div className="col-span-2">
          <label className="label">Nom du produit *</label>
          <input name="nom" required defaultValue={produit?.nom} className="input" />
        </div>

        {/* SKU */}
        <div>
          <label className="label">SKU (référence) *</label>
          <input
            name="sku"
            required
            defaultValue={produit?.sku}
            className="input font-mono uppercase"
            placeholder="EX: REP-001"
          />
        </div>

        {/* Catégorie */}
        <div>
          <label className="label">Catégorie *</label>
          <select
            name="categorieId"
            required
            defaultValue={produit?.categorieId ?? ""}
            className="input"
          >
            <option value="" disabled>— Choisir —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>

        {/* Prix */}
        <div>
          <label className="label">Prix unitaire (FCFA) *</label>
          <input
            name="prixUnitaire"
            type="number"
            min={1}
            required
            defaultValue={produit?.prixUnitaire}
            className="input"
          />
        </div>

        {/* Stock */}
        <div>
          <label className="label">Stock actuel</label>
          <input
            name="stockActuel"
            type="number"
            min={0}
            defaultValue={produit?.stockActuel ?? 0}
            className="input"
          />
        </div>

        {/* Seuil */}
        <div>
          <label className="label">Seuil d&apos;alerte</label>
          <input
            name="seuilAlerte"
            type="number"
            min={0}
            defaultValue={produit?.seuilAlerte ?? 10}
            className="input"
          />
          <p className="text-xs text-gray-400 mt-1">Alerte si stock ≤ ce seuil</p>
        </div>

        {/* Taux de commission */}
        <div className="col-span-2">
          <label className="label">Taux de commission sur vente (%)</label>
          <div className="flex items-center gap-2">
            <input
              name="tauxCommission"
              type="number"
              min={0}
              max={100}
              step={0.1}
              defaultValue={produit?.tauxCommission ?? ""}
              placeholder="Ex : 5"
              className="input w-40"
            />
            <span className="text-gray-500 text-sm">%</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Optionnel — laisser vide si aucune commission. Ce taux sera figé sur chaque facture.
          </p>
        </div>

        {/* Image */}
        <div className="col-span-2">
          <label className="label">Image du produit</label>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 bg-gray-50">
              {preview ? (
                <Image
                  src={preview}
                  alt="Aperçu"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <span className="text-3xl text-gray-300">📷</span>
              )}
            </div>

            <div className="flex-1">
              <label
                htmlFor="image-input"
                className="cursor-pointer inline-block bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {preview ? "Changer l'image" : "Choisir une image"}
              </label>
              <input
                id="image-input"
                name="image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageChange}
              />
              <p className="text-xs text-gray-400 mt-2">JPG, PNG ou WebP — max 2 Mo</p>
              {preview && (
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null);
                    const input = document.getElementById("image-input") as HTMLInputElement;
                    if (input) input.value = "";
                  }}
                  className="text-xs text-red-400 hover:text-red-600 mt-1"
                >
                  Supprimer l&apos;image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          {isPending ? "Enregistrement…" : produit ? "Mettre à jour" : "Créer le produit"}
        </button>
        <a href="/catalogue" className="text-sm text-gray-500 hover:text-gray-700 self-center">
          Annuler
        </a>
      </div>
    </form>
  );
}
