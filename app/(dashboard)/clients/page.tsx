import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import BoutonSupprimerClient from "@/components/BoutonSupprimerClient";
import { Plus } from "lucide-react";

export const metadata = { title: "Clients — Tching's Fils Multiservices" };

export default async function ClientsPage() {
  const [session, clients] = await Promise.all([
    getServerSession(authOptions),
    prisma.client.findMany({
      include: { _count: { select: { factures: true } } },
      orderBy: { nom: "asc" },
    }),
  ]);

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <>
      <Header
        title="Clients"
        subtitle={`${clients.length} client(s) enregistré(s)`}
        action={
          <Link
            href="/clients/nouveau"
            className="inline-flex items-center gap-1.5 bg-brand-orange hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={15} />
            Nouveau client
          </Link>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <th className="text-left px-5 py-3">Nom</th>
              <th className="text-left px-5 py-3">Téléphone</th>
              <th className="text-left px-5 py-3">Email</th>
              <th className="text-center px-5 py-3">Factures</th>
              {isAdmin && <th className="px-5 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="text-center text-gray-400 py-10">
                  Aucun client. Commencez par en ajouter un.
                </td>
              </tr>
            )}
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{c.nom}</td>
                <td className="px-5 py-3 text-gray-500">{c.telephone ?? "—"}</td>
                <td className="px-5 py-3 text-gray-500">{c.email ?? "—"}</td>
                <td className="px-5 py-3 text-center">
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {c._count.factures}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-5 py-3 text-right space-x-3">
                    <Link
                      href={`/clients/${c.id}/modifier`}
                      className="text-brand-bleu hover:underline text-xs font-medium"
                    >
                      Modifier
                    </Link>
                    <BoutonSupprimerClient id={c.id} nom={c.nom} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
