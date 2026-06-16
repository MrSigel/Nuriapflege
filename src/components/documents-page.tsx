"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Archive, Download, Eye, File, FileText, FilterX, Pencil, Search, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionDialog, ConfirmActionDialog } from "@/components/action-dialogs";
import type { CompanyDocument, DocumentsData } from "@/lib/documents";

type Props = {
  data: DocumentsData;
  actions: {
    uploadDocument: (fd: FormData) => void;
    updateDocument: (fd: FormData) => void;
    archiveDocument: (fd: FormData) => void;
    deleteDocument: (fd: FormData) => void;
    getDocumentSignedUrl: (fd: FormData) => Promise<{ url: string; mimeType: string | null } | null>;
  };
};

const cat: Record<string, string> = {
  verordnung: "Verordnung",
  vertrag: "Vertrag",
  pflegeakte: "Pflegeakte",
  abrechnung: "Abrechnung",
  qualifikation: "Qualifikation",
  nachweis: "Nachweis",
  bild: "Bild",
  sonstiges: "Sonstiges",
};

const st: Record<string, string> = {
  active: "Aktiv",
  archived: "Archiviert",
  pending_review: "Zur Prüfung",
  deleted: "Gelöscht",
};

const vis: Record<string, string> = {
  management: "Leitung",
  care_team: "Pflegeteam",
  employee_private: "Mitarbeiterbezogen",
  client_related: "Klientenbezogen",
};

function size(n: number) {
  if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  if (n > 1024) return `${Math.round(n / 1024)} KB`;
  return `${n} B`;
}

function val(v: unknown) {
  return v && String(v).trim() ? String(v) : "Nicht hinterlegt";
}

