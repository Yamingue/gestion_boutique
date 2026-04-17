"use client";

import { useState } from "react";
import GrafiqueVentes from "./GrafiqueVentes";
import Graphique7Jours from "./Graphique7Jours";
import GraphiqueParVendeur from "./GraphiqueParVendeur";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataMensuelle: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data7Jours: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dataParVendeur: any[];
  vendeursList: string[];
}

export default function DashboardChartsWrapper({
  dataMensuelle,
  data7Jours,
  dataParVendeur,
  vendeursList
}: Props) {
  const [activeTab, setActiveTab] = useState<"mensuel" | "7jours" | "vendeur">("7jours");

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <button
          onClick={() => setActiveTab("7jours")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === "7jours" ? "bg-blue-50 text-brand-bleu" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          7 Derniers Jours
        </button>
        <button
          onClick={() => setActiveTab("mensuel")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === "mensuel" ? "bg-blue-50 text-brand-bleu" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Par Mois
        </button>
        <button
          onClick={() => setActiveTab("vendeur")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeTab === "vendeur" ? "bg-blue-50 text-brand-bleu" : "text-gray-500 hover:bg-gray-50"
          }`}
        >
          Par Vendeur (Mois)
        </button>
      </div>

      <div className="flex-1 w-full relative min-h-[250px]">
        {activeTab === "mensuel" && <div className="absolute inset-0"><GrafiqueVentes data={dataMensuelle} /></div>}
        {activeTab === "7jours" && <div className="absolute inset-0"><Graphique7Jours data={data7Jours} /></div>}
        {activeTab === "vendeur" && <div className="absolute inset-0"><GraphiqueParVendeur data={dataParVendeur} vendeurs={vendeursList} /></div>}
      </div>
    </div>
  );
}
