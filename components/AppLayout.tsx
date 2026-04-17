"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

interface Props {
  sidebar: React.ReactNode;
  topbar:  React.ReactNode;
  children: React.ReactNode;
}

export default function AppLayout({ sidebar, topbar, children }: Props) {
  const [open, setOpen]  = useState(false);
  const pathname         = usePathname();

  // Fermer le drawer à chaque changement de page
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* ── Overlay mobile ──────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar drawer ──────────────────────────────────────────────── */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0 lg:shadow-none lg:flex lg:flex-col
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Bouton fermeture (mobile) */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 lg:hidden text-white/60 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>

        <div className="h-full">
          {sidebar}
        </div>
      </div>

      {/* ── Contenu principal ───────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* ── Topbar ──────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-white border-b border-gray-200 px-4 py-2.5 shadow-sm shrink-0">

          {/* Gauche : burger (mobile) + logo/brand (mobile) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </button>

            {/* Logo visible uniquement sur mobile (le sidebar est caché) */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 rounded-lg bg-brand-orange text-white text-xs font-bold flex items-center justify-center">
                T
              </div>
              <span className="font-bold text-gray-900 text-sm">Tching&apos;s Fils</span>
            </div>
          </div>

          {/* Droite : user info + logout */}
          <div className="flex items-center">
            {topbar}
          </div>
        </header>

        {/* ── Page ────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
