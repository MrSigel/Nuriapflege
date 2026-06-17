import {
  Activity,
  BadgeEuro,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardCheck,
  Clock3,
  FileArchive,
  FileText,
  FolderOpen,
  Gauge,
  KeyRound,
  LockKeyhole,
  MessageSquare,
  Route,
  Settings,
  ShieldCheck,
  Stethoscope,
  Upload,
  UserCog,
  Users,
} from "lucide-react";

export type Role = "admin" | "inhaber" | "pdl" | "verwaltung" | "mitarbeiter" | "pflegefachkraft";

export type PaymentStatus =
  | "pending_payment"
  | "payment_marked_as_sent"
  | "active"
  | "payment_overdue"
  | "locked";

export type AuthAccount = {
  email: string;
  role: Role;
  password: string;
  tenantId: string | null;
};

export type DashboardRoute = {
  path: string;
  title: string;
  description: string;
  emptyText: string;
  actions: string[];
  icon: typeof Gauge;
  roles: Role[];
  restricted?: string;
};

export const developmentAccounts: AuthAccount[] = [
  { email: "admin@test.de", role: "admin", password: "Test123456!", tenantId: null },
  { email: "verwaltung@test.de", role: "verwaltung", password: "Test123456!", tenantId: "tenant_dev_inhaber" },
];

export const tenantAccessModel = {
  tenantKey: "tenant_id",
  companyKey: "company_id",
  ownerScope: "all_company_records",
  adminScope: "system_wide",
  staffScope: "own_or_assigned_records",
  assignmentAccessHours: 24,
  auditReadyEvents: [
    "access",
    "change",
    "role_change",
    "export",
    "deletion",
    "upload",
    "security_event",
  ],
};

export const pricingModel = {
  packageId: "NP-START-89-2026",
  monthlyPriceEuro: 89,
  intervals: [
    { label: "Monatlich", discountPercent: 0 },
    { label: "3 Monate", discountPercent: 5 },
    { label: "6 Monate", discountPercent: 10 },
    { label: "12 Monate", discountPercent: 15 },
  ],
  paymentStatuses: [
    "pending_payment",
    "payment_marked_as_sent",
    "active",
    "payment_overdue",
    "locked",
  ] satisfies PaymentStatus[],
};

export const businessRegistrationFields = [
  "owner_first_name",
  "owner_last_name",
  "business_email",
  "company_name",
  "phone",
  "address",
  "ik_number_optional",
  "tariff_id",
  "billing_interval",
  "locations",
];

export const blockedOwnerRegistrationEmailDomains = [
  "gmail.com",
  "gmx.de",
  "web.de",
  "outlook.com",
  "yahoo.com",
];

