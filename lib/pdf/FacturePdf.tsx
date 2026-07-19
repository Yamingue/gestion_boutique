import React from "react";
import { Document, Page, View, Text, StyleSheet, type DocumentProps } from "@react-pdf/renderer";
import type { Facture, Client, User, LigneFacture, Produit } from "@/generated/prisma/client";

type FactureComplete = Facture & {
  client:  Client;
  vendeur: User;
  lignes:  (LigneFacture & { produit: Produit })[];
};

const BLEU   = "#0057A8";
const ORANGE = "#F47920";
const GRIS   = "#6b7280";
const GRIS_L = "#9ca3af";
const BORDER = "#e5e7eb";

const statutLabel: Record<string, string> = {
  EN_ATTENTE: "En attente de paiement",
  PAYEE:      "Payée",
  ANNULEE:    "Annulée",
};
const statutColor: Record<string, { bg: string; fg: string }> = {
  EN_ATTENTE: { bg: "#fef9c3", fg: "#854d0e" },
  PAYEE:      { bg: "#d1fae5", fg: "#065f46" },
  ANNULEE:    { bg: "#fee2e2", fg: "#991b1b" },
};

function formatFCFA(n: number) {
  // Intl insère une espace insécable fine (U+202F) que la police PDF ne rend pas → espace normale
  return new Intl.NumberFormat("fr-FR").format(n).replace(/\s/g, " ") + " FCFA";
}
function formatDate(d: Date) {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(d);
}

const s = StyleSheet.create({
  page: { paddingVertical: 40, paddingHorizontal: 44, fontSize: 10, color: "#111", fontFamily: "Helvetica" },

  header:      { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 },
  logoBox:     { flexDirection: "row", alignItems: "center" },
  logoCircle:  { width: 40, height: 40, borderRadius: 20, backgroundColor: ORANGE, color: "#fff", fontSize: 18, fontFamily: "Helvetica-Bold", alignItems: "center", justifyContent: "center", textAlign: "center", marginRight: 10, paddingTop: 9 },
  companyName: { fontSize: 13, fontFamily: "Helvetica-Bold", color: BLEU },
  companySub:  { fontSize: 8, color: GRIS_L, marginTop: 2 },
  metaRight:   { alignItems: "flex-end" },
  factureNum:  { fontSize: 17, fontFamily: "Helvetica-Bold", color: BLEU },
  factureDate: { fontSize: 9, color: GRIS, marginTop: 3 },
  statut:      { marginTop: 6, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 10, fontSize: 8, fontFamily: "Helvetica-Bold" },

  parties:     { flexDirection: "row", gap: 18, marginBottom: 26 },
  partieBox:   { flex: 1, borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 12 },
  partieTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GRIS_L, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  partieNom:   { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  partieDetail:{ fontSize: 9, color: GRIS, lineHeight: 1.5 },

  th:      { flexDirection: "row", backgroundColor: BLEU, color: "#fff", paddingVertical: 7, paddingHorizontal: 10 },
  thText:  { fontSize: 8, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  tr:      { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  trAlt:   { backgroundColor: "#f9fafb" },
  cDesign: { flex: 4, textAlign: "left" },
  cNum:    { flex: 2, textAlign: "right" },

  totalRow:    { flexDirection: "row", paddingVertical: 12, paddingHorizontal: 10, borderTopWidth: 2, borderTopColor: BLEU },
  totalLabel:  { flex: 6, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 11 },
  totalAmount: { flex: 2, textAlign: "right", fontFamily: "Helvetica-Bold", fontSize: 13, color: BLEU },

  notes:      { marginTop: 24, borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 12 },
  notesTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GRIS_L, textTransform: "uppercase", marginBottom: 5 },
  notesText:  { fontSize: 9, color: "#374151" },

  footer: { position: "absolute", bottom: 28, left: 44, right: 44, textAlign: "center", fontSize: 8, color: GRIS_L, borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 12 },
});

export function FacturePdf({ facture }: { facture: FactureComplete }): React.ReactElement<DocumentProps> {
  const st = statutColor[facture.statut] ?? { bg: "#f3f4f6", fg: "#374151" };

  return (
    <Document title={facture.numero} author="Tching's Fils Multiservices">
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.header}>
          <View style={s.logoBox}>
            <Text style={s.logoCircle}>T</Text>
            <View>
              <Text style={s.companyName}>Tching&apos;s Fils Multiservices</Text>
              <Text style={s.companySub}>Vente de matériel & solutions réseau</Text>
            </View>
          </View>
          <View style={s.metaRight}>
            <Text style={s.factureNum}>{facture.numero}</Text>
            <Text style={s.factureDate}>Émise le {formatDate(facture.createdAt)}</Text>
            <Text style={[s.statut, { backgroundColor: st.bg, color: st.fg }]}>
              {statutLabel[facture.statut] ?? facture.statut}
            </Text>
          </View>
        </View>

        {/* Client / Vendeur */}
        <View style={s.parties}>
          <View style={s.partieBox}>
            <Text style={s.partieTitle}>Client</Text>
            <Text style={s.partieNom}>{facture.client.nom}</Text>
            <View style={s.partieDetail}>
              {facture.client.telephone ? <Text>{facture.client.telephone}</Text> : null}
              {facture.client.email     ? <Text>{facture.client.email}</Text> : null}
              {facture.client.adresse   ? <Text>{facture.client.adresse}</Text> : null}
            </View>
          </View>
          <View style={s.partieBox}>
            <Text style={s.partieTitle}>Vendeur</Text>
            <Text style={s.partieNom}>{facture.vendeur.nom}</Text>
            <Text style={s.partieDetail}>{facture.vendeur.email}</Text>
          </View>
        </View>

        {/* Lignes */}
        <View style={s.th}>
          <Text style={[s.thText, s.cDesign]}>Désignation</Text>
          <Text style={[s.thText, s.cNum]}>Prix unitaire</Text>
          <Text style={[s.thText, s.cNum]}>Quantité</Text>
          <Text style={[s.thText, s.cNum]}>Sous-total</Text>
        </View>
        {facture.lignes.map((l, i) => (
          <View key={l.id} style={i % 2 === 1 ? [s.tr, s.trAlt] : s.tr}>
            <Text style={s.cDesign}>{l.produit.nom}</Text>
            <Text style={s.cNum}>{formatFCFA(l.prixUnitaire)}</Text>
            <Text style={s.cNum}>{l.quantite}</Text>
            <Text style={s.cNum}>{formatFCFA(l.prixUnitaire * l.quantite)}</Text>
          </View>
        ))}
        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total TTC</Text>
          <Text style={s.totalAmount}>{formatFCFA(facture.totalTTC)}</Text>
        </View>

        {/* Notes */}
        {facture.notes ? (
          <View style={s.notes}>
            <Text style={s.notesTitle}>Notes</Text>
            <Text style={s.notesText}>{facture.notes}</Text>
          </View>
        ) : null}

        <Text style={s.footer} fixed>
          Tching&apos;s Fils Multiservices — Merci de votre confiance
        </Text>
      </Page>
    </Document>
  );
}
