"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  BadgeEuro,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  MessageSquareReply,
  Package,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  confirmCompanyPayment,
  createSupportReply,
  lockCompanyAccount,
  markCompanyPaymentOpen,
  rejectCompanyPayment,
  unlockCompanyAccount,
  updateSupportStatus,
} from "@/lib/nuria-admin-actions";
import { logoutNuriaAdmin } from "@/lib/nuria-admin-login-actions";
import { nuriaAdminRoutes, nuriaPlans, type AdminCompany, type AdminLog, type AdminUser, type NuriaAdminData, type NuriaAdminSection, type SupportRequest } from "@/lib/nuria-admin-shared";

type Props = {
  data: NuriaAdminData;
  section: NuriaAdminSection;
};

const icons = {
  overview: LayoutDashboard,
  companies: Building2,
  registrations: ClipboardCheck,
  payments: CreditCard,
  plans: Package,
  users: UserCog,
  support: LifeBuoy,
  logs: Activity,
  settings: Settings,
};

const titles: Record<NuriaAdminSection, string> = {
  overview: "Nuria Admin Übersicht",
  companies: "Pflegedienste",
  registrations: "Registrierungen",
  payments: "Zahlungen",
  plans: "Tarife",
  users: "Nutzer",
  support: "Support",
  logs: "Systemlogs",
  settings: "Einstellungen",
};

function formatDate(value: string | null) {
  if (!value) return "Nicht gesetzt";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatEuro(value: number | null) {
  if (value === null) return "Nicht gesetzt";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value);
}

function fullName(user: Pick<AdminUser, "first_name" | "last_name" | "email">) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || "Nicht hinterlegt";
}