export const appRoutes: DashboardRoute[] = [
  {
    path: "/dashboard",
    title: "Übersicht",
    description: "Zentrale Arbeitsfläche für Organisation, Planung, Dokumentation und interne Abläufe.",
    emptyText: "Noch keine Einträge vorhanden.",
    actions: ["Neu anlegen"],
    icon: Gauge,
    roles: ["inhaber", "pdl", "verwaltung"],
  },
  {
    path: "/dashboard/zahlung-tarif",
    title: "Zahlung & Tarif",
    description: "Tarif, Paket-ID, Zahlungsintervall und Zahlungsstatus für den eigenen Pflegedienst.",
    emptyText: "Noch kein Zahlungsnachweis vorhanden.",
    actions: ["Zahlung bestätigen"],
    icon: BadgeEuro,
    roles: ["inhaber"],
  },
  {
    path: "/dashboard/onboarding",
    title: "Einrichtung",
    description: "Einrichtungsassistent für Unternehmensdaten, Standort, Tarif und Zahlung.",
    emptyText: "Einrichtung noch nicht abgeschlossen.",
    actions: ["Einrichtung fortsetzen"],
    icon: ClipboardCheck,
    roles: ["inhaber"],
  },
  {
    path: "/dashboard/standorte",
    title: "Standorte",
    description: "Standortstruktur für den eigenen Pflegedienst.",
    emptyText: "Noch keine Standorte angelegt.",
    actions: ["Standort hinzufügen"],
    icon: Building2,
    roles: ["inhaber", "pdl"],
    restricted: "PDL sieht nur zugewiesene Standorte.",
  },
  {
    path: "/dashboard/mitarbeiter",
    title: "Mitarbeiter",
    description: "Mitarbeiterverwaltung und Einladungsstruktur.",
    emptyText: "Noch keine Mitarbeiter angelegt.",
    actions: ["Einladung senden"],
    icon: Users,
    roles: ["inhaber", "pdl", "verwaltung"],
    restricted: "PDL und Verwaltung nur mit erlaubtem Zugriff.",
  },
  {
    path: "/dashboard/rollen-rechte",
    title: "Rollen & Rechte",
    description: "Rollen, Berechtigungen und Zugriffsumfang innerhalb des eigenen Unternehmens.",
    emptyText: "Noch keine Rollenanpassungen vorhanden.",
    actions: ["Rolle vorbereiten"],
    icon: KeyRound,
    roles: ["inhaber", "pdl"],
    restricted: "PDL nur mit aktiver Berechtigung durch den Inhaber.",
  },
  {
    path: "/dashboard/klienten",
    title: "Klienten",
    description: "Klientenstruktur ohne Inhalts- oder Falldaten.",
    emptyText: "Noch keine Klienten vorhanden.",
    actions: ["Neu anlegen"],
    icon: Stethoscope,
    roles: ["inhaber", "pdl", "verwaltung"],
  },
  {
    path: "/dashboard/dienstplanung",
    title: "Dienstplanung",
    description: "Grundstruktur für Dienstpläne und Zuweisungen.",
    emptyText: "Noch keine Dienste geplant.",
    actions: ["Planung anlegen"],
    icon: CalendarDays,
    roles: ["inhaber", "pdl", "verwaltung"],
  },
  {
    path: "/dashboard/tourenplanung",
    title: "Tourenplanung",
    description: "Grundstruktur für Touren und mobile Tourführung.",
    emptyText: "Noch keine Touren geplant.",
    actions: ["Tour anlegen"],
    icon: Route,
    roles: ["inhaber", "pdl"],
  },
  {
    path: "/dashboard/zeiterfassung",
    title: "Zeiterfassung",
    description: "Arbeitszeitstruktur für Einsätze und interne Auswertung.",
    emptyText: "Noch keine Zeiten erfasst.",
    actions: ["Eintrag anlegen"],
    icon: Clock3,
    roles: ["inhaber", "pdl", "verwaltung"],
  },
  {
    path: "/dashboard/pflegedokumentation",
    title: "Pflegedokumentation",
    description: "Dokumentationsbereich für zugewiesene und berechtigte Pflegeabläufe.",
    emptyText: "Noch keine Pflegedokumentation vorhanden.",
    actions: ["Eintrag anlegen"],
    icon: FileText,
    roles: ["inhaber", "pdl"],
  },
  {
    path: "/dashboard/abrechnung",
    title: "Abrechnung",
    description: "Vorbereitete Struktur für abrechnungsbezogene Arbeitsabläufe.",
    emptyText: "Noch keine Abrechnungsvorgänge vorhanden.",
    actions: ["Vorgang anlegen"],
    icon: FileArchive,
    roles: ["inhaber", "verwaltung"],
  },
  {
    path: "/dashboard/dokumente",
    title: "Dokumente",
    description: "Dokumentenbereich für Uploads, Nachweise und interne Ablage.",
    emptyText: "Noch keine Dokumente hochgeladen.",
    actions: ["Dokument hochladen"],
    icon: FolderOpen,
    roles: ["inhaber", "pdl", "verwaltung"],
  },
  {
    path: "/dashboard/qm-md",
    title: "QM / MD-Vorbereitung",
    description: "Struktur für Qualitätsmanagement, Nachweise und Prüfvorbereitung.",
    emptyText: "Noch keine Prüfprotokolle vorhanden.",
    actions: ["Nachweis anlegen"],
    icon: ClipboardCheck,
    roles: ["inhaber", "pdl"],
  },
  {
    path: "/dashboard/kommunikation",
    title: "Kommunikation",
    description: "Interner Nachrichten- und Kommunikationsbereich.",
    emptyText: "Noch keine Nachrichten vorhanden.",
    actions: ["Nachricht erstellen"],
    icon: MessageSquare,
    roles: ["inhaber", "pdl", "verwaltung"],
  },
  {
    path: "/dashboard/bewerber",
    title: "Bewerber / Personalgewinnung",
    description: "Struktur für Bewerbungen und Personalgewinnung.",
    emptyText: "Noch keine Bewerbungen vorhanden.",
    actions: ["Bewerbung erfassen"],
    icon: BriefcaseBusiness,
    roles: ["inhaber", "pdl", "verwaltung"],
  },
  {
    path: "/dashboard/website-online-praesenz",
    title: "Website / Online-Präsenz",
    description: "Organisationsbereich für Website-Anfragen und Online-Präsenz.",
    emptyText: "Noch keine Website-Anfragen vorhanden.",
    actions: ["Anfrage anlegen"],
    icon: Building2,
    roles: ["inhaber", "verwaltung"],
  },
  {
    path: "/dashboard/exporte",
    title: "Exporte",
    description: "Exportstruktur für berechtigte Rollen.",
    emptyText: "Noch keine Exporte vorhanden.",
    actions: ["Export vorbereiten"],
    icon: Upload,
    roles: ["inhaber", "pdl", "verwaltung"],
    restricted: "PDL und Verwaltung nur bei erteilter Exportberechtigung.",
  },
  {
    path: "/dashboard/aktivitaeten",
    title: "Aktivitäten / Protokolle",
    description: "Aktivitäts- und Protokollstruktur für das eigene Unternehmen.",
    emptyText: "Noch keine Aktivitäten vorhanden.",
    actions: ["Protokoll anzeigen"],
    icon: Activity,
    roles: ["inhaber", "pdl"],
    restricted: "PDL sieht nur eingeschränkte Protokolle.",
  },
  {
    path: "/dashboard/compliance",
    title: "Compliance / Datenschutz / Prüfprotokolle",
    description: "Zugriffe, Änderungen, Rollen, Exporte, Löschungen, Uploads und Sicherheitsereignisse.",
    emptyText: "Noch keine Prüfprotokolle vorhanden.",
    actions: ["Nachweis anlegen"],
    icon: ShieldCheck,
    roles: ["inhaber", "pdl"],
    restricted: "PDL nur mit eingeschränkter Sicht.",
  },
  {
    path: "/dashboard/einstellungen",
    title: "Einstellungen",
    description: "Grundstruktur für Unternehmens- und Nutzerkonfiguration.",
    emptyText: "Noch keine Einstellungen hinterlegt.",
    actions: ["Einstellung anlegen"],
    icon: Settings,
    roles: ["inhaber", "pdl", "verwaltung"],
  },
];

