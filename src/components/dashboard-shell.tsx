"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Building2,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Clock,
  CreditCard,
  Download,
  FileText,
  FolderOpen,
  Globe,
  KeyRound,
  LayoutDashboard,
  ListChecks,
  LockKeyhole,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Receipt,
  Route,
  Settings,
  Shield,
  UserCog,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Role } from "@/lib/nuria-config";

export type NavigationRoute = {
  path: string;
  title: string;
};

type DashboardShellProps = {
  role: Role;
  title: string;
  routes: NavigationRoute[];
  children: React.ReactNode;
};

type NavigationGroup = {
  title: string;
  paths: string[];
};

const roleLabels: Record<Role, string> = {
  admin: "Admin",
  inhaber: "Inhaber",
  pdl: "Pflegedienstleitung",
  verwaltung: "Verwaltung",
  mitarbeiter: "Mitarbeiter",
};

const iconByPath = {
  "/dashboard": LayoutDashboard,
  "/dashboard/zahlung-tarif": CreditCard,
  "/dashboard/standorte": MapPin,
  "/dashboard/mitarbeiter": Users,
  "/dashboard/rollen-rechte": KeyRound,
  "/dashboard/klienten": UserRound,
  "/dashboard/dienstplanung": CalendarDays,
  "/dashboard/tourenplanung": Route,
  "/dashboard/zeiterfassung": Clock,
  "/dashboard/pflegedokumentation": FileText,
  "/dashboard/abrechnung": Receipt,
  "/dashboard/dokumente": FolderOpen,
  "/dashboard/qm-md": ClipboardCheck,
  "/dashboard/kommunikation": MessageCircle,
  "/dashboard/bewerber": UserPlus,
  "/dashboard/website-online-praesenz": Globe,
  "/dashboard/exporte": Download,
  "/dashboard/aktivitaeten": Activity,
  "/dashboard/compliance": Shield,
  "/dashboard/einstellungen": Settings,
  "/admin": LayoutDashboard,
  "/admin/pflegedienste": Building2,
  "/admin/registrierungen": ClipboardCheck,
  "/admin/zahlungen": CreditCard,
  "/admin/tarife": Receipt,
  "/admin/freischaltungen": KeyRound,
  "/admin/sperrungen": LockKeyhole,
  "/admin/nutzer": UserCog,
  "/admin/support": MessageCircle,
  "/admin/systemprotokolle": ListChecks,
  "/admin/compliance": Shield,
  "/admin/einstellungen": Settings,
  "/mitarbeiter/dashboard": LayoutDashboard,
  "/mitarbeiter/dienstplan": CalendarDays,
  "/mitarbeiter/tour": Route,
  "/mitarbeiter/patienten": UserRound,
  "/mitarbeiter/notizen": FileText,
  "/mitarbeiter/dokumente-hochladen": FolderOpen,
  "/mitarbeiter/zeiterfassung": Clock,
  "/mitarbeiter/kommunikation": MessageCircle,
  "/mitarbeiter/profil": UserCog,
  "/mitarbeiter/abwesenheiten": CalendarDays,
} satisfies Record<string, typeof LayoutDashboard>;

const companyGroups: NavigationGroup[] = [
  { title: "Übersicht", paths: ["/dashboard"] },
  {
    title: "Organisation",
    paths: ["/dashboard/standorte", "/dashboard/mitarbeiter", "/dashboard/rollen-rechte", "/dashboard/einstellungen"],
  },
  {
    title: "Pflegebetrieb",
    paths: [
      "/dashboard/klienten",
      "/dashboard/dienstplanung",
      "/dashboard/tourenplanung",
      "/dashboard/zeiterfassung",
      "/dashboard/pflegedokumentation",
    ],
  },
  {
    title: "Verwaltung",
    paths: [
      "/dashboard/abrechnung",
      "/dashboard/dokumente",
      "/dashboard/kommunikation",
      "/dashboard/bewerber",
      "/dashboard/website-online-praesenz",
    ],
  },
  {
    title: "Qualität & Sicherheit",
    paths: ["/dashboard/qm-md", "/dashboard/exporte", "/dashboard/aktivitaeten", "/dashboard/compliance"],
  },
  { title: "Zahlung", paths: ["/dashboard/zahlung-tarif"] },
];

const adminGroups: NavigationGroup[] = [
  { title: "Übersicht", paths: ["/admin"] },
  {
    title: "Organisation",
    paths: ["/admin/pflegedienste", "/admin/registrierungen", "/admin/nutzer", "/admin/einstellungen"],
  },
  {
    title: "Zahlung",
    paths: ["/admin/zahlungen", "/admin/tarife", "/admin/freischaltungen", "/admin/sperrungen"],
  },
  {
    title: "Qualität & Sicherheit",
    paths: ["/admin/systemprotokolle", "/admin/compliance", "/admin/support"],
  },
];

