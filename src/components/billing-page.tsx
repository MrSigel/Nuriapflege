"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BadgeEuro, Download, Eye, FileText, FilterX, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionDialog, ConfirmActionDialog } from "@/components/action-dialogs";
import type { BillingData, BillingItem, Invoice } from "@/lib/billing";

type Props = {
  data: BillingData;
  actions: {
    createBillingItem: (fd: FormData) => void;
    updateBillingItem: (fd: FormData) => void;
    changeBillingItemStatus: (fd: FormData) => void;
    createInvoice: (fd: FormData) => void;
    updateInvoiceStatus: (fd: FormData) => void;
  };
};

const service: Record<string, string> = { grundpflege: "Grundpflege", behandlungspflege: "Behandlungspflege", hauswirtschaft: "Hauswirtschaft", betreuung: "Betreuung", beratung: "Beratung", fahrtkosten: "Fahrtkosten", sonstiges: "Sonstiges" };
const unit: Record<string, string> = { minute: "Minute", hour: "Stunde", visit: "Einsatz", piece: "Stück", flat: "Pauschale" };
const payer: Record<string, string> = { pflegekasse: "Pflegekasse", krankenkasse: "Krankenkasse", privat: "Privat", sozialamt: "Sozialamt", sonstiges: "Sonstiges" };
const itemStatus: Record<string, string> = { draft: "Entwurf", ready: "Bereit", billed: "Abgerechnet", paid: "Bezahlt", cancelled: "Storniert" };
const invoiceStatus: Record<string, string> = { draft: "Entwurf", issued: "Erstellt", cancelled: "Storniert" };
const payStatus: Record<string, string> = { open: "Offen", partially_paid: "Teilweise bezahlt", paid: "Bezahlt", overdue: "Überfällig", cancelled: "Storniert" };

function money(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number(n || 0));
}

function val(v: unknown) {
  return v && String(v).trim() ? String(v) : "Nicht hinterlegt";
}