function DocForm({
  action,
  data,
  doc,
  label,
  upload = false,
}: {
  action: (fd: FormData) => void;
  data: DocumentsData;
  doc?: CompanyDocument;
  label: string;
  upload?: boolean;
}) {
  return (
    <ActionDialog
      action={action}
      buttonIcon={upload ? <Upload size={16} /> : <Pencil size={16} />}
      buttonLabel={label}
      buttonVariant={upload ? "primary" : "secondary"}
      formClassName="documents-form"
      hiddenFields={doc ? [{ name: "id", value: doc.id }] : undefined}
      submitLabel={upload ? "Hochladen" : "Speichern"}
      title={label}
    >
      {upload ? (
        <label className="documents-form-wide">
          Datei
          <input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
        </label>
      ) : null}
      <label>
        Titel
        <input name="title" required defaultValue={doc?.title ?? ""} />
      </label>
      <label>
        Kategorie
        <select name="category" required defaultValue={doc?.category ?? "sonstiges"}>
          {Object.entries(cat).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Sichtbarkeit
        <select name="visibility" required defaultValue={doc?.visibility ?? "management"}>
          {Object.entries(vis).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status
        <select name="status" required defaultValue={doc?.status ?? "active"}>
          {Object.entries(st).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Klient
        <select name="client_id" defaultValue={doc?.client_id ?? ""}>
          <option value="">Kein Klient</option>
          {data.clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Mitarbeiter
        <select name="employee_id" defaultValue={doc?.employee_id ?? ""}>
          <option value="">Kein Mitarbeiter</option>
          {data.employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Dienst
        <select name="shift_id" defaultValue={doc?.shift_id ?? ""}>
          <option value="">Kein Dienst</option>
          {data.shifts.map((shift) => (
            <option key={shift.id} value={shift.id}>
              {shift.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tour
        <select name="tour_id" defaultValue={doc?.tour_id ?? ""}>
          <option value="">Keine Tour</option>
          {data.tours.map((tour) => (
            <option key={tour.id} value={tour.id}>
              {tour.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tourstopp
        <select name="tour_stop_id" defaultValue={doc?.tour_stop_id ?? ""}>
          <option value="">Kein Tourstopp</option>
          {data.tourStops.map((stop) => (
            <option key={stop.id} value={stop.id}>
              {stop.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Rechnung
        <select name="invoice_id" defaultValue={doc?.invoice_id ?? ""}>
          <option value="">Keine Rechnung</option>
          {data.invoices.map((invoice) => (
            <option key={invoice.id} value={invoice.id}>
              {invoice.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Abrechnungsposition
        <select name="billing_item_id" defaultValue={doc?.billing_item_id ?? ""}>
          <option value="">Keine Position</option>
          {data.billingItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="documents-form-wide">
        Beschreibung
        <textarea name="description" rows={3} defaultValue={doc?.description ?? ""} />
      </label>
    </ActionDialog>
  );
}

function SignedLink({
  doc,
  action,
  label,
  preview = false,
}: {
  doc: CompanyDocument;
  action: Props["actions"]["getDocumentSignedUrl"];
  label: string;
  preview?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [mime, setMime] = useState<string | null>(null);

  async function load() {
    const fd = new FormData();
    fd.set("id", doc.id);
    const res = await action(fd);
    setUrl(res?.url ?? null);
    setMime(res?.mimeType ?? null);
  }

  const canPreview = mime?.startsWith("image/") || mime === "application/pdf";

  return (
    <div className="signed-link">
      <button className="button secondary" type="button" onClick={load}>
        {preview ? <Eye size={15} /> : <Download size={15} />} {label}
      </button>
      {url && !preview ? (
        <a className="button secondary" href={url}>
          Herunterladen
        </a>
      ) : null}
      {url && preview && canPreview ? (
        <a className="button secondary" href={url} target="_blank">
          Vorschau öffnen
        </a>
      ) : url && preview ? (
        <span>Vorschau für diesen Dateityp nicht verfügbar. Bitte herunterladen.</span>
      ) : null}
    </div>
  );
}

export function DocumentsPage({ data, actions }: Props) {
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [client, setClient] = useState("all");
  const [employee, setEmployee] = useState("all");

  const filtered = useMemo(
    () =>
      data.documents.filter((doc) => {
        const hay = [doc.title, doc.file_name, doc.description, doc.client_name, doc.employee_name].filter(Boolean).join(" ").toLowerCase();
        const tabOk =
          tab === "all" ||
          (tab === "archive" && doc.status === "archived") ||
          (tab === "verordnung" && doc.category === "verordnung") ||
          (tab === "clients" && doc.client_id) ||
          (tab === "employees" && doc.employee_id) ||
          (tab === "billing" && (doc.invoice_id || doc.billing_item_id || doc.category === "abrechnung"));

        return (
          tabOk &&
          (!q || hay.includes(q.toLowerCase())) &&
          (category === "all" || doc.category === category) &&
          (status === "all" || doc.status === status) &&
          (visibility === "all" || doc.visibility === visibility) &&
          (client === "all" || doc.client_id === client) &&
          (employee === "all" || doc.employee_id === employee)
        );
      }),
    [category, client, data.documents, employee, q, status, tab, visibility],
  );

  const stats = [
    ["Dokumente gesamt", data.stats.total],
    ["Aktive Dokumente", data.stats.active],
    ["Zur Prüfung", data.stats.pending],
    ["Archivierte Dokumente", data.stats.archived],
    ["Verordnungen", data.stats.prescriptions],
    ["Klientenbezogen", data.stats.clientRelated],
    ["Mitarbeiterbezogen", data.stats.employeeRelated],
    ["Speicher gesamt", size(data.stats.storage)],
  ];

  return (
    <motion.section className="page documents-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="documents-header">
        <div>
          <h1>Dokumente</h1>
          <p>Verwalten Sie Dokumente, Nachweise, Verordnungen und Dateien Ihres Pflegedienstes.</p>
        </div>
        <div className="documents-header-actions">
          <DocForm action={actions.uploadDocument} data={data} label="Dokument hochladen" upload />
          <button className="button secondary" disabled title="Export wird vorbereitet." type="button">
            <Download size={16} />
            Dokumente exportieren
          </button>
        </div>
      </div>

      <div className="documents-stats-grid">
        {stats.map(([label, value], index) => (
          <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
            <div className="stat-icon">
              <FileText size={18} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
          </motion.div>
        ))}
      </div>

      <div className="settings-tabs">
        {[
          ["all", "Alle Dokumente"],
          ["verordnung", "Verordnungen"],
          ["clients", "Klienten"],
          ["employees", "Mitarbeiter"],
          ["billing", "Abrechnung"],
          ["archive", "Archiv"],
        ].map(([id, label]) => (
          <button key={id} className={`settings-tab ${tab === id ? "active" : ""}`} type="button" onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <motion.div className="documents-filter-panel">
        <label>
          <Search size={16} />
          Suche
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Titel, Datei, Beschreibung, Klient, Mitarbeiter" />
        </label>
        <label>
          Kategorie
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Alle</option>
            {Object.entries(cat).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Alle</option>
            {Object.entries(st).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Sichtbarkeit
          <select value={visibility} onChange={(event) => setVisibility(event.target.value)}>
            <option value="all">Alle</option>
            {Object.entries(vis).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Klient
          <select value={client} onChange={(event) => setClient(event.target.value)}>
            <option value="all">Alle</option>
            {data.clients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Mitarbeiter
          <select value={employee} onChange={(event) => setEmployee(event.target.value)}>
            <option value="all">Alle</option>
            {data.employees.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            setQ("");
            setCategory("all");
            setStatus("all");
            setVisibility("all");
            setClient("all");
            setEmployee("all");
          }}
        >
          <FilterX size={16} />
          Zurücksetzen
        </button>
      </motion.div>

      <AnimatePresence mode="wait">
        {data.documents.length === 0 ? null : (
          <motion.div className="documents-list" key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {filtered.map((doc) => (
              <motion.article className="document-card" key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <div className="document-card-header">
                  <div>
                    <span>{doc.file_name ?? "Nicht hinterlegt"}</span>
                    <h2>
                      <File size={18} />
                      {doc.title}
                    </h2>
                  </div>
                  <div className="client-badges">
                    <span className={`document-category ${doc.category}`}>{cat[doc.category]}</span>
                    <span className={`document-status ${doc.status}`}>{st[doc.status]}</span>
                    <span className="shift-type-badge">{vis[doc.visibility]}</span>
                  </div>
                </div>
                <div className="document-details-grid">
                  <div>
                    <span>Bezug</span>
                    <strong>
                      {doc.relation} · {val(doc.client_name ?? doc.employee_name)}
                    </strong>
                  </div>
                  <div>
                    <span>Dateityp</span>
                    <strong>{val(doc.file_type?.toUpperCase())}</strong>
                  </div>
                  <div>
                    <span>Dateigröße</span>
                    <strong>{size(doc.file_size)}</strong>
                  </div>
                  <div>
                    <span>Hochgeladen von</span>
                    <strong>{val(doc.uploaded_by_name)}</strong>
                  </div>
                  <div>
                    <span>Hochgeladen am</span>
                    <strong>{new Intl.DateTimeFormat("de-DE").format(new Date(doc.uploaded_at))}</strong>
                  </div>
                  <div>
                    <span>Aktualisiert</span>
                    <strong>{new Intl.DateTimeFormat("de-DE").format(new Date(doc.updated_at))}</strong>
                  </div>
                </div>
                <div className="location-actions">
                  <details>
                    <summary>
                      <Eye size={15} />
                      Ansehen
                    </summary>
                    <div className="location-detail-panel">
                      <p>Titel: {doc.title}</p>
                      <p>Beschreibung: {val(doc.description)}</p>
                      <p>Dateiname: {val(doc.file_name)}</p>
                      <p>Kategorie: {cat[doc.category]}</p>
                      <p>Status: {st[doc.status]}</p>
                      <p>Sichtbarkeit: {vis[doc.visibility]}</p>
                      <p>Bezug: {doc.relation}</p>
                      <p>Dateityp: {val(doc.file_type)}</p>
                      <p>Dateigröße: {size(doc.file_size)}</p>
                      <p>Speicherort intern: {val(doc.file_path)}</p>
                      <SignedLink doc={doc} action={actions.getDocumentSignedUrl} label="Vorschau vorbereiten" preview />
                      <SignedLink doc={doc} action={actions.getDocumentSignedUrl} label="Download vorbereiten" />
                    </div>
                  </details>
                  <DocForm action={actions.updateDocument} data={data} doc={doc} label="Bearbeiten" />
                  <ConfirmActionDialog
                    action={actions.archiveDocument}
                    buttonIcon={<Archive size={15} />}
                    buttonLabel="Archivieren"
                    description="Bitte bestätigen Sie, dass dieses Dokument archiviert werden soll."
                    hiddenFields={[{ name: "id", value: doc.id }]}
                    title="Dokument archivieren"
                  />
                  <ConfirmActionDialog
                    action={actions.deleteDocument}
                    buttonIcon={<Trash2 size={15} />}
                    buttonLabel="Löschen"
                    description="Bitte bestätigen Sie, dass dieses Dokument gelöscht werden soll."
                    hiddenFields={[{ name: "id", value: doc.id }]}
                    title="Dokument löschen"
                  />
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
