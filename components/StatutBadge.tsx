import { StatutFacture } from "@/generated/prisma/client";

const config: Record<StatutFacture, { label: string; className: string }> = {
  EN_ATTENTE: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  PAYEE:      { label: "Payée",      className: "bg-emerald-100 text-emerald-700" },
  ANNULEE:    { label: "Annulée",    className: "bg-red-100 text-red-700" },
};

export default function StatutBadge({ statut }: { statut: StatutFacture }) {
  const { label, className } = config[statut];
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}
