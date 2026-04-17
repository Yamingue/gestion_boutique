"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href:     string;
  icon:     React.ReactNode;
  badge?:   number | null;
  children: React.ReactNode;
}

export default function NavLink({ href, icon, badge, children }: NavLinkProps) {
  const pathname = usePathname();
  const active   = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-white/15 text-white"
          : "text-white/60 hover:bg-white/10 hover:text-white/90"
      }`}
    >
      <span className={`shrink-0 ${active ? "text-brand-orange" : "text-white/50"}`}>
        {icon}
      </span>

      <span className="flex-1">{children}</span>

      {badge != null && badge > 0 && (
        <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shrink-0">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
