import type { EmployeeRole } from "@/lib/employees";

export type Permission = {
  key: string;
  name: string;
  category: string;
  defaultRoles: EmployeeRole[];
};

export const managedRoles: Array<{ key: EmployeeRole; name: string; description: string }> = [
  { key: "inhaber", name: "Inhaber", description: "Vollzugriff auf das eigene Unternehmen." },
  { key: "pdl", name: "Pflegedienstleitung", description: "Operative Pflege- und Planungsrechte." },
  { key: "verwaltung", name: "Verwaltung", description: "Büro-, Abrechnungs- und Organisationsbereiche." },
  { key: "mitarbeiter", name: "Mitarbeiter", description: "Eigene und zugewiesene operative Bereiche." },
  { key: "pflegefachkraft", name: "Pflegefachkraft", description: "Eigene und zugewiesene Pflegebereiche." },
];

const owner: EmployeeRole[] = ["inhaber"];
const ops: EmployeeRole[] = ["inhaber", "pdl"];
const office: EmployeeRole[] = ["inhaber", "verwaltung"];
const staff: EmployeeRole[] = ["inhaber", "pdl", "verwaltung", "mitarbeiter", "pflegefachkraft"];

export const permissions: Permission[] = [
  { key: "dashboard.view", name: "Dashboard sehen", category: "Allgemein", defaultRoles: staff },
  { key: "own_data.view", name: "eigene Daten sehen", category: "Allgemein", defaultRoles: staff },
  { key: "own_profile.edit", name: "eigenes Profil bearbeiten", category: "Allgemein", defaultRoles: staff },
  { key: "communication.use", name: "Kommunikation nutzen", category: "Allgemein", defaultRoles: staff },
  { key: "employees.view", name: "Mitarbeiter sehen", category: "Mitarbeiter", defaultRoles: ["inhaber", "verwaltung"] },
  { key: "employees.invite", name: "Mitarbeiter einladen", category: "Mitarbeiter", defaultRoles: owner },
  { key: "employees.edit", name: "Mitarbeiter bearbeiten", category: "Mitarbeiter", defaultRoles: owner },
  { key: "employees.status", name: "Mitarbeiter aktiv/inaktiv setzen", category: "Mitarbeiter", defaultRoles: owner },
  { key: "roles.assign", name: "Rollen zuweisen", category: "Mitarbeiter", defaultRoles: owner },
  { key: "staff_code.manage", name: "Kürzel verwalten", category: "Mitarbeiter", defaultRoles: owner },
  { key: "locations.view", name: "Standorte sehen", category: "Standorte", defaultRoles: ops },
  { key: "locations.create", name: "Standorte anlegen", category: "Standorte", defaultRoles: owner },
  { key: "locations.edit", name: "Standorte bearbeiten", category: "Standorte", defaultRoles: owner },
  { key: "locations.status", name: "Standorte aktiv/inaktiv setzen", category: "Standorte", defaultRoles: owner },
  { key: "clients.view", name: "Klienten sehen", category: "Klienten", defaultRoles: ["inhaber", "pdl", "verwaltung", "mitarbeiter", "pflegefachkraft"] },
  { key: "clients.create", name: "Klienten anlegen", category: "Klienten", defaultRoles: ["inhaber", "pdl"] },
  { key: "clients.edit", name: "Klienten bearbeiten", category: "Klienten", defaultRoles: ops },
  { key: "clients.deactivate", name: "Klienten deaktivieren", category: "Klienten", defaultRoles: owner },
  { key: "clients.export", name: "Klienten exportieren", category: "Klienten", defaultRoles: owner },
  { key: "shifts.view", name: "Dienstplanung sehen", category: "Dienstplanung", defaultRoles: ["inhaber", "pdl", "verwaltung", "mitarbeiter", "pflegefachkraft"] },
  { key: "shifts.create", name: "Dienste anlegen", category: "Dienstplanung", defaultRoles: ops },
  { key: "shifts.edit", name: "Dienste bearbeiten", category: "Dienstplanung", defaultRoles: ops },
  { key: "shifts.delete", name: "Dienste löschen", category: "Dienstplanung", defaultRoles: owner },
  { key: "shifts.assign_staff", name: "Mitarbeiter zuweisen", category: "Dienstplanung", defaultRoles: ops },
  { key: "tours.view", name: "Touren sehen", category: "Tourenplanung", defaultRoles: ["inhaber", "pdl", "mitarbeiter", "pflegefachkraft"] },
  { key: "tours.create", name: "Touren erstellen", category: "Tourenplanung", defaultRoles: ops },
  { key: "tours.edit", name: "Touren bearbeiten", category: "Tourenplanung", defaultRoles: ops },
  { key: "tours.assign", name: "Touren zuweisen", category: "Tourenplanung", defaultRoles: ops },
  { key: "tours.complete", name: "Touren abschließen", category: "Tourenplanung", defaultRoles: ["inhaber", "pdl", "mitarbeiter", "pflegefachkraft"] },
  { key: "time.own_view", name: "eigene Zeiten sehen", category: "Zeiterfassung", defaultRoles: staff },
  { key: "time.all_view", name: "Zeiten aller Mitarbeiter sehen", category: "Zeiterfassung", defaultRoles: ["inhaber", "pdl", "verwaltung"] },
  { key: "time.edit", name: "Zeiten bearbeiten", category: "Zeiterfassung", defaultRoles: office },
  { key: "time.export", name: "Zeiten exportieren", category: "Zeiterfassung", defaultRoles: owner },
  { key: "care_docs.view", name: "Pflegedokumentation sehen", category: "Pflegedokumentation", defaultRoles: ["inhaber", "pdl", "mitarbeiter", "pflegefachkraft"] },
  { key: "care_docs.notes", name: "Notizen hinzufügen", category: "Pflegedokumentation", defaultRoles: ["inhaber", "pdl", "mitarbeiter", "pflegefachkraft"] },
  { key: "care_docs.edit", name: "Dokumentation bearbeiten", category: "Pflegedokumentation", defaultRoles: ops },
  { key: "care_docs.export", name: "Dokumentation exportieren", category: "Pflegedokumentation", defaultRoles: owner },
  { key: "documents.view", name: "Dokumente sehen", category: "Dokumente", defaultRoles: staff },
  { key: "documents.upload", name: "Dokumente hochladen", category: "Dokumente", defaultRoles: staff },
  { key: "documents.edit", name: "Dokumente bearbeiten", category: "Dokumente", defaultRoles: ops },
  { key: "documents.delete", name: "Dokumente löschen", category: "Dokumente", defaultRoles: owner },
  { key: "documents.export", name: "Dokumente exportieren", category: "Dokumente", defaultRoles: owner },
  { key: "qm.view", name: "QM/MD sehen", category: "QM / MD", defaultRoles: ops },
  { key: "qm.checklists_edit", name: "Checklisten bearbeiten", category: "QM / MD", defaultRoles: ops },
  { key: "qm.measures_edit", name: "Maßnahmen bearbeiten", category: "QM / MD", defaultRoles: ops },
  { key: "qm.export", name: "QM/MD exportieren", category: "QM / MD", defaultRoles: owner },
  { key: "billing.view", name: "Abrechnung sehen", category: "Abrechnung", defaultRoles: office },
  { key: "billing.edit", name: "Abrechnung bearbeiten", category: "Abrechnung", defaultRoles: office },
  { key: "billing.create_invoice", name: "Rechnungen erstellen", category: "Abrechnung", defaultRoles: office },
  { key: "billing.export", name: "Abrechnung exportieren", category: "Abrechnung", defaultRoles: owner },
  { key: "applicants.view", name: "Bewerber sehen", category: "Bewerber / Personalgewinnung", defaultRoles: ["inhaber", "pdl", "verwaltung"] },
  { key: "applicants.edit", name: "Bewerber bearbeiten", category: "Bewerber / Personalgewinnung", defaultRoles: ["inhaber", "pdl", "verwaltung"] },
  { key: "applicants.export", name: "Bewerber exportieren", category: "Bewerber / Personalgewinnung", defaultRoles: owner },
  { key: "website_leads.view", name: "Website-Anfragen sehen", category: "Website / Online-Präsenz", defaultRoles: office },
  { key: "website_leads.edit", name: "Leads bearbeiten", category: "Website / Online-Präsenz", defaultRoles: office },
  { key: "marketing_tasks.edit", name: "Marketing-Aufgaben bearbeiten", category: "Website / Online-Präsenz", defaultRoles: owner },
  { key: "exports.create", name: "Exporte erstellen", category: "Exporte", defaultRoles: owner },
  { key: "exports.download", name: "Exporte herunterladen", category: "Exporte", defaultRoles: owner },
  { key: "activity.view", name: "Aktivitäten sehen", category: "Aktivitäten / Protokolle", defaultRoles: owner },
  { key: "audit.view", name: "Prüfprotokolle sehen", category: "Aktivitäten / Protokolle", defaultRoles: owner },
  { key: "settings.view", name: "Unternehmenseinstellungen sehen", category: "Einstellungen", defaultRoles: owner },
  { key: "settings.edit", name: "Unternehmenseinstellungen bearbeiten", category: "Einstellungen", defaultRoles: owner },
  { key: "roles_permissions.edit", name: "Rollen & Rechte bearbeiten", category: "Einstellungen", defaultRoles: owner },
];
