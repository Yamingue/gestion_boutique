import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/Header";
import Link from "next/link";
import { UserPlus, Edit2, Shield, ShieldAlert } from "lucide-react";
import BoutonSupprimerUtilisateur from "@/components/BoutonSupprimerUtilisateur";

export const metadata = { title: "Utilisateurs — Tching's Fils Multiservices" };

export default async function UtilisateursPage() {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { factures: true }
      }
    }
  });

  return (
    <>
      <div className="flex items-center justify-between">
        <Header 
          title="Gestions des Utilisateurs" 
          subtitle="Gérez les accès vendeurs et administrateurs" 
        />
        <Link
          href="/utilisateurs/nouveau"
          className="bg-brand-bleu hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 shadow-sm"
        >
          <UserPlus size={18} />
          Nouveau compte
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Nom & Email</th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Rôle</th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">Factures Créées</th>
                <th className="px-6 py-4 font-semibold uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{user.nom}</span>
                      <span className="text-gray-500 text-xs">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === "ADMIN" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                        <ShieldAlert size={14} /> ADMINISTRATEUR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                        <Shield size={14} /> VENDEUR
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded-lg text-xs font-medium">
                      {user._count.factures}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <Link
                      href={`/utilisateurs/${user.id}`}
                      className="inline-flex p-2 text-gray-400 hover:text-brand-bleu hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 size={18} />
                    </Link>
                    {session.user.email !== user.email && (
                      <BoutonSupprimerUtilisateur id={user.id} disabled={user._count.factures > 0} />
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
