import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Header from "@/components/Header";
import { StatutFacture } from "@/generated/prisma/client";
import {
  Package,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  FileText,
  ArrowRight
} from "lucide-react";
import DashboardChartsWrapper from "@/components/charts/DashboardChartsWrapper";
import StatutBadge from "@/components/StatutBadge";
import Link from "next/link";

export const metadata = { title: "Tableau de bord — Tching's Fils Multiservices" };

async function getDashboardData() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    totalProduits,
    produitsEnAlerte,
    totalClients,
    facturesEnAttente,
    facturesPayees,
    chiffreAffairesAggr,
    recentesFactures,
    facturesMois,
    factures7J,
  ] = await Promise.all([
    prisma.produit.count(),
    prisma.produit.count({
      where: { stockActuel: { lte: prisma.produit.fields.seuilAlerte } },
    }).catch(() =>
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM Produit WHERE stockActuel <= seuilAlerte
      `.then((r) => Number(r[0]?.count ?? 0))
    ),
    prisma.client.count(),
    prisma.facture.count({ where: { statut: StatutFacture.EN_ATTENTE } }),
    prisma.facture.count({ where: { statut: StatutFacture.PAYEE } }),
    prisma.facture.aggregate({
      where: { statut: StatutFacture.PAYEE },
      _sum: { totalTTC: true },
    }).then((r) => r._sum.totalTTC ?? 0),
    prisma.facture.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { client: { select: { nom: true } } },
    }),
    prisma.facture.findMany({
      where: { statut: StatutFacture.PAYEE, createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, totalTTC: true, vendeur: { select: { nom: true } } },
    }),
    prisma.facture.findMany({
      where: { statut: StatutFacture.PAYEE, createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true, totalTTC: true },
    }),
  ]);

  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  
  // -- Données Mensuelles Globales --
  const ventesParMoisMap = new Map<string, { total: number; count: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    ventesParMoisMap.set(`${months[d.getMonth()]}`, { total: 0, count: 0 });
  }

  facturesMois.forEach((f) => {
    const m = `${months[f.createdAt.getMonth()]}`;
    if (ventesParMoisMap.has(m)) {
      const val = ventesParMoisMap.get(m)!;
      val.total += f.totalTTC;
      val.count += 1;
    }
  });

  const ventesGraphiques = Array.from(ventesParMoisMap.entries()).map(([mois, data]) => ({
    mois,
    total: data.total,
    count: data.count,
  }));

  // -- Données 7 Jours --
  const joursArray = [];
  const ventes7JoursMap = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
    joursArray.push(dayStr);
    ventes7JoursMap.set(dayStr, 0);
  }

  factures7J.forEach((f) => {
    const dayStr = f.createdAt.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
    if (ventes7JoursMap.has(dayStr)) {
      ventes7JoursMap.set(dayStr, ventes7JoursMap.get(dayStr)! + f.totalTTC);
    }
  });

  const ventes7JoursGraphiques = joursArray.map(jour => ({ jour, total: ventes7JoursMap.get(jour)! }));

  // -- Données Par Vendeur --
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dataParVendeurMap = new Map<string, any>();
  const vendeursSet = new Set<string>();

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = `${months[d.getMonth()]}`;
    dataParVendeurMap.set(m, { mois: m });
  }

  facturesMois.forEach((f) => {
    const m = `${months[f.createdAt.getMonth()]}`;
    const vendeurNom = f.vendeur?.nom || "Inconnu";
    vendeursSet.add(vendeurNom);

    if (dataParVendeurMap.has(m)) {
      const row = dataParVendeurMap.get(m)!;
      row[vendeurNom] = (row[vendeurNom] || 0) + f.totalTTC;
    }
  });

  const ventesParVendeurGraphiques = Array.from(dataParVendeurMap.values());
  const vendeursList = Array.from(vendeursSet);

  return {
    totalProduits,
    produitsEnAlerte: typeof produitsEnAlerte === "number" ? produitsEnAlerte : 0,
    totalClients,
    facturesEnAttente,
    facturesPayees,
    chiffreAffaires: chiffreAffairesAggr,
    recentesFactures,
    ventesGraphiques,
    ventes7JoursGraphiques,
    ventesParVendeurGraphiques,
    vendeursList
  };
}

type KpiVariant = "blue" | "orange" | "green" | "red";

function KpiCard({
  label,
  value,
  icon: Icon,
  variant = "blue",
  alert,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  variant?: KpiVariant;
  alert?: boolean;
}) {
  const iconColors: Record<KpiVariant, string> = {
    blue:   "text-brand-bleu bg-blue-50",
    orange: "text-brand-orange bg-orange-50",
    green:  "text-emerald-600 bg-emerald-50",
    red:    "text-red-500 bg-red-50",
  };
  const valueColors: Record<KpiVariant, string> = {
    blue:   "text-gray-900",
    orange: "text-gray-900",
    green:  "text-gray-900",
    red:    "text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <span className={`p-2 rounded-lg ${iconColors[variant]}`}>
          <Icon size={16} />
        </span>
      </div>
      <p className={`text-3xl font-bold ${valueColors[variant]}`}>{value}</p>
      {alert && (
        <p className="flex items-center gap-1 text-xs text-red-500 font-medium">
          <AlertTriangle size={11} />
          Vérifier le stock
        </p>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const data = await getDashboardData();

  const fcfa = (n: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <>
      <Header
        title={`Bonjour, ${session?.user?.name?.split(" ")[0] || "Vendeur"}`}
        subtitle="Voici l'état de votre activité aujourd'hui"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <KpiCard
          label="Produits en catalogue"
          value={data.totalProduits}
          icon={Package}
          variant="blue"
        />
        <KpiCard
          label="Produits en alerte stock"
          value={data.produitsEnAlerte}
          icon={AlertTriangle}
          variant={data.produitsEnAlerte > 0 ? "red" : "green"}
          alert={data.produitsEnAlerte > 0}
        />
        <KpiCard
          label="Clients enregistrés"
          value={data.totalClients}
          icon={Users}
          variant="blue"
        />
        <KpiCard
          label="Factures en attente"
          value={data.facturesEnAttente}
          icon={Clock}
          variant="orange"
        />
        <KpiCard
          label="Factures payées"
          value={data.facturesPayees}
          icon={CheckCircle}
          variant="green"
        />
        <KpiCard
          label="Chiffre d'affaires"
          value={fcfa(data.chiffreAffaires)}
          icon={TrendingUp}
          variant="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphiques (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Analyses des Revenus</h2>
            </div>
          </div>
          <div className="flex-1 min-h-[300px]">
             <DashboardChartsWrapper 
               dataMensuelle={data.ventesGraphiques}
               data7Jours={data.ventes7JoursGraphiques}
               dataParVendeur={data.ventesParVendeurGraphiques}
               vendeursList={data.vendeursList}
             />
          </div>
        </div>

        {/* Dernières factures (1/3) */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Ventes Récentes</h2>
            <Link
              href="/factures"
              className="text-sm font-medium text-brand-bleu hover:underline"
            >
              Voir tout
            </Link>
          </div>
          
          <div className="flex-1 flex flex-col gap-4">
            {data.recentesFactures.length > 0 ? (
              data.recentesFactures.map((facture) => (
                <Link
                  key={facture.id}
                  href={`/factures/${facture.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-50 hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-brand-bleu">
                      <FileText size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{facture.client?.nom || "Client inconnu"}</p>
                      <p className="text-xs text-gray-500">{facture.numero}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-bold text-sm text-gray-900">{fcfa(facture.totalTTC)}</p>
                    <StatutBadge statut={facture.statut} />
                  </div>
                </Link>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400 gap-2 border-2 border-dashed border-gray-100 rounded-lg p-6">
                <FileText size={24} />
                <p className="text-sm">Aucune vente récente</p>
              </div>
            )}
          </div>
          
          <Link
            href="/vente"
            className="mt-4 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors border border-gray-200"
          >
            Nouvelle vente
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </>
  );
}
