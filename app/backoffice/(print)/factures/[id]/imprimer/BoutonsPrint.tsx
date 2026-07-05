"use client";

export default function BoutonsPrint({ factureId }: { factureId: string }) {
  return (
    <div className="no-print" style={{ marginBottom: 24, display: "flex", gap: 10, flexWrap: "wrap" }}>
      {/* PDF — mise en page A4 couleur */}
      <button
        onClick={() => window.print()}
        style={{ background: "#0057A8", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
      >
        🖨 Imprimer / PDF
      </button>

      {/* Ticket thermique — nouvelle fenêtre dédiée 80mm */}
      <button
        onClick={() => window.open(`/backoffice/factures/${factureId}/thermique`, "_blank", "width=400,height=700")}
        style={{ background: "#F47920", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
      >
        🧾 Ticket thermique
      </button>

      <button
        onClick={() => window.close()}
        style={{ background: "#f3f4f6", color: "#374151", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
      >
        Fermer
      </button>
    </div>
  );
}