export const adminRoutes: DashboardRoute[] = [
  { path: "/admin", title: "Übersicht", description: "Interne Nuria-Systemübersicht.", emptyText: "Noch keine Einträge vorhanden.", actions: ["Neu anlegen"], icon: Gauge, roles: ["admin"] },
  { path: "/admin/pflegedienste", title: "Pflegedienste / Unternehmen", description: "Systemweite Unternehmensstruktur.", emptyText: "Noch keine Pflegedienste vorhanden.", actions: ["Unternehmen anlegen"], icon: Building2, roles: ["admin"] },
  { path: "/admin/registrierungen", title: "Registrierungen", description: "Vorbereitete Prüfung neuer Inhaber-Registrierungen.", emptyText: "Noch keine Registrierungen vorhanden.", actions: ["Registrierung prüfen"], icon: ClipboardCheck, roles: ["admin"] },
  { path: "/admin/zahlungen", title: "Zahlungen", description: "Systemweite Zahlungs- und Markierungsstruktur.", emptyText: "Noch keine Zahlungen vorhanden.", actions: ["Zahlung prüfen"], icon: BadgeEuro, roles: ["admin"] },
  { path: "/admin/tarife", title: "Tarife / Paket-IDs", description: "Tarif- und Paket-ID-Struktur.", emptyText: "Noch keine Tarifanpassungen vorhanden.", actions: ["Tarif anlegen"], icon: FileArchive, roles: ["admin"] },
  { path: "/admin/freischaltungen", title: "Freischaltungen", description: "Freischaltungsstruktur für Pflegedienste.", emptyText: "Noch keine Freischaltungen vorhanden.", actions: ["Freischaltung anlegen"], icon: KeyRound, roles: ["admin"] },
  { path: "/admin/sperrungen", title: "Sperrungen", description: "Sperr- und Lesemodus-Struktur.", emptyText: "Noch keine Sperrungen vorhanden.", actions: ["Sperrstatus anlegen"], icon: LockKeyhole, roles: ["admin"] },
  { path: "/admin/nutzer", title: "Nutzer", description: "Systemweite Nutzer- und Rollenstruktur.", emptyText: "Noch keine Nutzer vorhanden.", actions: ["Nutzer anlegen"], icon: UserCog, roles: ["admin"] },
  { path: "/admin/support", title: "Support / Nachrichten", description: "Support- und Nachrichtenstruktur.", emptyText: "Noch keine Nachrichten vorhanden.", actions: ["Nachricht erstellen"], icon: MessageSquare, roles: ["admin"] },
  { path: "/admin/systemprotokolle", title: "Systemprotokolle", description: "Systemweite Protokollstruktur.", emptyText: "Noch keine Systemprotokolle vorhanden.", actions: ["Protokoll anzeigen"], icon: Activity, roles: ["admin"] },
  { path: "/admin/compliance", title: "Compliance / Datenschutz / Prüfprotokolle", description: "Systemweite Compliance- und Datenschutzstruktur.", emptyText: "Noch keine Prüfprotokolle vorhanden.", actions: ["Nachweis anlegen"], icon: ShieldCheck, roles: ["admin"] },
  { path: "/admin/einstellungen", title: "Einstellungen", description: "Interne Systemeinstellungen.", emptyText: "Noch keine Einstellungen hinterlegt.", actions: ["Einstellung anlegen"], icon: Settings, roles: ["admin"] },
];

