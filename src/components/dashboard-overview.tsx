"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare,
  Clock,
  FileUp,
  FolderOpen,
  MessageCircle,
  Newspaper,
  Plus,
  Receipt,
  Route,
  Stethoscope,
  Timer,
  UserRound,
  Users,
} from "lucide-react";
import type { DashboardOverviewData } from "@/lib/dashboard-overview";

type DashboardOverviewProps = {
  data: DashboardOverviewData;
  role: "inhaber" | "pdl" | "verwaltung" | "mitarbeiter" | "admin";
};

const statIcons = {
  clients_total: Stethoscope,
  employees_total: Users,
  today_shifts: CalendarDays,
  today_tours: Route,
  assigned_clients: UserRound,
  open_tasks: CheckSquare,
  open_documents: FolderOpen,
  new_messages: MessageCircle,
  open_billing: Receipt,
  open_qm: FileUp,
  open_applicants: BriefcaseBusiness,
  open_website_leads: Newspaper,
  tracked_time_today: Timer,
};

export function DashboardOverview({ data, role }: DashboardOverviewProps) {
  const messagesHref = role === "mitarbeiter" ? "/mitarbeiter/kommunikation" : "/dashboard/kommunikation";

  return (
    <section className="page overview-page">
      <div className="page-header">
        <h1>{role === "mitarbeiter" ? "Mein Dashboard" : "Dashboard"}</h1>
        <p>Aktuelle Zahlen, Schnellaktionen, neue Nachrichten und News von Nuria Pflege.</p>
      </div>

      <section className="overview-section" aria-labelledby="overview-stats">
        <h2 id="overview-stats">Zahlen</h2>
        <div className="stats-grid">
          {data.stats.map((stat, index) => {
            const Icon = statIcons[stat.key] ?? Clock;

            return (
              <motion.article
                animate={{ opacity: 1, y: 0 }}
                className="stat-card"
                initial={{ opacity: 0, y: 8 }}
                key={stat.key}
                transition={{ delay: index * 0.025, duration: 0.18, ease: "easeOut" }}
              >
                <motion.div
                  animate={{ scale: 1, rotate: 0 }}
                  className="stat-icon"
                  initial={{ scale: 0.92, rotate: -3 }}
                  transition={{ delay: index * 0.025, duration: 0.2, ease: "easeOut" }}
                >
                  <Icon size={18} />
                </motion.div>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </motion.article>
            );
          })}
        </div>
      </section>

      <section className="overview-section" aria-labelledby="overview-actions">
        <h2 id="overview-actions">Schnellaktionen</h2>
        <div className="quick-actions">
          {data.quickActions.map((action) => (
            <Link className="quick-action" href={action.href} key={action.href}>
              <Plus size={16} />
              <span>{action.label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="overview-section" aria-labelledby="overview-messages">
        <div className="section-heading-row">
          <h2 id="overview-messages">Neue Nachrichten</h2>
          <Link className="text-link" href={messagesHref}>
            Nachrichten öffnen
            <ArrowRight size={15} />
          </Link>
        </div>
        {data.messages.length > 0 ? (
          <div className="overview-list">
            {data.messages.map((message) => (
              <article className="overview-list-item" key={message.id}>
                <div className="list-icon">
                  <MessageCircle size={17} />
                </div>
                <div>
                  <div className="list-title-row">
                    <strong>{message.sender}</strong>
                    <span>{message.time}</span>
                  </div>
                  <p>{message.roleOrCode}</p>
                  <p>{message.preview}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="compact-empty">Keine neuen Nachrichten vorhanden.</div>
        )}
      </section>

      <section className="overview-section" aria-labelledby="overview-news">
        <div className="section-heading-row">
          <h2 id="overview-news">News von Nuria Pflege</h2>
          <span className="muted-label">Nuria Pflege</span>
        </div>
        {data.news.length > 0 ? (
          <div className="overview-list">
            {data.news.map((item) => (
              <article className="overview-list-item" key={item.id}>
                <div className="list-icon">
                  <Newspaper size={17} />
                </div>
                <div>
                  <div className="list-title-row">
                    <strong>{item.title}</strong>
                    <span>{item.date}</span>
                  </div>
                  <p>{item.preview}</p>
                  <button className="inline-button" type="button">
                    Mehr anzeigen
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="compact-empty">Keine neuen Nuria-News vorhanden.</div>
        )}
      </section>
    </section>
  );
}
