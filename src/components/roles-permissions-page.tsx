"use client";

import { motion } from "framer-motion";
import { ChevronDown, KeyRound, RotateCcw, Save, ShieldCheck, Users } from "lucide-react";
import type { RolePermissionData } from "@/lib/roles-permissions";

type RolesPermissionsPageProps = {
  data: RolePermissionData;
  saveAction: (formData: FormData) => void;
};

const roleLabels = {
  inhaber: "Inhaber",
  pdl: "PDL",
  verwaltung: "Verwaltung",
  mitarbeiter: "Mitarbeiter",
  pflegefachkraft: "Pflegefachkraft",
};

const pdlSpecialKeys = [
  "employees.invite",
  "employees.edit",
  "roles.assign",
  "locations.create",
  "exports.create",
  "activity.view",
];

export function RolesPermissionsPage({ data, saveAction }: RolesPermissionsPageProps) {
  const stats = [
    ["Rollen gesamt", data.stats.rolesTotal, ShieldCheck],
    ["aktive Mitarbeitende", data.stats.activeEmployees, Users],
    ["PDL mit erweiterten Rechten", data.stats.pdlExtended, KeyRound],
    ["Verwaltung mit Sonderrechten", data.stats.administrationSpecial, KeyRound],
    ["letzte Rechteänderungen", data.stats.recentChanges, ShieldCheck],
  ] as const;
  const allPermissions = data.permissionsByCategory.flatMap((group) => group.permissions);

  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="page roles-page"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="roles-content">
        <div className="roles-header-panel">
          <div>
            <h1>Rollen & Rechte</h1>
            <p>Verwalten Sie Berechtigungen, Rollen und Zugriffe innerhalb Ihres Pflegedienstes.</p>
          </div>
        </div>

        <div className="role-stats-grid">
          {stats.map(([label, value, Icon], index) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="stat-card role-stat-card"
              initial={{ opacity: 0, y: 8 }}
              key={label}
              transition={{ delay: index * 0.025, duration: 0.18, ease: "easeOut" }}
            >
              <div className="stat-icon">
                <Icon size={18} />
              </div>
              <span>{label}</span>
              <strong>{value}</strong>
            </motion.div>
          ))}
        </div>

        <section className="overview-section roles-panel">
          <div className="roles-section-copy">
            <h2>Rollenübersicht</h2>
            <p>Systemrollen für das eigene Unternehmen mit Anzahl der Mitarbeitenden und aktiven Berechtigungen.</p>
          </div>
          <div className="roles-grid">
            {data.roles.map((role, index) => (
              <motion.article
                animate={{ opacity: 1, y: 0 }}
                className="role-card"
                initial={{ opacity: 0, y: 8 }}
                key={role.key}
                transition={{ delay: index * 0.025, duration: 0.18, ease: "easeOut" }}
              >
                <div className="role-card-top">
                  <h3>{role.name}</h3>
                  <span className="location-badge">{role.employeeCount} Mitarbeitende</span>
                </div>
                <p>{role.description}</p>
                <div className="role-card-meta">
                  <strong>{role.activePermissionCount}</strong>
                  <span>aktive Berechtigungen</span>
                </div>
                <a className="button secondary" href="#rechte-matrix">
                  Rechte bearbeiten
                </a>
              </motion.article>
            ))}
          </div>
        </section>

        <form action={saveAction} className="overview-section roles-panel" id="rechte-matrix">
          <div className="section-heading-row">
            <div className="roles-section-copy">
              <h2>Rechte-Matrix</h2>
              <p>Legen Sie fest, welche Rolle welche Bereiche sehen, bearbeiten oder exportieren darf.</p>
            </div>
            <div className="actions">
              <button className="button" type="submit">
                <Save size={16} />
                Änderungen speichern
              </button>
              <button className="button secondary" type="reset">
                <RotateCcw size={16} />
                Änderungen verwerfen
              </button>
            </div>
          </div>

          <div className="permission-matrix">
            <div className="permission-row permission-row-head">
              <span>Berechtigung</span>
              {data.roles.map((role) => (
                <span key={role.key}>{roleLabels[role.key]}</span>
              ))}
            </div>
            {data.permissionsByCategory.map((group, groupIndex) => (
              <motion.details
                animate={{ opacity: 1 }}
                className="permission-category"
                initial={{ opacity: 0 }}
                key={group.category}
                open={groupIndex === 0}
                transition={{ duration: 0.18 }}
              >
                <summary>
                  <span>{group.category}</span>
                  <ChevronDown size={16} />
                </summary>
                {group.permissions.map((permission) => (
                  <div className="permission-row" key={permission.key}>
                    <span>{permission.name}</span>
                    {data.roles.map((role) => {
                      const locked = role.key === "inhaber";
                      const checked = locked || data.enabled[role.key][permission.key];
                      return (
                        <label className={`switch ${locked ? "locked" : ""}`} key={role.key}>
                          <input
                            defaultChecked={checked}
                            disabled={locked}
                            name={`${role.key}:${permission.key}`}
                            type="checkbox"
                          />
                          <span />
                        </label>
                      );
                    })}
                  </div>
                ))}
              </motion.details>
            ))}
          </div>
        </form>

        <section className="overview-section roles-panel">
          <div className="roles-section-copy">
            <h2>PDL-Sonderrechte</h2>
            <p>Legen Sie fest, ob die Pflegedienstleitung zusätzliche Verwaltungsrechte erhält.</p>
          </div>
          <div className="pdl-options-grid">
            {pdlSpecialKeys.map((key, index) => {
              const permission = allPermissions.find((item) => item.key === key);
              return (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="status-row pdl-option-row"
                  initial={{ opacity: 0, y: 6 }}
                  key={key}
                  transition={{ delay: index * 0.02, duration: 0.16 }}
                >
                  <span>{permission?.name ?? key}</span>
                  <span className={`location-status ${data.enabled.pdl[key] ? "active" : "inactive"}`}>
                    {data.enabled.pdl[key] ? "Erlaubt" : "Nicht erlaubt"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="overview-section roles-panel">
          <div className="roles-section-copy">
            <h2>Mitarbeiter-Sonderrechte</h2>
            <p>Vergeben Sie individuelle Zusatzrechte oder Einschränkungen für einzelne Mitarbeitende.</p>
          </div>
          {data.employees.length > 0 ? (
            <div className="special-rights-list">
              {data.employees.map((employee, index) => (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="status-row"
                  initial={{ opacity: 0, y: 6 }}
                  key={employee.id}
                  transition={{ delay: index * 0.015, duration: 0.16 }}
                >
                  <span>{[employee.first_name, employee.last_name].filter(Boolean).join(" ") || employee.email}</span>
                  <span className="badge">{roleLabels[employee.role]}</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div animate={{ opacity: 1 }} className="compact-empty" initial={{ opacity: 0 }}>
              Noch keine Mitarbeiter angelegt.
            </motion.div>
          )}
        </section>
      </div>
    </motion.section>
  );
}
