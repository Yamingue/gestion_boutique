"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import { blobImageSrc } from "@/lib/blobImage";
import { useRouter } from "next/navigation";
import { creerFacture } from "@/lib/actions/factures";
import { creerClientRapide } from "@/lib/actions/clients";
import { StatutFacture } from "@/lib/enums";
import type { Client, Produit, Categorie } from "@/generated/prisma/client";
import {
  Package, ShoppingCart, Minus, Plus, CheckCircle,
  Trash2, UserPlus, X, Search,
} from "lucide-react";

const STATUTS = [
  { value: StatutFacture.EN_ATTENTE, label: "En attente",  color: "text-yellow-600" },
  { value: StatutFacture.PAYEE,      label: "Payée",       color: "text-emerald-600" },
  { value: StatutFacture.ANNULEE,    label: "Annulée",     color: "text-red-500" },
] as const;

type ProduitAvecCategorie = Produit & { categorie: Categorie };

interface LignePanier {
  produitId:         string;
  nom:               string;
  prixUnitaire:      number;
  stockActuel:       number;
  quantite:          number;
  image:             string | null;
  montantCommission: number;
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

/* ── Modale création client rapide ──────────────────────────────────────── */

function ModalNouveauClient({
  onClose,
  onCreated,
}: {
  onClose:   () => void;
  onCreated: (client: Client) => void;
}) {
  const [error, setError]       = useState("");
  const [isPending, start]      = useTransition();
  const formRef                 = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const result = await creerClientRapide(fd);
      if (result.error) { setError(result.error); return; }
      if (result.client) {
        formRef.current?.reset();
        onCreated(result.client);
      }
    });
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
        {/* Header modale */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-brand-orange" />
            <h2 className="font-bold text-gray-900">Nouveau client</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <div>
            <label className="label text-xs">Nom complet *</label>
            <input
              name="nom"
              required
              autoFocus
              placeholder="Jean Dupont"
              className="input text-sm"
            />
          </div>

          <div>
            <label className="label text-xs">Téléphone</label>
            <input
              name="telephone"
              type="tel"
              placeholder="+235 66 00 00 00"
              className="input text-sm"
            />
          </div>

          <div>
            <label className="label text-xs">Email</label>
            <input
              name="email"
              type="email"
              placeholder="jean@exemple.com"
              className="input text-sm"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-brand-orange hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
            >
              {isPending ? "Création…" : "Créer et sélectionner"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Interface POS principale ────────────────────────────────────────────── */

export default function POSInterface({
  clients: clientsInitiaux,
  categories,
  produits,
}: {
  clients:    Client[];
  categories: Categorie[];
  produits:   ProduitAvecCategorie[];
}) {
  const router = useRouter();

  const [clients, setClients]                  = useState<Client[]>(clientsInitiaux);
  const [categorieActive, setCategorieActive]  = useState<string>("TOUS");
  const [recherche, setRecherche]              = useState("");
  const [panier, setPanier]                    = useState<LignePanier[]>([]);
  const [clientId, setClientId]                = useState("");
  const [clientSearch, setClientSearch]        = useState("");
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [statut, setStatut]                    = useState<StatutFacture>(StatutFacture.EN_ATTENTE);
  const [notes, setNotes]                      = useState("");
  const [error, setError]                      = useState("");
  const [succes, setSucces]                    = useState("");
  const [showModal, setShowModal]              = useState(false);
  const [isPending, startTransition]           = useTransition();
  const clientSearchRef                        = useRef<HTMLDivElement>(null);

  // Fermer le dropdown client si on clique ailleurs
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (clientSearchRef.current && !clientSearchRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const clientNomSelectionne = clients.find((c) => c.id === clientId)?.nom ?? "";

  const clientsFiltres = clients.filter((c) =>
    c.nom.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.telephone ?? "").includes(clientSearch)
  );

  const produitsFiltres = produits.filter((p) => {
    const matchCat    = categorieActive === "TOUS" || p.categorieId === categorieActive;
    const matchSearch = p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
                        p.sku.toLowerCase().includes(recherche.toLowerCase());
    return matchCat && matchSearch;
  });

  const total = panier.reduce((s, l) => s + l.prixUnitaire * l.quantite, 0);

  function ajouterAuPanier(p: ProduitAvecCategorie) {
    const sousTotal = p.prixUnitaire;
    const montantCommission = p.tauxCommission 
      ? Math.round(sousTotal * p.tauxCommission / 100)
      : 0;
    
    setPanier((prev) => {
      const exist = prev.find((l) => l.produitId === p.id);
      if (exist) {
        if (exist.quantite >= p.stockActuel) return prev;
        return prev.map((l) =>
          l.produitId === p.id ? { ...l, quantite: l.quantite + 1, montantCommission: l.montantCommission + montantCommission } : l
        );
      }
      return [...prev, {
        produitId: p.id, nom: p.nom, prixUnitaire: p.prixUnitaire,
        stockActuel: p.stockActuel, quantite: 1, image: p.image,
        montantCommission,
      }];
    });
  }

  function changerQte(produitId: string, qte: number) {
    if (qte <= 0) { retirerDuPanier(produitId); return; }
    setPanier((prev) =>
      prev.map((l) =>
        l.produitId === produitId
          ? { ...l, quantite: Math.min(qte, l.stockActuel) }
          : l
      )
    );
  }

  function retirerDuPanier(produitId: string) {
    setPanier((prev) => prev.filter((l) => l.produitId !== produitId));
  }

  function viderPanier() {
    setPanier([]);
    setClientId("");
    setClientSearch("");
    setNotes("");
    setStatut(StatutFacture.EN_ATTENTE);
  }

  function handleClientCreated(client: Client) {
    setClients((prev) => [...prev, client].sort((a, b) => a.nom.localeCompare(b.nom)));
    setClientId(client.id);
    setClientSearch(client.nom);
    setShowModal(false);
  }

  function valider() {
    setError("");
    setSucces("");
    if (!clientId)           { setError("Sélectionnez un client.");  return; }
    if (panier.length === 0) { setError("Le panier est vide.");       return; }

    const formData = new FormData();
    formData.set("clientId", clientId);
    formData.set("notes", notes);
    formData.set("statut", statut);
    formData.set("lignes", JSON.stringify(
      panier.map((l) => ({
        produitId: l.produitId,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        montantCommission: l.montantCommission,
      }))
    ));

    startTransition(async () => {
      const result = await creerFacture(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push(`/backoffice/factures/${result.factureId}`);
      }
    });
  }

  const quantitePanier = panier.reduce((s, l) => s + l.quantite, 0);

  return (
    <>
      {showModal && (
        <ModalNouveauClient
          onClose={() => setShowModal(false)}
          onCreated={handleClientCreated}
        />
      )}

      <div className="flex gap-0 h-[calc(100vh-4rem)] -m-8">

        {/* ── GAUCHE : catalogue ──────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 p-8 overflow-hidden">
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Point de vente</h1>
              <p className="text-sm text-gray-400 mt-0.5">{produits.length} produit(s) disponible(s)</p>
            </div>
          </div>

          <input
            type="search"
            placeholder="Rechercher un produit ou SKU…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="input mb-4 shrink-0"
          />

          <div className="flex gap-1.5 flex-wrap mb-4 shrink-0">
            <button
              onClick={() => setCategorieActive("TOUS")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categorieActive === "TOUS"
                  ? "bg-brand-bleu text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              Tous
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategorieActive(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  categorieActive === c.id
                    ? "bg-brand-bleu text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {c.nom}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 pr-1">
            {produitsFiltres.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-300 gap-2">
                <Package size={36} />
                <p className="text-sm">Aucun produit disponible</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {produitsFiltres.map((p) => {
                  const dansPanier  = panier.find((l) => l.produitId === p.id);
                  const stockRestant = p.stockActuel - (dansPanier?.quantite ?? 0);
                  const epuise       = stockRestant <= 0;

                  return (
                    <button
                      key={p.id}
                      onClick={() => ajouterAuPanier(p)}
                      disabled={epuise}
                      className={`relative text-left bg-white rounded-xl border p-3 transition-all ${
                        epuise
                          ? "border-gray-100 opacity-40 cursor-not-allowed"
                          : dansPanier
                          ? "border-brand-orange shadow-sm"
                          : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="w-full aspect-square rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center mb-2">
                        {p.image ? (
                          <Image src={blobImageSrc(p.image)} alt={p.nom} width={120} height={120}
                            className="object-cover w-full h-full" unoptimized />
                        ) : (
                          <Package size={28} className="text-gray-200" />
                        )}
                      </div>

                      <p className="font-semibold text-gray-900 text-sm truncate">{p.nom}</p>
                      <p className="text-xs text-gray-400 mb-1">{p.sku}</p>
                      <p className="text-brand-bleu font-bold text-sm">{formatFCFA(p.prixUnitaire)}</p>

                      {dansPanier && (
                        <span className="absolute top-2 right-2 bg-brand-orange text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {dansPanier.quantite}
                        </span>
                      )}

                      <p className={`text-xs mt-1 ${stockRestant <= 3 ? "text-red-400" : "text-gray-300"}`}>
                        {epuise ? "Épuisé" : `Stock : ${stockRestant}`}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── DROITE : panier ─────────────────────────────────────────── */}
        <div className="w-80 shrink-0 bg-white border-l border-gray-100 flex flex-col">

          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-gray-500" />
              <span className="font-semibold text-gray-800 text-sm">Panier</span>
              {quantitePanier > 0 && (
                <span className="bg-brand-orange text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {quantitePanier}
                </span>
              )}
            </div>
            {panier.length > 0 && (
              <button
                onClick={() => { viderPanier(); setError(""); setSucces(""); }}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={12} />
                Vider
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {panier.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-200 gap-2">
                <ShoppingCart size={28} />
                <p className="text-xs text-gray-400">Cliquez sur un produit</p>
              </div>
            ) : (
              panier.map((l) => (
                <div key={l.produitId} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                    {l.image ? (
                      <Image src={blobImageSrc(l.image)} alt={l.nom} width={40} height={40}
                        className="object-cover w-full h-full" unoptimized />
                    ) : (
                      <Package size={14} className="text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">{l.nom}</p>
                    <p className="text-xs text-brand-bleu font-bold">
                      {formatFCFA(l.prixUnitaire * l.quantite)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => changerQte(l.produitId, l.quantite - 1)}
                      className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 flex items-center justify-center"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-gray-800">{l.quantite}</span>
                    <button
                      onClick={() => changerQte(l.produitId, l.quantite + 1)}
                      disabled={l.quantite >= l.stockActuel}
                      className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-30 text-gray-600 flex items-center justify-center"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 pb-5 pt-3 border-t border-gray-100 space-y-3">

            {/* Recherche client live */}
            <div>
              <label className="label text-xs">Client *</label>
              <div className="flex gap-2">
                <div ref={clientSearchRef} className="relative flex-1 min-w-0">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Rechercher un client…"
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setClientId("");
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      className={`input text-sm pl-7 pr-6 ${clientId ? "border-brand-bleu bg-blue-50" : ""}`}
                    />
                    {clientId && (
                      <button
                        type="button"
                        onClick={() => { setClientId(""); setClientSearch(""); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  {/* Dropdown */}
                  {showClientDropdown && clientSearch.length > 0 && (
                    <div className="absolute z-40 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg max-h-48 overflow-y-auto">
                      {clientsFiltres.length === 0 ? (
                        <p className="text-xs text-gray-400 px-3 py-3 text-center">Aucun client trouvé</p>
                      ) : (
                        clientsFiltres.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setClientId(c.id);
                              setClientSearch(c.nom);
                              setShowClientDropdown(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between gap-2 ${
                              c.id === clientId ? "bg-blue-50 text-brand-bleu font-medium" : "text-gray-800"
                            }`}
                          >
                            <span className="truncate">{c.nom}</span>
                            {c.telephone && (
                              <span className="text-xs text-gray-400 shrink-0">{c.telephone}</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  title="Nouveau client"
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-brand-bleu hover:bg-blue-800 text-white transition-colors"
                >
                  <UserPlus size={15} />
                </button>
              </div>

              {/* Confirmation client sélectionné */}
              {clientId && clientNomSelectionne && (
                <p className="text-xs text-brand-bleu mt-1 flex items-center gap-1">
                  <CheckCircle size={11} />
                  {clientNomSelectionne}
                </p>
              )}
            </div>

            {/* Statut de la facture */}
            <div>
              <label className="label text-xs">Statut de la facture</label>
              <div className="flex gap-1.5">
                {STATUTS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatut(s.value)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      statut === s.value
                        ? "border-current bg-gray-50 " + s.color
                        : "border-gray-200 text-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label text-xs">Notes (optionnel)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="input text-sm resize-none"
                placeholder="Remarques…"
              />
            </div>

            {error  && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
            {succes && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                <CheckCircle size={13} />
                {succes}
              </p>
            )}

            <div className="flex items-center justify-between py-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-700">Total TTC</span>
              <span className="text-lg font-bold text-brand-bleu">{formatFCFA(total)}</span>
            </div>

            <button
              onClick={valider}
              disabled={isPending || panier.length === 0 || !clientId}
              className="w-full flex items-center justify-center gap-2 bg-brand-orange hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors"
            >
              <CheckCircle size={16} />
              {isPending ? "Traitement…" : "Valider la vente"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
