import { AlertCircle } from "lucide-react";
import { pricingModel, tenantAccessModel, type DashboardRoute } from "@/lib/nuria-config";

type DashboardPageProps = {
  route: DashboardRoute;
  context: "admin" | "company" | "staff";
};

export function DashboardPage({ route, context }: DashboardPageProps) {
  const Icon = route.icon;
  const showPayment = route.path === "/dashboard/zahlung-tarif";
  const showCompliance = route.path.includes("compliance") || route.path.includes("systemprotokolle");

  return (
    <section className="page">
      <div className="page-header">
        <div className="eyebrow">{context === "admin" ? "Systemweit" : context === "staff" ? "Persönlich" : "Mandant"}</div>
        <h1>{route.title}</h1>
        <p>{route.description}</p>
      </div>

      <div className="grid two">
        <div className="card">
          <div className="card-title">
            <Icon size={19} />
            Arbeitsbereich
          </div>
          <p>{route.restricted ?? "Die Seite ist für die berechtigte Rolle vorbereitet."}</p>
        </div>
        <div className="card">
          <div className="card-title">
            <AlertCircle size={19} />
            Zugriff
          </div>
          <p>
            {context === "admin"
              ? "Admin-Zugriff ist systemweit vorgesehen."
              : context === "staff"
                ? "Zugriff ist auf eigene oder zugewiesene Bereiche begrenzt."
                : "Zugriff ist auf den eigenen Pflegedienst begrenzt."}
          </p>
        </div>
      </div>

      {showPayment ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Tarifstruktur</div>
          <div className="status-list">
            <div className="status-row">
              <span>Paket-ID</span>
              <span className="badge">{pricingModel.packageId}</span>
            </div>
            <div className="status-row">
              <span>Monatlicher Basispreis</span>
              <span className="badge">{pricingModel.monthlyPriceEuro} EUR</span>
            </div>
            {pricingModel.intervals.map((interval) => (
              <div className="status-row" key={interval.label}>
                <span>{interval.label}</span>
                <span className="badge">{interval.discountPercent} % Rabatt</span>
              </div>
            ))}
            <div className="status-row">
              <span>Statuswerte vorbereitet</span>
              <span className="badge">{pricingModel.paymentStatuses.length}</span>
            </div>
          </div>
        </div>
      ) : null}

      {showCompliance ? (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">Protokollierbare Ereignisse</div>
          <div className="status-list">
            {tenantAccessModel.auditReadyEvents.map((event) => (
              <div className="status-row" key={event}>
                <span>{event}</span>
                <span className="badge">vorbereitet</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="empty-state">
        <strong>{route.emptyText}</strong>
        <p>Es werden keine Demo-Daten, Mock-Daten oder Beispielinhalte angezeigt.</p>
      </div>
    </section>
  );
}
