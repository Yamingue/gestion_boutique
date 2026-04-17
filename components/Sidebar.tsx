import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavLink from "./NavLink";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  FileText,
  Tag,
  ShieldCheck,
  AlertTriangle,
  Truck,
  RefreshCcw,
} from "lucide-react";

export default async function Sidebar() {
  const [session, nbAlertes] = await Promise.all([
    getServerSession(authOptions),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM Produit WHERE stockActuel <= seuilAlerte
    `.then((r) => Number(r[0]?.count ?? 0)).catch(() => 0),
  ]);

  const isAdmin = session?.user?.role === "ADMIN";

  const navItems = [
    { href: "/dashboard",  label: "Tableau de bord", icon: <LayoutDashboard size={17} /> },
    { href: "/vente",      label: "Point de vente",  icon: <ShoppingCart size={17} /> },
    { href: "/catalogue",  label: "Catalogue",        icon: <Package size={17} /> },
    {
      href: "/alertes",
      label: "Alertes stock",
      icon: <AlertTriangle size={17} />,
      badge: nbAlertes > 0 ? nbAlertes : null,
    },
    { href: "/clients",    label: "Clients",          icon: <Users size={17} /> },
    { href: "/factures",   label: "Factures",         icon: <FileText size={17} /> },
  ];

  const adminItems = [
    { href: "/reappro",       label: "Réapprovisionnement", icon: <RefreshCcw size={17} /> },
    { href: "/fournisseurs",  label: "Fournisseurs",        icon: <Truck size={17} /> },
    { href: "/categories",    label: "Catégories",          icon: <Tag size={17} /> },
    { href: "/utilisateurs",  label: "Utilisateurs",        icon: <ShieldCheck size={17} /> },
  ];

  return (
    <aside className="flex flex-col w-64 h-full bg-brand-bleu text-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 shrink-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-orange font-bold text-base shrink-0 shadow-sm">
          T
        </div>
        <div className="leading-tight min-w-0">
          <p className="font-bold text-sm truncate">Tching&apos;s Fils</p>
          <p className="text-[11px] text-white/45">Multiservices</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon} badge={item.badge}>
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="pt-5 pb-2 px-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                Administration
              </p>
            </div>
            {adminItems.map((item) => (
              <NavLink key={item.href} href={item.href} icon={item.icon}>
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Version */}
      <div className="px-5 py-3 border-t border-white/10 shrink-0">
        <p className="text-[10px] text-white/20">Global Shop v1.0</p>
      </div>
    </aside>
  );
}
