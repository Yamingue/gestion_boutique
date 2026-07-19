import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FacturePdf } from "@/lib/pdf/FacturePdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { id } = await params;

  const facture = await prisma.facture.findUnique({
    where:   { id },
    include: { client: true, vendeur: true, lignes: { include: { produit: true } } },
  });
  if (!facture) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });

  const buffer = await renderToBuffer(FacturePdf({ facture }));

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":        "application/pdf",
      "Content-Disposition": `inline; filename="${facture.numero}.pdf"`,
      "Cache-Control":       "no-store",
    },
  });
}
