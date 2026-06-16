import { Building2, Download, Eye, MapPin, Pencil, Users, UserRound } from "lucide-react";
import { ActionDialog, ConfirmActionDialog } from "@/components/action-dialogs";
import { LocationCreateModal } from "@/components/location-create-modal";
import {
  createLocation,
  toggleLocationStatus,
  updateLocation,
  type CompanyLocation,
  type LocationsData,
  type LocationStatus,
  type LocationType,
} from "@/lib/locations";

type LocationsPageProps = {
  data: LocationsData;
};

const locationTypeLabels: Record<LocationType, string> = {
  hauptstandort: "Hauptstandort",
  nebenstandort: "Nebenstandort",
  verwaltungsstandort: "Verwaltungsstandort",
  aussenstelle: "Außenstelle",
  einsatzgebiet: "Einsatzgebiet",
};

const statusLabels: Record<LocationStatus, string> = {
  active: "Aktiv",
  inactive: "Inaktiv",
};

function LocationFields({ location }: { location?: CompanyLocation }) {
  const isPrimary = Boolean(location?.is_primary);

  return (
    <>
      {location ? (
        <>
          <input name="id" type="hidden" value={location.id} />
          <input name="is_primary" type="hidden" value={String(location.is_primary)} />
        </>
      ) : null}
      <label>
        Standortname
        <input name="name" required defaultValue={location?.name ?? ""} />
      </label>
      <label>
        Standorttyp
        <select name="location_type" required defaultValue={location?.location_type ?? "nebenstandort"} disabled={isPrimary}>
          {Object.entries(locationTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {isPrimary ? <input name="location_type" type="hidden" value="hauptstandort" /> : null}
      </label>
      <label>
        Straße
        <input name="street" defaultValue={location?.street ?? ""} />
      </label>
      <label>
        Hausnummer
        <input name="house_number" defaultValue={location?.house_number ?? ""} />
      </label>
      <label>
        PLZ
        <input name="postal_code" required defaultValue={location?.postal_code ?? ""} />
      </label>
      <label>
        Ort
        <input name="city" required defaultValue={location?.city ?? ""} />
      </label>
      <label>
        Bundesland
        <input name="state" defaultValue={location?.state ?? ""} />
      </label>
      <label>
        Telefonnummer
        <input name="phone" defaultValue={location?.phone ?? ""} />
      </label>
      <label>
        E-Mail
        <input name="email" type="email" defaultValue={location?.email ?? ""} />
      </label>
      <label>
        Ansprechpartner vor Ort
        <input name="contact_person" defaultValue={location?.contact_person ?? ""} />
      </label>
      <label>
        Status
        <select name="status" required defaultValue={location?.status ?? "active"} disabled={isPrimary}>
          <option value="active">Aktiv</option>
          <option value="inactive">Inaktiv</option>
        </select>
        {isPrimary ? <input name="status" type="hidden" value="active" /> : null}
      </label>
      <label className="location-form-wide">
        Notizen
        <textarea name="notes" defaultValue={location?.notes ?? ""} rows={3} />
      </label>
    </>
  );
}

function LocationCard({ location }: { location: CompanyLocation }) {
  const address = [location.street, location.house_number].filter(Boolean).join(" ");
  const city = [location.postal_code, location.city].filter(Boolean).join(" ");

  return (
    <article className="location-card">
      <div className="location-card-header">
        <div>
          <div className="location-title-row">
            <h2>{location.name}</h2>
            {location.is_primary ? <span className="location-badge">Hauptstandort</span> : null}
          </div>
          <div className="location-meta">
            <span>{locationTypeLabels[location.location_type]}</span>
            <span className={`location-status ${location.status}`}>{statusLabels[location.status]}</span>
          </div>
        </div>
      </div>

      <div className="location-details-grid">
        <div>
          <span>Adresse</span>
          <strong>{address || "Keine Straße hinterlegt."}</strong>
          <p>{city || "Kein Ort hinterlegt."}</p>
        </div>
        <div>
          <span>Kontakt</span>
          <strong>{location.phone || "Keine Telefonnummer hinterlegt."}</strong>
          <p>{location.email || "Keine E-Mail hinterlegt."}</p>
        </div>
        <div>
          <span>Ansprechpartner</span>
          <strong>{location.contact_person || "Noch kein Ansprechpartner hinterlegt."}</strong>
        </div>
        <div>
          <span>Zuordnungen</span>
          <strong>{location.employee_count} Mitarbeiter</strong>
          <p>{location.client_count} Klienten</p>
        </div>
      </div>

      <div className="location-actions">
        <details>
          <summary>
            <Eye size={15} />
            Ansehen
          </summary>
          <div className="location-detail-panel">
            <p>Stammdaten, Standorttyp, Status, Kontaktinformationen und Ansprechpartner sind oben aufgeführt.</p>
            <p>Noch keine Mitarbeiter zugeordnet.</p>
            <p>{location.client_count === 0 ? "Noch keine Klienten zugeordnet." : `${location.client_count} Klienten zugeordnet.`}</p>
            <p>Noch keine PDL zugeordnet.</p>
            <p>Letzte Aktualisierung: {new Intl.DateTimeFormat("de-DE").format(new Date(location.updated_at))}</p>
          </div>
        </details>

        <ActionDialog
          action={updateLocation}
          buttonIcon={<Pencil size={15} />}
          buttonLabel="Bearbeiten"
          buttonVariant="secondary"
          formClassName="location-form"
          submitLabel="Änderungen speichern"
          title="Standort bearbeiten"
        >
          <LocationFields location={location} />
        </ActionDialog>

        {!location.is_primary ? (
          <ConfirmActionDialog
            action={toggleLocationStatus}
            buttonLabel={location.status === "active" ? "Inaktiv setzen" : "Aktiv setzen"}
            description="Bitte bestätigen Sie die Statusänderung für diesen Standort."
            hiddenFields={[
              { name: "id", value: location.id },
              { name: "status", value: location.status },
              { name: "is_primary", value: location.is_primary },
            ]}
            title="Status ändern"
          />
        ) : (
          <button className="button secondary" disabled type="button">
            Inaktiv setzen
          </button>
        )}
      </div>
    </article>
  );
}

export function LocationsPage({ data }: LocationsPageProps) {
  return (
    <section className="page locations-page">
      <div className="locations-header">
        <div>
          <h1>Standorte</h1>
          <p>Verwalten Sie alle Standorte Ihres Pflegedienstes.</p>
        </div>
        <div className="locations-header-actions">
          <LocationCreateModal action={createLocation} buttonLabel="Standort hinzufügen" submitLabel="Standort hinzufügen" />
          <button className="button secondary" disabled type="button" title="Export wird vorbereitet.">
            <Download size={16} />
            Standorte exportieren
          </button>
        </div>
      </div>

      <div className="location-stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Building2 size={18} />
          </div>
          <span>Standorte gesamt</span>
          <strong>{data.stats.total}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <MapPin size={18} />
          </div>
          <span>Aktive Standorte</span>
          <strong>{data.stats.active}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <MapPin size={18} />
          </div>
          <span>Inaktive Standorte</span>
          <strong>{data.stats.inactive}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <Users size={18} />
          </div>
          <span>Mitarbeiter zugeordnet</span>
          <strong>{data.stats.employeesAssigned}</strong>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <UserRound size={18} />
          </div>
          <span>Klienten zugeordnet</span>
          <strong>{data.stats.clientsAssigned}</strong>
        </div>
      </div>

      {data.locations.length > 0 ? (
        <div className="locations-list">
          {data.locations.map((location) => (
            <LocationCard key={location.id} location={location} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