function ItemForm({ action, data, item, label }: { action: (fd: FormData) => void; data: BillingData; item?: BillingItem; label: string }) {
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [price, setPrice] = useState(item?.unit_price ?? 0);

  return (
    <ActionDialog
      action={action}
      buttonIcon={<Plus size={16} />}
      buttonLabel={label}
      buttonVariant={item ? "secondary" : "primary"}
      formClassName="billing-form"
      hiddenFields={item ? [{ name: "id", value: item.id }] : undefined}
      submitLabel="Speichern"
      title={label}
    >
      <label>
        Klient
        <select name="client_id" required defaultValue={item?.client_id ?? ""}>
          <option value="">Klient wählen</option>
          {data.clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </label>
      <label>
        Mitarbeiter
        <select name="employee_id" defaultValue={item?.employee_id ?? ""}>
          <option value="">Kein Mitarbeiter</option>
          {data.employees.map((employee) => (
            <option key={employee.id} value={employee.id}>{employee.name}</option>
          ))}
        </select>
      </label>
      <label>
        Dienst
        <select name="shift_id" defaultValue={item?.shift_id ?? ""}>
          <option value="">Kein Dienst</option>
          {data.shifts.map((shift) => (
            <option key={shift.id} value={shift.id}>{shift.name}</option>
          ))}
        </select>
      </label>
      <label>
        Tour
        <select name="tour_id" defaultValue={item?.tour_id ?? ""}>
          <option value="">Keine Tour</option>
          {data.tours.map((tour) => (
            <option key={tour.id} value={tour.id}>{tour.name}</option>
          ))}
        </select>
      </label>
      <label>
        Tourstopp
        <select name="tour_stop_id" defaultValue={item?.tour_stop_id ?? ""}>
          <option value="">Kein Tourstopp</option>
          {data.tourStops.map((stop) => (
            <option key={stop.id} value={stop.id}>{stop.name}</option>
          ))}
        </select>
      </label>
      <label>
        Zeiteintrag
        <select name="time_entry_id" defaultValue={item?.time_entry_id ?? ""}>
          <option value="">Kein Zeiteintrag</option>
          {data.timeEntries.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.name}</option>
          ))}
        </select>
      </label>
      <label>
        Leistungsdatum
        <input name="service_date" type="date" required defaultValue={item?.service_date ?? data.today} />
      </label>
      <label>
        Service-Typ
        <select name="service_type" required defaultValue={item?.service_type ?? "sonstiges"}>
          {Object.entries(service).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </label>
      <label className="billing-form-wide">
        Beschreibung
        <input name="description" required defaultValue={item?.description ?? ""} />
      </label>
      <label>
        Menge
        <input name="quantity" type="number" step="0.01" min="0.01" required value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
      </label>
      <label>
        Einheit
        <select name="unit" required defaultValue={item?.unit ?? "flat"}>
          {Object.entries(unit).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        Einzelpreis
        <input name="unit_price" type="number" step="0.01" min="0" required value={price} onChange={(event) => setPrice(Number(event.target.value))} />
      </label>
      <div className="billing-total">
        <span>Gesamtbetrag</span>
        <strong>{money(quantity * price)}</strong>
      </div>
      <label>
        Kostenträger-Typ
        <select name="payer_type" required defaultValue={item?.payer_type ?? "sonstiges"}>
          {Object.entries(payer).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        Kostenträger-Name
        <input name="payer_name" defaultValue={item?.payer_name ?? ""} />
      </label>
      <label>
        Status
        <select name="status" required defaultValue={item?.status ?? "draft"}>
          {Object.entries(itemStatus).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </label>
      <label className="billing-form-wide">
        Notizen
        <textarea name="notes" rows={3} defaultValue={item?.notes ?? ""} />
      </label>
      {data.clients.length === 0 ? <p>Noch keine Klienten vorhanden. Bitte zuerst Klient anlegen.</p> : null}
    </ActionDialog>
  );
}

function InvoiceForm({ data, action }: { data: BillingData; action: (fd: FormData) => void }) {
  return (
    <ActionDialog action={action} buttonIcon={<FileText size={16} />} buttonLabel="Rechnungsentwurf erstellen" formClassName="billing-form" submitLabel="Rechnungsentwurf speichern" title="Rechnungsentwurf erstellen">
      <label>
        Klient
        <select name="client_id" required>
          <option value="">Klient wählen</option>
          {data.clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </label>
      <label>Zeitraum von<input name="billing_period_start" type="date" required defaultValue={data.today} /></label>
      <label>Zeitraum bis<input name="billing_period_end" type="date" required defaultValue={data.today} /></label>
      <label>Empfängername<input name="recipient_name" required /></label>
      <label>Empfänger-E-Mail<input name="recipient_email" type="email" /></label>
      <label>Fälligkeit<input name="due_date" type="date" /></label>
      <label className="billing-form-wide">Empfänger-Adresse<textarea name="recipient_address" rows={3} /></label>
      <label className="billing-form-wide">Notizen<textarea name="notes" rows={3} /></label>
      <p className="billing-form-wide">Keine abrechnungsbereiten Positionen für diesen Zeitraum vorhanden.</p>
    </ActionDialog>
  );
}

export function BillingPage({ data, actions }: Props) {
  const [tab, setTab] = useState("items");
  const [q, setQ] = useState("");
  const [client, setClient] = useState("all");
  const [status, setStatus] = useState("all");

  const filtered = useMemo(
    () =>
      data.items.filter((item) => {
        const hay = [item.client_name, item.description, item.payer_name, item.notes].filter(Boolean).join(" ").toLowerCase();
        return (!q || hay.includes(q.toLowerCase())) && (client === "all" || item.client_id === client) && (status === "all" || item.status === status);
      }),
    [client, data.items, q, status],
  );

  const stats = [
    ["Offene Positionen", data.stats.openItems],
    ["Bereit", data.stats.readyItems],
    ["Abgerechnet", data.stats.billedItems],
    ["Offene Rechnungen", data.stats.openInvoices],
    ["Bezahlte Rechnungen", data.stats.paidInvoices],
    ["Überfällig", data.stats.overdueInvoices],
    ["Umsatz Monat", money(data.stats.monthRevenue)],
    ["Offene Summe", money(data.stats.openAmount)],
  ];

  return (
    <motion.section className="page billing-page" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="billing-header">
        <div>
          <h1>Abrechnung</h1>
          <p>Verwalten Sie Leistungspositionen, Rechnungsentwürfe und Zahlungsstatus Ihres Pflegedienstes.</p>
        </div>
        <div className="billing-header-actions">
          <ItemForm action={actions.createBillingItem} data={data} label="Position anlegen" />
          <InvoiceForm data={data} action={actions.createInvoice} />
          <button className="button secondary" disabled title="Export wird vorbereitet." type="button"><Download size={16} />Abrechnung exportieren</button>
        </div>
      </div>

      <div className="billing-stats-grid">
        {stats.map(([label, value], index) => (
          <motion.div className="stat-card" key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}>
            <div className="stat-icon"><BadgeEuro size={18} /></div>
            <span>{label}</span>
            <strong>{value}</strong>
          </motion.div>
        ))}
      </div>

      <div className="settings-tabs">
        {[
          ["items", "Leistungspositionen"],
          ["invoices", "Rechnungsentwürfe"],
          ["payments", "Zahlungsübersicht"],
          ["proofs", "Abrechnungsnachweise"],
        ].map(([id, label]) => (
          <button key={id} className={`settings-tab ${tab === id ? "active" : ""}`} type="button" onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} className="billing-panel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
          {tab === "items" ? (
            <>
              <div className="billing-filter-panel">
                <label><Search size={16} />Suche<input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Klient, Beschreibung, Kostenträger, Notiz" /></label>
                <label>Klient<select value={client} onChange={(event) => setClient(event.target.value)}><option value="all">Alle</option>{data.clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Alle</option>{Object.entries(itemStatus).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
                <button className="button secondary" type="button" onClick={() => { setQ(""); setClient("all"); setStatus("all"); }}><FilterX size={16} />Zurücksetzen</button>
              </div>
              <div className="billing-list">
                {filtered.map((item) => (
                  <article className="billing-card" key={item.id}>
                    <div className="billing-card-header">
                      <div><span>{new Intl.DateTimeFormat("de-DE").format(new Date(item.service_date))}</span><h2>{item.description}</h2></div>
                      <span className={`billing-status ${item.status}`}>{itemStatus[item.status]}</span>
                    </div>
                    <div className="billing-details-grid">
                      <div><span>Klient</span><strong>{val(item.client_name)}</strong></div>
                      <div><span>Service</span><strong>{service[item.service_type]}</strong></div>
                      <div><span>Menge</span><strong>{item.quantity} {unit[item.unit]}</strong></div>
                      <div><span>Einzelpreis</span><strong>{money(item.unit_price)}</strong></div>
                      <div><span>Gesamtbetrag</span><strong>{money(item.total_amount)}</strong></div>
                      <div><span>Kostenträger</span><strong>{payer[item.payer_type]} · {val(item.payer_name)}</strong></div>
                    </div>
                    <div className="location-actions">
                      <details><summary><Eye size={15} />Ansehen</summary><div className="location-detail-panel"><p>Beschreibung: {item.description}</p><p>Notiz: {val(item.notes)}</p></div></details>
                      <ItemForm action={actions.updateBillingItem} data={data} item={item} label="Bearbeiten" />
                      {(["ready", "billed", "cancelled"] as const).map((next) => (
                        <ConfirmActionDialog
                          action={actions.changeBillingItemStatus}
                          buttonLabel={`${itemStatus[next]} markieren`}
                          description="Bitte bestätigen Sie die Statusänderung für diese Leistungsposition."
                          hiddenFields={[{ name: "id", value: item.id }, { name: "status", value: next }]}
                          key={next}
                          title="Status ändern"
                        />
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : tab === "invoices" ? (
            <InvoiceList invoices={data.invoices} actions={actions} />
          ) : tab === "payments" ? (
            <InvoiceList invoices={data.invoices} actions={actions} payments />
          ) : (
            <Proofs items={data.items} />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
}

function InvoiceList({ invoices, actions, payments = false }: { invoices: Invoice[]; actions: Props["actions"]; payments?: boolean }) {
  return (
    <div className="billing-list">
      {invoices.map((invoice) => (
        <article className="billing-card" key={invoice.id}>
          <div className="billing-card-header">
            <div><span>{invoice.invoice_number ?? "Nicht hinterlegt"}</span><h2>{val(invoice.recipient_name)}</h2></div>
            <span className={`billing-status ${invoice.payment_status}`}>{payments ? payStatus[invoice.payment_status] : invoiceStatus[invoice.status]}</span>
          </div>
          <div className="billing-details-grid">
            <div><span>Klient</span><strong>{val(invoice.client_name)}</strong></div>
            <div><span>Zeitraum</span><strong>{val(invoice.billing_period_start)} - {val(invoice.billing_period_end)}</strong></div>
            <div><span>Summe</span><strong>{money(invoice.total_amount)}</strong></div>
            <div><span>Fälligkeit</span><strong>{val(invoice.due_date)}</strong></div>
          </div>
          <div className="location-actions">
            {(["issued", "cancelled"] as const).map((next) => (
              <ConfirmActionDialog
                action={actions.updateInvoiceStatus}
                buttonLabel={invoiceStatus[next]}
                description="Bitte bestätigen Sie die Statusänderung für diese Rechnung."
                hiddenFields={[{ name: "id", value: invoice.id }, { name: "field", value: "status" }, { name: "value", value: next }]}
                key={next}
                title="Rechnungsstatus ändern"
              />
            ))}
            {(["paid", "partially_paid", "overdue", "cancelled"] as const).map((next) => (
              <ConfirmActionDialog
                action={actions.updateInvoiceStatus}
                buttonLabel={payStatus[next]}
                description="Bitte bestätigen Sie die Zahlungsstatusänderung für diese Rechnung."
                hiddenFields={[{ name: "id", value: invoice.id }, { name: "field", value: "payment_status" }, { name: "value", value: next }]}
                key={next}
                title="Zahlungsstatus ändern"
              />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function Proofs({ items }: { items: BillingItem[] }) {
  const rows = Object.values(
    items.reduce<Record<string, { client: string; count: number; sum: number; status: string }>>((acc, item) => {
      const key = item.client_id;
      acc[key] ??= { client: item.client_name ?? "Nicht hinterlegt", count: 0, sum: 0, status: item.status };
      acc[key].count++;
      acc[key].sum += Number(item.total_amount);
      return acc;
    }, {}),
  );

  return rows.length ? (
    <div className="billing-list">
      {rows.map((row) => (
        <div className="billing-card" key={row.client}>
          <strong>{row.client}</strong>
          <span>{row.count} Positionen · {money(row.sum)} · {itemStatus[row.status]}</span>
          <span>Exportstatus: Nicht hinterlegt</span>
        </div>
      ))}
    </div>
  ) : (
    <div className="empty-state"><strong>Noch keine Abrechnungsnachweise vorhanden.</strong></div>
  );
}
