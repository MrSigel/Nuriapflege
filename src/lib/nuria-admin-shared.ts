import type { Role } from "@/lib/nuria-config";

export type NuriaAdminSection =
  | "overview"
  | "companies"
  | "registrations"
  | "payments"
  | "plans"
  | "users"
  | "support"
  | "logs"
  | "settings";

export const nuriaAdminRoutes: { key: NuriaAdminSection; href: string; label: string }[] = [
  { key: "overview", href: "/nuria-admin", label: "Übersicht" },
  { key: "companies", href: "/nuria-admin/pflegedienste", label: "Pflegedienste" },
  { key: "registrations", href: "/nuria-admin/registrierungen", label: "Registrierungen" },
  { key: "payments", href: "/nuria-admin/zahlungen", label: "Zahlungen" },
  { key: "plans", href: "/nuria-admin/tarife", label: "Tarife" },
  { key: "users", href: "/nuria-admin/nutzer", label: "Nutzer" },
  { key: "support", href: "/nuria-admin/support", label: "Support" },
  { key: "logs", href: "/nuria-admin/systemlogs", label: "Systemlogs" },
  { key: "settings", href: "/nuria-admin/einstellungen", label: "Einstellungen" },
];

export const nuriaPlans = [
  { packageId: "NP-START-89-MONTHLY", interval: "Monatlich", amount: 89.0 },
  { packageId: "NP-START-89-QUARTERLY", interval: "Quartal", amount: 253.65 },
  { packageId: "NP-START-89-HALFYEAR", interval: "Halbjahr", amount: 480.6 },
  { packageId: "NP-START-89-YEARLY", interval: "Jahr", amount: 907.8 },
];

export type AdminCompany = {
  id: string;
  name: string;
  email: string | null;
  billing_email: string | null;
  status: string;
  package_id: string | null;
  billing_interval: string | null;
  onboarding_status: string;
  payment_status: string;
  payment_marked_at: string | null;
  payment_due_until: string | null;
  admin_confirmed_at: string | null;
  locked_at: string | null;
  created_at: string;
  owner_name: string;
  owner_email: string | null;
  subscription_status: string | null;
  subscription_package: string | null;
  subscription_total: number | null;
  last_payment_status: string | null;
  last_payment_amount: number | null;
  last_payment_marked_at: string | null;
};

export type AdminUser = {
  id: string;
  company_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: Role;
  status: string;
  created_at: string;
  company_name: string | null;
};

export type SupportRequest = {
  id: string;
  company_id: string | null;
  company_name: string | null;
  name: string | null;
  email: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  replies: { id: string; body: string; created_at: string }[];
};

export type AdminLog = {
  id: string;
  company_id: string | null;
  company_name: string | null;
  admin_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type NuriaAdminData = {
  adminUserId: string | null;
  companies: AdminCompany[];
  users: AdminUser[];
  supportRequests: SupportRequest[];
  logs: AdminLog[];
  stats: {
    totalCompanies: number;
    newRegistrations: number;
    activeCompanies: number;
    openPayments: number;
    markedPayments: number;
    lockedAccounts: number;
    newSupport: number;
    systemEvents: number;
  };
};