const staffGroups: NavigationGroup[] = [
  { title: "Übersicht", paths: ["/mitarbeiter/dashboard"] },
  {
    title: "Pflegebetrieb",
    paths: ["/mitarbeiter/dienstplan", "/mitarbeiter/tour", "/mitarbeiter/patienten", "/mitarbeiter/notizen"],
  },
  {
    title: "Organisation",
    paths: [
      "/mitarbeiter/dokumente-hochladen",
      "/mitarbeiter/zeiterfassung",
      "/mitarbeiter/kommunikation",
      "/mitarbeiter/profil",
      "/mitarbeiter/abwesenheiten",
    ],
  },
];

function groupsForRole(role: Role) {
  if (role === "admin") {
    return adminGroups;
  }

  if (role === "mitarbeiter") {
    return staffGroups;
  }

  return companyGroups;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(value);
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function DashboardShell({ role, title, routes, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const allowedPaths = useMemo(() => new Set(routes.map((route) => route.path)), [routes]);
  const visibleGroups = useMemo(
    () =>
      groupsForRole(role)
        .map((group) => ({
          ...group,
          routes: group.paths
            .filter((path) => allowedPaths.has(path))
            .map((path) => routes.find((route) => route.path === path))
            .filter((route): route is NavigationRoute => Boolean(route)),
        }))
        .filter((group) => group.routes.length > 0),
    [allowedPaths, role, routes],
  );
  const activeGroupTitles = useMemo(
    () =>
      visibleGroups
        .filter((group) => group.routes.some((route) => route.path === pathname))
        .map((group) => group.title),
    [pathname, visibleGroups],
  );
  const [expandedGroups, setExpandedGroups] = useState<string[]>(activeGroupTitles);

  useEffect(() => {
    setNow(new Date());
    const interval = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setExpandedGroups((current) => Array.from(new Set([...current, ...activeGroupTitles])));
  }, [activeGroupTitles]);

  function toggleGroup(groupTitle: string) {
    setExpandedGroups((current) =>
      current.includes(groupTitle) ? current.filter((title) => title !== groupTitle) : [...current, groupTitle],
    );
  }

  return (
    <div className="dashboard-shell">
      <AnimatePresence>
        {open ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="mobile-overlay open"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        ) : null}
      </AnimatePresence>

      <motion.aside className={`sidebar ${open ? "open" : ""}`} layout aria-label="Navigation">
        <div className="sidebar-header">
          <button className="drawer-close" onClick={() => setOpen(false)} aria-label="Navigation schließen">
            <X size={17} />
          </button>
          <div className="brand">Nuria Pflege</div>
        </div>

        <nav className="nav-scroll">
          {visibleGroups.map((group) => {
            const expanded = expandedGroups.includes(group.title);
            const groupActive = group.routes.some((route) => route.path === pathname);

            return (
              <div className="nav-group" key={group.title}>
                <button
                  className={`nav-group-button ${groupActive ? "active" : ""}`}
                  onClick={() => toggleGroup(group.title)}
                  type="button"
                >
                  <span>{group.title}</span>
                  <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.16 }}>
                    <ChevronDown size={15} />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {expanded ? (
                    <motion.div
                      animate={{ height: "auto", opacity: 1 }}
                      className="nav-group-items"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      {group.routes.map((route) => {
                        const active = pathname === route.path;
                        const Icon = iconByPath[route.path as keyof typeof iconByPath] ?? LayoutDashboard;

                        return (
                          <Link
                            className={`nav-link ${active ? "active" : ""}`}
                            href={route.path}
                            key={route.path}
                            onClick={() => setOpen(false)}
                          >
                            <Icon size={15} />
                            <span>{route.title}</span>
                            {active ? (
                              <motion.span className="active-pill" layoutId="active-nav-pill" transition={{ duration: 0.18 }} />
                            ) : null}
                          </Link>
                        );
                      })}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-role">{roleLabels[role]}</div>
          <div className="sidebar-date">
            <span>{now ? formatDate(now) : "\u00a0"}</span>
            <span>{now ? `${formatTime(now)} Uhr` : "\u00a0"}</span>
          </div>
          <div className="sidebar-divider" />
          <button className="logout-button" type="button">
            <LogOut size={16} />
            <span>Abmelden</span>
          </button>
        </div>
      </motion.aside>

      <main className="content">
        <header className="topbar">
          <button className="menu-button" onClick={() => setOpen(true)} aria-label="Navigation öffnen">
            <Menu size={19} />
          </button>
          <strong>{title}</strong>
          <span className="badge">{roleLabels[role]}</span>
        </header>
        {children}
      </main>
    </div>
  );
}
