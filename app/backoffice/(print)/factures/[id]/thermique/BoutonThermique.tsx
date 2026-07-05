"use client";

export default function BoutonThermique() {
  return (
    <div className="no-print" style={{ textAlign: "center", marginBottom: 12 }}>
      <button
        onClick={() => window.print()}
        style={{ background: "#111", color: "#fff", border: "none", borderRadius: 6, padding: "6px 16px", fontWeight: 600, cursor: "pointer", fontSize: 12 }}
      >
        🖨 Imprimer le ticket
      </button>
    </div>
  );
}
