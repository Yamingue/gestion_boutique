"use client";

export default function BoutonsPrint({ factureId }: { factureId: string }) {
  const btn: React.CSSProperties = {
    border: "none", borderRadius: 8, padding: "9px 18px", fontWeight: 600,
    cursor: "pointer", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6,
  };

  return (
    <div className="no-print toolbar">
      {/* PDF — mise en page A4 couleur */}
      <button onClick={() => window.print()} style={{ ...btn, background: "#0057A8", color: "#fff" }}>
        🖨 Imprimer / PDF
      </button>

      {/* Ticket thermique — nouvelle fenêtre dédiée 80mm */}
      <button
        onClick={() => window.open(`/backoffice/factures/${factureId}/thermique`, "_blank", "width=400,height=700")}
        style={{ ...btn, background: "#F47920", color: "#fff" }}
      >
        🧾 Ticket thermique
      </button>

      <button onClick={() => window.close()} style={{ ...btn, background: "#fff", color: "#374151", border: "1px solid #e5e7eb" }}>
        ✕ Fermer
      </button>
    </div>
  );
}
