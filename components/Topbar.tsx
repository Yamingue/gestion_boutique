import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import LogoutButton from "./LogoutButton";

export default async function Topbar() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";
  const nom     = session?.user?.name ?? "Utilisateur";
  const email   = session?.user?.email ?? "";

  // Initiales pour l'avatar
  const initiales = nom
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-3">
      {/* Avatar + infos */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-brand-orange flex items-center justify-center text-white text-xs font-bold shrink-0 select-none">
          {initiales}
        </div>
        <div className="hidden sm:block leading-tight">
          <p className="text-sm font-semibold text-gray-900 truncate max-w-32">{nom}</p>
          <p className="text-xs text-gray-400 truncate max-w-32">{email}</p>
        </div>
      </div>

      {/* Badge rôle */}
      <span className={`hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        isAdmin
          ? "bg-brand-bleu/10 text-brand-bleu"
          : "bg-orange-100 text-brand-orange"
      }`}>
        {isAdmin ? "Admin" : "Vendeur"}
      </span>

      {/* Séparateur */}
      <div className="hidden sm:block w-px h-5 bg-gray-200" />

      {/* Déconnexion */}
      <LogoutButton />
    </div>
  );
}
