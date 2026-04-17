import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BoutonThermique from "./BoutonThermique";

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(d);
}

function ligne(char = "-", len = 32) {
  return char.repeat(len);
}

export default async function ThermiqueFacturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const facture = await prisma.facture.findUnique({
    where: { id },
    include: { client: true, vendeur: true, lignes: { include: { produit: true } } },
  });

  if (!facture) notFound();

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          color: #000;
          background: #fff;
          width: 80mm;
          max-width: 80mm;
          margin: 0 auto;
          padding: 6mm 4mm;
        }

        .center  { text-align: center; }
        .right   { text-align: right; }
        .bold    { font-weight: bold; }
        .sep     { letter-spacing: 1px; margin: 4px 0; font-size: 11px; }

        .logo    { font-size: 15px; font-weight: bold; text-align: center; letter-spacing: 1px; }
        .sub     { font-size: 10px; text-align: center; color: #333; margin-bottom: 4px; }

        .num     { font-size: 13px; font-weight: bold; text-align: center; margin: 6px 0 2px; }
        .meta    { font-size: 10px; text-align: center; color: #444; margin-bottom: 2px; }

        .section-title { font-weight: bold; font-size: 11px; margin: 4px 0 2px; text-transform: uppercase; }
        .info    { font-size: 11px; margin: 1px 0; }

        table    { width: 100%; border-collapse: collapse; font-size: 11px; margin: 4px 0; }
        th       { font-weight: bold; text-align: left; border-bottom: 1px dashed #000; padding: 2px 0; }
        th.right { text-align: right; }
        td       { padding: 2px 0; vertical-align: top; }
        td.right { text-align: right; white-space: nowrap; }
        td.nom   { max-width: 44mm; word-break: break-word; }

        .total-label { font-weight: bold; font-size: 12px; }
        .total-value { font-weight: bold; font-size: 14px; text-align: right; }

        .statut  { text-align: center; font-weight: bold; font-size: 11px;
                   border: 1px solid #000; padding: 3px; margin: 6px 0; }

        .footer  { text-align: center; font-size: 10px; color: #444; margin-top: 8px; }

        .no-print { margin-bottom: 8px; }

        @media print {
          body { padding: 0; }
          .no-print { display: none; }
          @page {
            margin: 0;
            size: 80mm auto;
          }
        }
      `}</style>

      <BoutonThermique />

      {/* En-tête boutique */}
      <div className="logo">TCHING&apos;S FILS</div>
      <div className="sub">Multiservices</div>
      <div className="sub">Matériel &amp; Solutions réseau</div>

      <div className="sep center">{ligne("=")}</div>

      {/* Numéro & date */}
      <div className="num">{facture.numero}</div>
      <div className="meta">{formatDate(facture.createdAt)}</div>
      <div className="meta">Vendeur : {facture.vendeur.nom}</div>

      <div className="sep">{ligne("-")}</div>

      {/* Client */}
      <div className="section-title">Client</div>
      <div className="info bold">{facture.client.nom}</div>
      {facture.client.telephone && <div className="info">{facture.client.telephone}</div>}

      <div className="sep">{ligne("-")}</div>

      {/* Articles */}
      <table>
        <thead>
          <tr>
            <th>Article</th>
            <th className="right">Qté</th>
            <th className="right">Montant</th>
          </tr>
        </thead>
        <tbody>
          {facture.lignes.map((l) => (
            <tr key={l.id}>
              <td className="nom">
                {l.produit.nom}
                <br />
                <span style={{ fontSize: 10, color: "#555" }}>
                  {formatFCFA(l.prixUnitaire)} / u
                </span>
              </td>
              <td className="right">{l.quantite}</td>
              <td className="right">{formatFCFA(l.prixUnitaire * l.quantite)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sep">{ligne("=")}</div>

      {/* Total */}
      <table>
        <tbody>
          <tr>
            <td className="total-label">TOTAL TTC</td>
            <td className="total-value">{formatFCFA(facture.totalTTC)}</td>
          </tr>
        </tbody>
      </table>

      <div className="sep">{ligne("=")}</div>

      {/* Statut */}
      <div className="statut">
        {facture.statut === "PAYEE"      && "✓ PAYÉE"}
        {facture.statut === "EN_ATTENTE" && "⏳ EN ATTENTE DE PAIEMENT"}
        {facture.statut === "ANNULEE"    && "✗ ANNULÉE"}
      </div>

      {/* Notes */}
      {facture.notes && (
        <>
          <div className="sep">{ligne("-")}</div>
          <div className="info" style={{ fontSize: 10, fontStyle: "italic" }}>
            {facture.notes}
          </div>
        </>
      )}

      {/* Pied */}
      <div className="sep">{ligne("-")}</div>
      <div className="footer">Merci de votre confiance !</div>
      <div className="footer" style={{ marginTop: 4 }}>
        *** Conservez ce ticket ***
      </div>
    </>
  );
}
