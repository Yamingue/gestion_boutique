import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BoutonsPrint from "./BoutonsPrint";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facture = await prisma.facture.findUnique({ where: { id }, select: { numero: true } });
  return { title: facture?.numero ?? "Facture" };
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d);
}

const statutLabel: Record<string, string> = {
  EN_ATTENTE: "En attente de paiement",
  PAYEE:      "Payée",
  ANNULEE:    "Annulée",
};

export default async function ImprimerFacturePage({
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
        body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; background: #eef1f5; padding: 0; }
        .toolbar { position: sticky; top: 0; z-index: 10; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; background: #fff; border-bottom: 1px solid #e5e7eb; padding: 12px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
        .sheet { background: #fff; max-width: 820px; margin: 28px auto; padding: 48px; border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,0.10); }
        .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .logo-box { display: flex; align-items: center; gap: 12px; }
        .logo-circle { width: 48px; height: 48px; border-radius: 50%; background: #F47920; color: #fff; font-weight: 700; font-size: 22px; display: flex; align-items: center; justify-content: center; }
        .company-name { font-size: 16px; font-weight: 700; color: #0057A8; }
        .company-sub { font-size: 11px; color: #888; }
        .facture-meta { text-align: right; }
        .facture-num { font-size: 20px; font-weight: 700; color: #0057A8; }
        .facture-date { color: #666; font-size: 12px; margin-top: 4px; }
        .statut { display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
        .statut-EN_ATTENTE { background: #fef9c3; color: #854d0e; }
        .statut-PAYEE      { background: #d1fae5; color: #065f46; }
        .statut-ANNULEE    { background: #fee2e2; color: #991b1b; }
        .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
        .partie-box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
        .partie-title { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.08em; margin-bottom: 8px; }
        .partie-nom { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
        .partie-detail { color: #6b7280; font-size: 12px; line-height: 1.5; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #0057A8; color: #fff; padding: 9px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
        th:first-child { text-align: left; }
        th:not(:first-child) { text-align: right; }
        td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; font-size: 13px; }
        td:not(:first-child) { text-align: right; }
        tr:nth-child(even) td { background: #f9fafb; }
        .total-row td { border-top: 2px solid #0057A8; font-weight: 700; padding-top: 14px; }
        .total-amount { font-size: 18px; color: #0057A8; }
        .notes { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin-bottom: 32px; }
        .notes-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 6px; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 16px; }
        @media print {
          .no-print { display: none; }
          body { background: #fff; }
          .sheet { max-width: none; margin: 0; padding: 0; border-radius: 0; box-shadow: none; }
          @page { margin: 1cm; }
        }
      `}</style>

      <BoutonsPrint factureId={facture.id} />

      <div className="sheet">
      {/* En-tête */}
      <div className="header">
        <div className="logo-box">
          <div className="logo-circle">T</div>
          <div>
            <div className="company-name">Tching&apos;s Fils Multiservices</div>
            <div className="company-sub">Vente de matériel &amp; solutions réseau</div>
          </div>
        </div>
        <div className="facture-meta">
          <div className="facture-num">{facture.numero}</div>
          <div className="facture-date">Émise le {formatDate(facture.createdAt)}</div>
          <span className={`statut statut-${facture.statut}`}>
            {statutLabel[facture.statut]}
          </span>
        </div>
      </div>

      {/* Client / Vendeur */}
      <div className="parties">
        <div className="partie-box">
          <div className="partie-title">Client</div>
          <div className="partie-nom">{facture.client.nom}</div>
          <div className="partie-detail">
            {facture.client.telephone && <div>{facture.client.telephone}</div>}
            {facture.client.email     && <div>{facture.client.email}</div>}
            {facture.client.adresse   && <div>{facture.client.adresse}</div>}
          </div>
        </div>
        <div className="partie-box">
          <div className="partie-title">Vendeur</div>
          <div className="partie-nom">{facture.vendeur.nom}</div>
          <div className="partie-detail">{facture.vendeur.email}</div>
        </div>
      </div>

      {/* Lignes */}
      <table>
        <thead>
          <tr>
            <th>Désignation</th>
            <th>Prix unitaire</th>
            <th>Quantité</th>
            <th>Sous-total</th>
          </tr>
        </thead>
        <tbody>
          {facture.lignes.map((l) => (
            <tr key={l.id}>
              <td>{l.produit.nom}</td>
              <td>{formatFCFA(l.prixUnitaire)}</td>
              <td>{l.quantite}</td>
              <td>{formatFCFA(l.prixUnitaire * l.quantite)}</td>
            </tr>
          ))}
          <tr className="total-row">
            <td colSpan={3} style={{ textAlign: "right" }}>Total TTC</td>
            <td className="total-amount">{formatFCFA(facture.totalTTC)}</td>
          </tr>
        </tbody>
      </table>

      {/* Notes */}
      {facture.notes && (
        <div className="notes">
          <div className="notes-title">Notes</div>
          <div style={{ whiteSpace: "pre-line", color: "#374151" }}>{facture.notes}</div>
        </div>
      )}

      <div className="footer">
        Tching&apos;s Fils Multiservices — Merci de votre confiance
      </div>
      </div>
    </>
  );
}