export const staffRoutes: DashboardRoute[] = [
  { path: "/mitarbeiter/dashboard", title: "Mein Dashboard", description: "Persönliche Arbeitsübersicht für eigene und zugewiesene Bereiche.", emptyText: "Noch keine Einträge vorhanden.", actions: ["Eintrag anlegen"], icon: Gauge, roles: ["mitarbeiter", "pflegefachkraft"] },
  { path: "/mitarbeiter/dienstplan", title: "Mein Dienstplan", description: "Persönlicher Dienstplan.", emptyText: "Noch keine Dienste geplant.", actions: ["Dienst anzeigen"], icon: CalendarDays, roles: ["mitarbeiter", "pflegefachkraft"] },
  { path: "/mitarbeiter/tour", title: "Meine Tour", description: "Mobile Tourstruktur mit Patient, Aufgaben, Hinweisen und Dokumentenstatus.", emptyText: "Noch keine Tour zugewiesen.", actions: ["Nächster Patient"], icon: Route, roles: ["mitarbeiter", "pflegefachkraft"] },
  { path: "/mitarbeiter/patienten", title: "Meine Patienten / Klienten", description: "Nur aktuell oder kürzlich zugewiesene Klienten.", emptyText: "Noch keine Klienten zugewiesen.", actions: ["Zuweisung anzeigen"], icon: Stethoscope, roles: ["mitarbeiter", "pflegefachkraft"] },
  { path: "/mitarbeiter/notizen", title: "Notizen / Übergaben", description: "Freitextbereich für Notizen und Übergaben zu zugewiesenen Einsätzen.", emptyText: "Noch keine Notizen vorhanden.", actions: ["Notiz anlegen"], icon: FileText, roles: ["mitarbeiter", "pflegefachkraft"] },
  { path: "/mitarbeiter/dokumente-hochladen", title: "Dokumente hochladen", description: "Uploadstruktur für Dokumente und Verordnungen bei zugewiesenen Klienten.", emptyText: "Noch keine Dokumente hochgeladen.", actions: ["Dokument hochladen"], icon: Upload, roles: ["mitarbeiter", "pflegefachkraft"] },
  { path: "/mitarbeiter/zeiterfassung", title: "Meine Zeiterfassung", description: "Persönliche Arbeitszeitstruktur.", emptyText: "Noch keine Zeiten erfasst.", actions: ["Zeit erfassen"], icon: Clock3, roles: ["mitarbeiter", "pflegefachkraft"] },
  { path: "/mitarbeiter/kommunikation", title: "Kommunikation", description: "Persönlicher Kommunikationsbereich.", emptyText: "Noch keine Nachrichten vorhanden.", actions: ["Nachricht erstellen"], icon: MessageSquare, roles: ["mitarbeiter", "pflegefachkraft"] },
  { path: "/mitarbeiter/profil", title: "Mein Profil", description: "Persönliche Profilstruktur.", emptyText: "Noch keine Profildaten hinterlegt.", actions: ["Profil bearbeiten"], icon: UserCog, roles: ["mitarbeiter", "pflegefachkraft"] },
  { path: "/mitarbeiter/abwesenheiten", title: "Meine Abwesenheiten / Urlaub", description: "Persönliche Abwesenheitsstruktur.", emptyText: "Noch keine Abwesenheiten vorhanden.", actions: ["Abwesenheit anlegen"], icon: CalendarDays, roles: ["mitarbeiter", "pflegefachkraft"] },
];

export function routeByPath(path: string) {
  return [...appRoutes, ...adminRoutes, ...staffRoutes].find((route) => route.path === path);
}
