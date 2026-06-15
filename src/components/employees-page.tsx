"use client";

import { motion } from "framer-motion";
import { Download, Eye, KeyRound, Mail, UserRound, Users } from "lucide-react";
import type { Employee, EmployeesData, EmployeeRole, EmployeeStatus, InvitationStatus } from "@/lib/employees";
import { EmployeeModal } from "@/components/employee-modal";

type EmployeesPageProps = {
  data: EmployeesData;
  actions: {
    inviteEmployee: (formData: FormData) => void;
    createEmployee: (formData: FormData) => void;
    updateEmployee: (formData: FormData) => void;
    toggleEmployeeStatus: (formData: FormData) => void;
  };
};

const roleLabels: Record<EmployeeRole, string> = {
  inhaber: "Inhaber",
  pdl: "Pflegedienstleitung",
  verwaltung: "Verwaltung",
  mitarbeiter: "Mitarbeiter",
  pflegefachkraft: "Pflegefachkraft",
};

const statusLabels: Record<EmployeeStatus, string> = {
  active: "Aktiv",
  inactive: "Inaktiv",
  invited: "Eingeladen",
  pending: "Ausstehend",
};

const invitationLabels: Record<InvitationStatus, string> = {
  not_invited: "Nicht eingeladen",
  invited: "Eingeladen",
  accepted: "Angenommen",
  expired: "Abgelaufen",
};

function EmployeeCard({
  employee,
  locations,
  updateEmployee,
  toggleEmployeeStatus,
}: {
  employee: Employee;
  locations: EmployeesData["locations"];
  updateEmployee: (formData: FormData) => void;
  toggleEmployeeStatus: (formData: FormData) => void;
}) {
  const fullName = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "Ohne Namen";
  const locationText = employee.locations.length > 0 ? employee.locations.map((location) => location.name).join(", ") : "Noch kein Standort zugeordnet.";

  return (
    <motion.article className="employee-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18, ease: "easeOut" }}>
      <div className="employee-card-header">
        <div>
          <h2>{fullName}</h2>
          <p>{employee.email}</p>
        </div>
        <span className={`location-status ${employee.status}`}>{statusLabels[employee.status]}</span>
      </div>
      <div className="employee-details-grid">
        <div><span>Telefon</span><strong>{employee.phone || "Keine Telefonnummer hinterlegt."}</strong></div>
        <div><span>Rolle</span><strong>{roleLabels[employee.role]}</strong></div>
        <div><span>Kürzel</span><strong>{employee.staff_code || "Kein Kürzel hinterlegt."}</strong></div>
        <div><span>Qualifikation</span><strong>{employee.qualification || "Noch keine Qualifikation hinterlegt."}</strong></div>
        <div><span>Standorte</span><strong>{locationText}</strong></div>
        <div><span>Einladung</span><strong>{invitationLabels[employee.invitation_status]}</strong></div>
        <div><span>Zuletzt aktualisiert</span><strong>{new Intl.DateTimeFormat("de-DE").format(new Date(employee.updated_at))}</strong></div>
      </div>
      <div className="location-actions">
        <details>
          <summary><Eye size={15} />Ansehen</summary>
          <div className="location-detail-panel">
            <p>Stammdaten, Rolle, Status, Kürzel und Kontaktinformationen sind oben aufgeführt.</p>
            <p>{locationText}</p>
            <p>{employee.qualification ? employee.qualification : "Noch keine Qualifikation hinterlegt."}</p>
          </div>
        </details>
        <EmployeeModal action={updateEmployee} buttonLabel="Bearbeiten" mode="edit" locations={locations} employee={employee} />
        <form action={toggleEmployeeStatus}>
          <input name="id" type="hidden" value={employee.id} />
          <input name="status" type="hidden" value={employee.status} />
          <input name="role" type="hidden" value={employee.role} />
          <motion.button className="button secondary" type="submit" whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>
            {employee.status === "active" ? "Inaktiv setzen" : "Aktiv setzen"}
          </motion.button>
        </form>
      </div>
    </motion.article>
  );
}

export function EmployeesPage({ data, actions }: EmployeesPageProps) {
  const stats = [
    ["Mitarbeiter gesamt", data.stats.total, Users],
    ["Aktive Mitarbeiter", data.stats.active, UserRound],
    ["Inaktive Mitarbeiter", data.stats.inactive, UserRound],
    ["Offene Einladungen", data.stats.openInvitations, Mail],
    ["Pflegedienstleitung", data.stats.pdl, KeyRound],
    ["Verwaltung", data.stats.administration, Users],
    ["Pflegekräfte / Mitarbeiter", data.stats.careStaff, Users],
  ] as const;

  return (
    <motion.section className="page employees-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      <div className="employees-header">
        <div>
          <h1>Mitarbeiter</h1>
          <p>Verwalten Sie Mitarbeitende, Rollen, Standorte und Einladungen Ihres Pflegedienstes.</p>
        </div>
        <div className="employees-header-actions">
          <EmployeeModal action={actions.inviteEmployee} buttonLabel="Mitarbeiter einladen" mode="invite" locations={data.locations} />
          <EmployeeModal action={actions.createEmployee} buttonLabel="Mitarbeiter hinzufügen" mode="create" locations={data.locations} />
          <button className="button secondary" disabled type="button" title="Export wird vorbereitet."><Download size={16} />Mitarbeiter exportieren</button>
        </div>
      </div>
      <div className="employee-stats-grid">
        {stats.map(([label, value, Icon], index) => (
          <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02, duration: 0.18 }}>
            <div className="stat-icon"><Icon size={18} /></div>
            <span>{label}</span>
            <strong>{value}</strong>
          </motion.div>
        ))}
      </div>
      {data.employees.length > 0 ? (
        <div className="employees-list">
          {data.employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              locations={data.locations}
              updateEmployee={actions.updateEmployee}
              toggleEmployeeStatus={actions.toggleEmployeeStatus}
            />
          ))}
        </div>
      ) : null}
    </motion.section>
  );
}
