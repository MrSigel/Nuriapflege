"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import type { DashboardRoute, Role } from "@/lib/nuria-config";

type DashboardShellProps = {
  role: Role;
  title: string;
  routes: DashboardRoute[];
  children: React.ReactNode;
};

const roleLabels: Record<Role, string> = {
  admin: "Interner Admin",
  inhaber: "Inhaber",
  pdl: "PDL",
  verwaltung: "Verwaltung",
  mitarbeiter: "Mitarbeiter / Pflegefachkraft",
};

export function DashboardShell({ role, title, routes, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="dashboard-shell">
      <div className={`mobile-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Navigation">
        <div className="sidebar-header">
          <button className="drawer-close" onClick={() => setOpen(false)} aria-label="Navigation schliessen">
            <X size={18} />
          </button>
          <div className="brand">Nuria Pflege</div>
          <div className="role-label">{roleLabels[role]}</div>
        </div>
        <nav className="nav-scroll">
          {routes.map((route) => {
            const Icon = route.icon;
            const active = pathname === route.path;
            return (
              <Link
                className={`nav-link ${active ? "active" : ""}`}
                href={route.path}
                key={route.path}
                onClick={() => setOpen(false)}
              >
                <Icon size={17} />
                <span>{route.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)} aria-label="Navigation oeffnen">
            <Menu size={19} />
          </button>
          <strong>{title}</strong>
          <span className="badge">{role}</span>
        </header>
        {children}
      </main>
    </div>
  );
}