function StatusBadge({ value }: { value: string | null }) {
  return <span className={`nuria-admin-status ${(value ?? "unknown").replaceAll("_", "-")}`}>{value ?? "Nicht gesetzt"}</span>;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="nuria-admin-modal-backdrop" role="presentation" onClick={onClose}>
      <motion.div
        className="nuria-admin-modal"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="nuria-admin-modal-head">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Schließen">
            <XCircle size={18} />
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function ConfirmAction({ label, action, companyId, tone = "neutral" }: { label: string; action: (formData: FormData) => void; companyId: string; tone?: "neutral" | "danger" | "success" }) {
  return (
    <form action={action}>
      <input type="hidden" name="company_id" value={companyId} />
      <button className={`nuria-admin-action ${tone}`} type="submit" onClick={(event) => !window.confirm(`${label}?`) && event.preventDefault()}>
        {label}
      </button>
    </form>
  );
}

function CompanyDetail({ company }: { company: AdminCompany }) {
  return (
    <div className="nuria-admin-detail-grid">
      <span>Name</span><strong>{company.name}</strong>
      <span>Inhaber</span><strong>{company.owner_name}</strong>
      <span>Geschäfts-E-Mail</span><strong>{company.billing_email ?? company.email ?? company.owner_email ?? "Nicht hinterlegt"}</strong>
      <span>Status</span><StatusBadge value={company.status} />
      <span>Zahlungsstatus</span><StatusBadge value={company.payment_status} />
      <span>Subscription</span><StatusBadge value={company.subscription_status} />
      <span>Onboarding</span><StatusBadge value={company.onboarding_status} />
      <span>Tarif</span><strong>{company.subscription_package ?? company.package_id ?? "Nicht gesetzt"}</strong>
      <span>Erstellt</span><strong>{formatDate(company.created_at)}</strong>
    </div>
  );
}

function CompanyActions({ company }: { company: AdminCompany }) {
  return (
    <div className="nuria-admin-actions">
      <ConfirmAction label="Zahlung bestätigen" action={confirmCompanyPayment} companyId={company.id} tone="success" />
      <ConfirmAction label="Zahlung ablehnen" action={rejectCompanyPayment} companyId={company.id} tone="danger" />
      <ConfirmAction label="Als offen markieren" action={markCompanyPaymentOpen} companyId={company.id} />
      <ConfirmAction label="Sperren" action={lockCompanyAccount} companyId={company.id} tone="danger" />
      <ConfirmAction label="Entsperren" action={unlockCompanyAccount} companyId={company.id} tone="success" />
    </div>
  );
}

function StatCards({ data }: { data: NuriaAdminData }) {
  const stats = [
    ["Gesamte Pflegedienste", data.stats.totalCompanies, Building2],
    ["Neue Registrierungen", data.stats.newRegistrations, ClipboardCheck],
    ["Aktive Pflegedienste", data.stats.activeCompanies, CheckCircle2],
    ["Offene Zahlungen", data.stats.openPayments, BadgeEuro],
    ["Wartet auf Prüfung", data.stats.markedPayments, CreditCard],
    ["Gesperrte Konten", data.stats.lockedAccounts, Lock],
    ["Neue Supportanfragen", data.stats.newSupport, LifeBuoy],
    ["Systemereignisse", data.stats.systemEvents, Activity],
  ] as const;

  return (
    <div className="nuria-admin-stats">
      {stats.map(([label, value, Icon]) => (
        <motion.div className="nuria-admin-stat" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Icon size={18} />
          <span>{label}</span>
          <strong>{value}</strong>
        </motion.div>
      ))}
    </div>
  );
}

function CompanyTable({ companies, mode }: { companies: AdminCompany[]; mode: "companies" | "registrations" | "payments" }) {
  const [selected, setSelected] = useState<AdminCompany | null>(null);
  const rows = mode === "registrations" ? companies.filter((company) => company.onboarding_status !== "completed" || company.payment_status !== "active") : companies;

  return (
    <>
      <div className="nuria-admin-table-wrap">
        <table className="nuria-admin-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Inhaber</th>
              <th>Tarif</th>
              <th>Zahlung</th>
              <th>Subscription</th>
              <th>Onboarding</th>
              <th>Aktion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((company) => (
              <tr key={company.id}>
                <td>{company.name}<small>{company.billing_email ?? company.email}</small></td>
                <td>{company.owner_name}<small>{company.owner_email}</small></td>
                <td>{company.subscription_package ?? company.package_id ?? "Nicht gesetzt"}<small>{formatEuro(company.subscription_total)}</small></td>
                <td><StatusBadge value={company.payment_status} /></td>
                <td><StatusBadge value={company.subscription_status} /></td>
                <td><StatusBadge value={company.onboarding_status} /></td>
                <td><button className="nuria-admin-link-button" type="button" onClick={() => setSelected(company)}>Ansehen</button></td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={7}>Keine Einträge vorhanden.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {selected ? (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <CompanyDetail company={selected} />
          <CompanyActions company={selected} />
        </Modal>
      ) : null}
    </>
  );
}

function UsersTable({ users }: { users: AdminUser[] }) {
  const [selected, setSelected] = useState<AdminUser | null>(null);
  return (
    <>
      <div className="nuria-admin-table-wrap">
        <table className="nuria-admin-table">
          <thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th>Company</th><th>Status</th><th>Erstellt</th><th>Aktion</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{fullName(user)}</td>
                <td>{user.email ?? "Nicht hinterlegt"}</td>
                <td>{user.role}</td>
                <td>{user.company_name ?? "Intern"}</td>
                <td><StatusBadge value={user.status} /></td>
                <td>{formatDate(user.created_at)}</td>
                <td><button className="nuria-admin-link-button" type="button" onClick={() => setSelected(user)}>Ansehen</button></td>
              </tr>
            ))}
            {!users.length ? <tr><td colSpan={7}>Keine Nutzer vorhanden.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {selected ? (
        <Modal title={fullName(selected)} onClose={() => setSelected(null)}>
          <div className="nuria-admin-detail-grid">
            <span>E-Mail</span><strong>{selected.email ?? "Nicht hinterlegt"}</strong>
            <span>Rolle</span><strong>{selected.role}</strong>
            <span>Company</span><strong>{selected.company_name ?? "Intern"}</strong>
            <span>Status</span><StatusBadge value={selected.status} />
            <span>Erstellt</span><strong>{formatDate(selected.created_at)}</strong>
          </div>
        </Modal>
      ) : null}
    </>
  );
}

function SupportTable({ requests }: { requests: SupportRequest[] }) {
  const [selected, setSelected] = useState<SupportRequest | null>(null);
  return (
    <>
      <div className="nuria-admin-table-wrap">
        <table className="nuria-admin-table">
          <thead><tr><th>Betreff</th><th>Name</th><th>E-Mail</th><th>Company</th><th>Status</th><th>Erstellt</th><th>Aktion</th></tr></thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{request.subject}</td>
                <td>{request.name ?? "Nicht hinterlegt"}</td>
                <td>{request.email ?? "Nicht hinterlegt"}</td>
                <td>{request.company_name ?? "Ohne Bezug"}</td>
                <td><StatusBadge value={request.status} /></td>
                <td>{formatDate(request.created_at)}</td>
                <td><button className="nuria-admin-link-button" type="button" onClick={() => setSelected(request)}>Ansehen</button></td>
              </tr>
            ))}
            {!requests.length ? <tr><td colSpan={7}>Keine Supportanfragen vorhanden.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {selected ? (
        <Modal title={selected.subject} onClose={() => setSelected(null)}>
          <p className="nuria-admin-message">{selected.message}</p>
          <form className="nuria-admin-form-row" action={updateSupportStatus}>
            <input type="hidden" name="request_id" value={selected.id} />
            <select name="status" defaultValue={selected.status}>
              <option value="open">offen</option>
              <option value="in_progress">in Bearbeitung</option>
              <option value="done">erledigt</option>
            </select>
            <button className="nuria-admin-action" type="submit">Status speichern</button>
          </form>
          <div className="nuria-admin-replies">
            {selected.replies.map((reply) => <p key={reply.id}><span>{formatDate(reply.created_at)}</span>{reply.body}</p>)}
          </div>
          <form className="nuria-admin-reply-form" action={createSupportReply}>
            <input type="hidden" name="request_id" value={selected.id} />
            <textarea name="body" placeholder="Interne Antwort schreiben" required />
            <button className="nuria-admin-action success" type="submit"><MessageSquareReply size={16} />Antwort speichern</button>
            <button className="nuria-admin-action" type="button" disabled>Antwort per E-Mail senden - Wird vorbereitet</button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

function LogsTable({ logs }: { logs: AdminLog[] }) {
  return (
    <div className="nuria-admin-table-wrap">
      <table className="nuria-admin-table">
        <thead><tr><th>Zeit</th><th>Aktion</th><th>Ziel</th><th>Company</th><th>Metadata</th></tr></thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDate(log.created_at)}</td>
              <td>{log.action}</td>
              <td>{log.target_type}</td>
              <td>{log.company_name ?? "Ohne Bezug"}</td>
              <td>{JSON.stringify(log.metadata)}</td>
            </tr>
          ))}
          {!logs.length ? <tr><td colSpan={5}>Keine Systemlogs vorhanden.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

function PlansTable({ companies }: { companies: AdminCompany[] }) {
  return (
    <div className="nuria-admin-plan-grid">
      {nuriaPlans.map((plan) => (
        <div className="nuria-admin-plan" key={plan.packageId}>
          <Package size={18} />
          <h3>{plan.packageId}</h3>
          <p>{plan.interval}</p>
          <strong>{formatEuro(plan.amount)}</strong>
          <span>{companies.filter((company) => company.subscription_package === plan.packageId || company.package_id === plan.packageId).length} gebuchte Kunden</span>
        </div>
      ))}
    </div>
  );
}

export function NuriaAdminDashboard({ data, section }: Props) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.toLowerCase().trim();
    if (!term) return data;

    return {
      ...data,
      companies: data.companies.filter((company) => [company.name, company.email, company.billing_email, company.owner_name, company.owner_email].some((value) => value?.toLowerCase().includes(term))),
      users: data.users.filter((user) => [fullName(user), user.email, user.company_name, user.role].some((value) => value?.toLowerCase().includes(term))),
      supportRequests: data.supportRequests.filter((request) => [request.subject, request.name, request.email, request.company_name].some((value) => value?.toLowerCase().includes(term))),
      logs: data.logs.filter((log) => [log.action, log.target_type, log.company_name].some((value) => value?.toLowerCase().includes(term))),
    };
  }, [data, query]);

  return (
    <div className="nuria-admin-shell">
      <aside className="nuria-admin-sidebar">
        <div className="nuria-admin-brand">
          <ShieldCheck size={20} />
          <span>Nuria Admin</span>
        </div>
        <nav>
          {nuriaAdminRoutes.map((route) => {
            const Icon = icons[route.key];
            const active = pathname === route.href;
            return (
              <Link className={active ? "active" : ""} href={route.href} key={route.href}>
                <Icon size={16} />
                <span>{route.label}</span>
              </Link>
            );
          })}
        </nav>
        <form action={logoutNuriaAdmin} className="nuria-admin-logout-form">
          <button type="submit">Abmelden</button>
        </form>
      </aside>
      <main className="nuria-admin-main">
        <header className="nuria-admin-header">
          <div>
            <span>Interner Zugriff</span>
            <h1>{titles[section]}</h1>
          </div>
          <label className="nuria-admin-search">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Suche" />
          </label>
        </header>

        {section === "overview" ? (
          <>
            <StatCards data={filtered} />
            <CompanyTable companies={filtered.companies.slice(0, 8)} mode="companies" />
          </>
        ) : null}
        {section === "companies" ? <CompanyTable companies={filtered.companies} mode="companies" /> : null}
        {section === "registrations" ? <CompanyTable companies={filtered.companies} mode="registrations" /> : null}
        {section === "payments" ? <CompanyTable companies={filtered.companies} mode="payments" /> : null}
        {section === "plans" ? <PlansTable companies={filtered.companies} /> : null}
        {section === "users" ? <UsersTable users={filtered.users} /> : null}
        {section === "support" ? <SupportTable requests={filtered.supportRequests} /> : null}
        {section === "logs" ? <LogsTable logs={filtered.logs} /> : null}
        {section === "settings" ? (
          <div className="nuria-admin-settings">
            <div><Settings size={18} /><span>Plattformstatus</span><strong>Aktiv</strong></div>
            <div><LifeBuoy size={18} /><span>Support-E-Mail</span><strong>kontakt@nuria-pflege.de</strong></div>
            <div><BadgeEuro size={18} /><span>Payment-Grundwert</span><strong>Banküberweisung</strong></div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
