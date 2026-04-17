import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatutFacture } from "@/generated/prisma/enums";
import ExcelJS from "exceljs";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  // Mêmes filtres que la page /factures
  const { searchParams } = req.nextUrl;
  const statut    = searchParams.get("statut")    ?? "";
  const q         = searchParams.get("q")         ?? "";
  const vendeurId = searchParams.get("vendeurId") ?? "";
  const dateDebut = searchParams.get("dateDebut") ?? "";
  const dateFin   = searchParams.get("dateFin")   ?? "";

  const AND: Prisma.FactureWhereInput[] = [];
  if (statut && statut in StatutFacture)
    AND.push({ statut: statut as StatutFacture });
  if (q.trim()) AND.push({
    OR: [
      { numero: { contains: q.trim() } },
      { client: { nom: { contains: q.trim() } } },
      { notes:  { contains: q.trim() } },
    ],
  });
  if (vendeurId) AND.push({ vendeurId });
  if (dateDebut || dateFin) AND.push({ createdAt: {
    gte: dateDebut ? new Date(dateDebut + "T00:00:00") : undefined,
    lte: dateFin   ? new Date(dateFin   + "T23:59:59") : undefined,
  }});

  const where: Prisma.FactureWhereInput = AND.length ? { AND } : {};

  const factures = await prisma.facture.findMany({
    where,
    include: { client: true, vendeur: true, lignes: { include: { produit: true } } },
    orderBy: { createdAt: "desc" },
  });

  // ── Workbook ──────────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  wb.creator = "Global Shop — Tching's Fils Multiservices";
  wb.created = new Date();

  // ── Couleurs marque ───────────────────────────────────────────────────────
  const BLEU   = "FF0057A8";
  const ORANGE = "FFF47920";
  const BLANC  = "FFFFFFFF";
  const GRIS1  = "FFF8FAFC";
  const GRIS2  = "FFE5E7EB";

  const statutLabel: Record<string, string> = {
    EN_ATTENTE: "En attente",
    PAYEE:      "Payée",
    ANNULEE:    "Annulée",
  };
  const statutFg: Record<string, string> = {
    EN_ATTENTE: "FFFFF9C4",
    PAYEE:      "FFD1FAE5",
    ANNULEE:    "FFF3F4F6",
  };

  // ── Feuille 1 : Récapitulatif ─────────────────────────────────────────────
  const ws1 = wb.addWorksheet("Factures", { views: [{ state: "frozen", ySplit: 3 }] });

  const COLS1 = [
    { key: "numero",   header: "N° Facture",   width: 22 },
    { key: "date",     header: "Date",         width: 14 },
    { key: "client",   header: "Client",       width: 28 },
    { key: "vendeur",  header: "Vendeur",      width: 22 },
    { key: "statut",   header: "Statut",       width: 14 },
    { key: "lignes",   header: "Nb lignes",    width: 11 },
    { key: "total",    header: "Total (FCFA)", width: 20 },
    { key: "notes",    header: "Notes",        width: 36 },
  ];
  ws1.columns = COLS1;

  // Titre
  ws1.mergeCells("A1:H1");
  Object.assign(ws1.getCell("A1"), {
    value: "Tching's Fils Multiservices — Export Factures",
    font:  { bold: true, size: 14, color: { argb: BLANC } },
    fill:  { type: "pattern", pattern: "solid", fgColor: { argb: BLEU } },
    alignment: { horizontal: "center", vertical: "middle" },
  });
  ws1.getRow(1).height = 30;

  // Sous-titre
  ws1.mergeCells("A2:H2");
  Object.assign(ws1.getCell("A2"), {
    value: `Exporté le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short" }).format(new Date())} — ${factures.length} facture(s)`,
    font:  { italic: true, size: 10, color: { argb: "FF666666" } },
    alignment: { horizontal: "center" },
  });
  ws1.getRow(2).height = 16;

  // En-têtes row 3
  const hr1 = ws1.getRow(3);
  COLS1.forEach((col, i) => {
    const c = hr1.getCell(i + 1);
    c.value = col.header;
    c.font  = { bold: true, color: { argb: BLANC } };
    c.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
    c.alignment = { horizontal: "center", vertical: "middle" };
  });
  hr1.height = 22;

  let totalGeneral = 0;

  factures.forEach((f, idx) => {
    const row = ws1.addRow({
      numero:  f.numero,
      date:    new Intl.DateTimeFormat("fr-FR").format(f.createdAt),
      client:  f.client.nom,
      vendeur: f.vendeur.nom,
      statut:  statutLabel[f.statut] ?? f.statut,
      lignes:  f.lignes.length,
      total:   f.totalTTC,
      notes:   f.notes ?? "",
    });
    totalGeneral += f.totalTTC;

    row.height = 20;
    row.eachCell((cell, col) => {
      if (col !== 5 && idx % 2 === 0)
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS1 } };
      cell.border = { bottom: { style: "hair", color: { argb: GRIS2 } } };
      cell.alignment = { vertical: "middle", wrapText: col === 8 };
    });

    // Cellule statut colorée
    const sc = row.getCell("statut");
    sc.fill = { type: "pattern", pattern: "solid", fgColor: { argb: statutFg[f.statut] ?? GRIS1 } };
    sc.font = { bold: true };
    sc.alignment = { horizontal: "center", vertical: "middle" };

    // Total formaté
    row.getCell("total").numFmt = '#,##0" FCFA"';
    row.getCell("total").alignment = { horizontal: "right", vertical: "middle" };
    row.getCell("lignes").alignment = { horizontal: "center", vertical: "middle" };
    row.getCell("date").alignment   = { horizontal: "center", vertical: "middle" };
  });

  // Ligne TOTAL
  const tr = ws1.addRow({ numero: "TOTAL", total: totalGeneral });
  tr.height = 22;
  tr.eachCell((c, col) => {
    c.font = { bold: true, color: { argb: BLEU } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0EDFF" } };
    c.border = { top: { style: "medium", color: { argb: BLEU } } };
    if (col === 7) {
      c.numFmt = '#,##0" FCFA"';
      c.alignment = { horizontal: "right" };
    }
  });

  // ── Feuille 2 : Détail lignes ─────────────────────────────────────────────
  const ws2 = wb.addWorksheet("Détail lignes", { views: [{ state: "frozen", ySplit: 1 }] });

  const COLS2 = [
    { key: "numero",    header: "N° Facture",       width: 22 },
    { key: "date",      header: "Date",             width: 14 },
    { key: "client",    header: "Client",           width: 26 },
    { key: "statut",    header: "Statut",           width: 14 },
    { key: "produit",   header: "Produit",          width: 30 },
    { key: "sku",       header: "SKU",              width: 16 },
    { key: "qte",       header: "Quantité",         width: 11 },
    { key: "prix",      header: "Prix unit. (FCFA)", width: 20 },
    { key: "soustotal", header: "Sous-total (FCFA)", width: 20 },
  ];
  ws2.columns = COLS2;

  const hr2 = ws2.getRow(1);
  COLS2.forEach((col, i) => {
    const c = hr2.getCell(i + 1);
    c.value = col.header;
    c.font  = { bold: true, color: { argb: BLANC } };
    c.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: BLEU } };
    c.alignment = { horizontal: "center", vertical: "middle" };
  });
  hr2.height = 22;

  let ligneIdx = 0;
  factures.forEach((f) => {
    f.lignes.forEach((l, li) => {
      const r = ws2.addRow({
        numero:    li === 0 ? f.numero : "",
        date:      li === 0 ? new Intl.DateTimeFormat("fr-FR").format(f.createdAt) : "",
        client:    li === 0 ? f.client.nom : "",
        statut:    li === 0 ? (statutLabel[f.statut] ?? f.statut) : "",
        produit:   l.produit.nom,
        sku:       l.produit.sku,
        qte:       l.quantite,
        prix:      l.prixUnitaire,
        soustotal: l.prixUnitaire * l.quantite,
      });
      r.height = 18;
      r.eachCell((cell, col) => {
        if (ligneIdx % 2 === 0)
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS1 } };
        cell.border = { bottom: { style: "hair", color: { argb: GRIS2 } } };
        cell.alignment = { vertical: "middle" };
        if (col === 7) cell.alignment = { horizontal: "center", vertical: "middle" };
        if (col === 8 || col === 9) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: "right", vertical: "middle" };
        }
      });
      ligneIdx++;
    });
  });

  // ── Feuille 3 : Résumé par vendeur ────────────────────────────────────────
  const ws3 = wb.addWorksheet("Par vendeur");

  const parVendeur = new Map<string, { nom: string; count: number; total: number }>();
  factures.forEach((f) => {
    const v = parVendeur.get(f.vendeurId) ?? { nom: f.vendeur.nom, count: 0, total: 0 };
    v.count++;
    v.total += f.totalTTC;
    parVendeur.set(f.vendeurId, v);
  });

  ws3.columns = [
    { key: "vendeur", header: "Vendeur",         width: 26 },
    { key: "count",   header: "Nb factures",     width: 16 },
    { key: "total",   header: "Total (FCFA)",    width: 22 },
  ];
  const hr3 = ws3.getRow(1);
  ["Vendeur", "Nb factures", "Total (FCFA)"].forEach((h, i) => {
    const c = hr3.getCell(i + 1);
    c.value = h;
    c.font  = { bold: true, color: { argb: BLANC } };
    c.fill  = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
    c.alignment = { horizontal: "center", vertical: "middle" };
  });
  hr3.height = 22;

  [...parVendeur.values()].sort((a, b) => b.total - a.total).forEach((v, i) => {
    const r = ws3.addRow({ vendeur: v.nom, count: v.count, total: v.total });
    r.getCell("total").numFmt = '#,##0" FCFA"';
    r.getCell("count").alignment = { horizontal: "center" };
    r.getCell("total").alignment = { horizontal: "right" };
    if (i % 2 === 0)
      r.eachCell((c) => { c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GRIS1 } }; });
    r.height = 18;
  });

  // ── Buffer → réponse ──────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const date   = new Intl.DateTimeFormat("fr-FR").format(new Date()).replace(/\//g, "-");

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="factures-${date}.xlsx"`,
    },
  });
}
