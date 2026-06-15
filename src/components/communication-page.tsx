"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Archive,
  ArrowLeft,
  Bell,
  FilterX,
  Inbox,
  MessageSquare,
  Search,
  Send,
  UserPlus,
  Users,
} from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import type { CommunicationData, Conversation, ConversationType } from "@/lib/communication";

type Props = {
  data: CommunicationData;
  actions: {
    createDirectConversation: (fd: FormData) => void;
    createGroupConversation: (fd: FormData) => void;
    sendMessage: (fd: FormData) => void;
    markConversationRead: (fd: FormData) => void;
    archiveConversation: (fd: FormData) => void;
    addParticipant: (fd: FormData) => void;
    removeParticipant: (fd: FormData) => void;
  };
};

const typeLabels: Record<ConversationType, string> = {
  direct: "Einzelchat",
  group: "Gruppenchat",
  announcement: "Ankundigung",
  support: "Support",
};

const typeIcons: Record<ConversationType, typeof MessageSquare> = {
  direct: MessageSquare,
  group: Users,
  announcement: Bell,
  support: Inbox,
};

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatDateTime(value?: string | null) {
  if (!value) return "Nicht hinterlegt";
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "full" }).format(new Date(value));
}

function ActionMenu({
  summary,
  icon,
  children,
  variant = "primary",
}: {
  summary: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <details className="communication-action-menu">
      <summary className={`button ${variant === "secondary" ? "secondary" : ""}`}>
        {icon}
        {summary}
      </summary>
      <motion.div className="communication-action-popover" initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
        {children}
      </motion.div>
    </details>
  );
}

function NewDirect({ data, action }: { data: CommunicationData; action: (fd: FormData) => void }) {
  const hasRecipients = data.users.some((u) => u.id !== data.currentUserId);

  return (
    <ActionMenu summary="Neue Nachricht" icon={<MessageSquare size={16} />}>
      <form action={action} className="communication-form">
        <header className="communication-form-header">
          <strong>Neue Nachricht</strong>
          <span>Starten Sie einen internen Einzelchat.</span>
        </header>
        <label>
          Empfanger
          <select name="recipient_id" required disabled={!hasRecipients}>
            <option value="">Empfanger wahlen</option>
            {data.users
              .filter((u) => u.id !== data.currentUserId)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
        </label>
        <label className="communication-form-wide">
          Nachricht
          <textarea name="body" required rows={5} />
        </label>
        {!hasRecipients ? <p>Noch keine Mitarbeitenden vorhanden. Bitte zuerst Mitarbeitende anlegen.</p> : null}
        <button className="button communication-form-wide" type="submit" disabled={!hasRecipients}>
          Nachricht senden
        </button>
      </form>
    </ActionMenu>
  );
}

function NewGroup({ data, action }: { data: CommunicationData; action: (fd: FormData) => void }) {
  const users = data.users.filter((u) => u.id !== data.currentUserId);

  return (
    <ActionMenu summary="Gruppe erstellen" icon={<Users size={16} />} variant="secondary">
      <form action={action} className="communication-form">
        <header className="communication-form-header">
          <strong>Gruppe erstellen</strong>
          <span>Erstellen Sie eine Unterhaltung fur mehrere Teilnehmer.</span>
        </header>
        <label className="communication-form-wide">
          Gruppentitel
          <input name="title" required />
        </label>
        <fieldset className="communication-form-wide communication-participant-picker">
          <legend>Teilnehmer</legend>
          {users.map((u) => (
            <label key={u.id} className="checkbox-row">
              <input type="checkbox" name="participant_ids" value={u.id} />
              <span>{u.name}</span>
            </label>
          ))}
        </fieldset>
        <label className="communication-form-wide">
          Erste Nachricht
          <textarea name="body" rows={4} />
        </label>
        <button className="button communication-form-wide" type="submit">
          Gruppe erstellen
        </button>
      </form>
    </ActionMenu>
  );
}

function ConversationButton({ c, active, onClick }: { c: Conversation; active: boolean; onClick: () => void }) {
  const Icon = typeIcons[c.conversation_type];
  const title = c.title || typeLabels[c.conversation_type];
  const initials = getInitials(c.participants[0]?.name || title) || "N";

  return (
    <motion.button
      className={`conversation-item ${active ? "active" : ""} ${c.unread_count > 0 ? "unread" : ""}`}
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      layout
    >
      <span className="conversation-avatar">{initials}</span>
      <span className="conversation-main">
        <span className="conversation-title-row">
          <strong>{title}</strong>
          <small>{formatDateTime(c.last_message_at)}</small>
        </span>
        <span className="conversation-preview">{c.last_preview || "Keine Nachrichten"}</span>
        <span className="conversation-meta-row">
          <span className={`conversation-type-badge type-${c.conversation_type}`}>
            <Icon size={13} />
            {typeLabels[c.conversation_type]}
          </span>
          <span>{c.participants.length} Teilnehmer</span>
          <span>{c.status === "archived" ? "Archiviert" : "Aktiv"}</span>
        </span>
      </span>
      {c.unread_count > 0 ? <b className="conversation-unread">{c.unread_count}</b> : null}
    </motion.button>
  );
}

export function CommunicationPage({ data, actions }: Props) {
  const [activeId, setActiveId] = useState(data.conversations[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("active");
  const [unread, setUnread] = useState("all");
  const [participant, setParticipant] = useState("all");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const active = data.conversations.find((c) => c.id === activeId) ?? null;
  const filtered = useMemo(
    () =>
      data.conversations.filter((c) => {
        const hay = [c.title, c.last_preview, ...c.participants.map((p) => p.name), ...c.messages.map((m) => m.body)]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return (
          (!query || hay.includes(query.toLowerCase())) &&
          (type === "all" || c.conversation_type === type) &&
          (status === "all" || c.status === status) &&
          (unread === "all" || c.unread_count > 0) &&
          (participant === "all" || c.participants.some((p) => p.id === participant))
        );
      }),
    [data.conversations, participant, query, status, type, unread],
  );

  const stats = [
    ["Aktive Konversationen", data.stats.active, MessageSquare],
    ["Ungelesene Nachrichten", data.stats.unread, Bell],
    ["Einzelchats", data.stats.direct, MessageSquare],
    ["Gruppenchats", data.stats.group, Users],
    ["Ankundigungen", data.stats.announcements, Bell],
    ["Archivierte Konversationen", data.stats.archived, Archive],
  ] as const;

  function open(c: Conversation) {
    setActiveId(c.id);
    setMobileChatOpen(true);
    setDraft("");
    const fd = new FormData();
    fd.set("conversation_id", c.id);
    actions.markConversationRead(fd);
  }

  function resetFilters() {
    setQuery("");
    setType("all");
    setStatus("active");
    setUnread("all");
    setParticipant("all");
  }

  return (
    <motion.section className="page communication-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="communication-header">
        <div>
          <h1>Kommunikation</h1>
          <p>Interne Nachrichten, Teamkommunikation und Hinweise Ihres Pflegedienstes.</p>
        </div>
        <div className="communication-header-actions">
          <NewDirect data={data} action={actions.createDirectConversation} />
          <NewGroup data={data} action={actions.createGroupConversation} />
        </div>
      </div>

      <div className="communication-stats-grid">
        {stats.map(([label, value, Icon], index) => (
          <motion.div className="stat-card communication-stat-card" key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}>
            <div className="stat-icon">
              <Icon size={18} />
            </div>
            <span>{label}</span>
            <strong>{value}</strong>
          </motion.div>
        ))}
      </div>

      {data.conversations.length === 0 ? null : (
        <motion.div className="communication-shell" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <aside className={`conversation-column ${mobileChatOpen ? "mobile-hidden" : ""}`}>
            <motion.div className="conversation-tools" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <label className="conversation-search">
                <Search size={16} />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Suchen" />
              </label>
              <div className="conversation-filter-grid">
                <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Typ">
                  <option value="all">Alle Typen</option>
                  {Object.entries(typeLabels).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
                <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
                  <option value="all">Alle Status</option>
                  <option value="active">Aktiv</option>
                  <option value="archived">Archiviert</option>
                </select>
                <select value={unread} onChange={(e) => setUnread(e.target.value)} aria-label="Ungelesen">
                  <option value="all">Alle</option>
                  <option value="unread">Ungelesen</option>
                </select>
                <select value={participant} onChange={(e) => setParticipant(e.target.value)} aria-label="Teilnehmer">
                  <option value="all">Alle Teilnehmer</option>
                  {data.users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <button className="conversation-reset" type="button" onClick={resetFilters}>
                <FilterX size={15} />
                Zurucksetzen
              </button>
            </motion.div>

            <div className="conversation-list">
              <AnimatePresence initial={false}>
                {filtered.map((c) => (
                  <ConversationButton key={c.id} c={c} active={active?.id === c.id} onClick={() => open(c)} />
                ))}
              </AnimatePresence>
              {filtered.length === 0 ? (
                <motion.div className="conversation-list-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  Keine Konversationen gefunden.
                </motion.div>
              ) : null}
            </div>
          </aside>

          <div className={`chat-column ${!mobileChatOpen ? "mobile-hidden" : ""}`}>
            <AnimatePresence mode="wait">
              {active ? (
                <motion.section className="chat-panel" key={active.id} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2 }}>
                  <header className="chat-header">
                    <button className="chat-back" type="button" onClick={() => setMobileChatOpen(false)}>
                      <ArrowLeft size={17} />
                    </button>
                    <div className="chat-header-main">
                      <div className="chat-title-row">
                        <h2>{active.title || typeLabels[active.conversation_type]}</h2>
                        <span className={`conversation-type-badge type-${active.conversation_type}`}>{typeLabels[active.conversation_type]}</span>
                      </div>
                      <p>
                        {active.participants.length} Teilnehmer · {active.status === "archived" ? "Archiviert" : "Aktiv"}
                      </p>
                    </div>
                    <form action={actions.archiveConversation}>
                      <input name="conversation_id" type="hidden" value={active.id} />
                      <button className="button secondary archive-button" type="submit">
                        <Archive size={16} />
                        Archivieren
                      </button>
                    </form>
                  </header>

                  <div className="message-list">
                    {active.messages.length === 0 ? (
                      <motion.div className="chat-empty-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        Noch keine Nachrichten in dieser Unterhaltung.
                      </motion.div>
                    ) : null}
                    {active.messages.map((m, index) => {
                      const day = formatDay(m.created_at);
                      const previous = active.messages[index - 1] ? formatDay(active.messages[index - 1].created_at) : "";
                      return (
                        <Fragment key={m.id}>
                          {day !== previous ? <div className="message-date-divider">{day}</div> : null}
                          <motion.article className={`message-bubble ${m.is_own ? "own" : ""} ${m.message_type}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <strong>
                              {m.sender_name || "System"}
                              <span>
                                {m.sender_role}
                                {m.sender_code ? ` · ${m.sender_code}` : ""}
                              </span>
                            </strong>
                            <p>{m.body}</p>
                            <small>{formatDateTime(m.created_at)}</small>
                          </motion.article>
                        </Fragment>
                      );
                    })}
                  </div>

                  <form action={actions.sendMessage} className="message-form" onSubmit={() => setDraft("")}>
                    <input name="conversation_id" type="hidden" value={active.id} />
                    <textarea name="body" required placeholder="Nachricht schreiben" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} />
                    <button className="button" type="submit" disabled={!draft.trim()}>
                      <Send size={16} />
                      Senden
                    </button>
                  </form>

                  {active.conversation_type === "group" ? (
                    <div className="participants-panel">
                      <h3>Teilnehmer</h3>
                      <div className="participant-chip-list">
                        {active.participants.map((p) => (
                          <div key={p.id} className="participant-chip">
                            <span>
                              {p.name} · {p.role}
                              {p.staff_code ? ` · ${p.staff_code}` : ""}
                            </span>
                            <form action={actions.removeParticipant}>
                              <input name="conversation_id" type="hidden" value={active.id} />
                              <input name="user_id" type="hidden" value={p.id} />
                              <button className="button secondary" type="submit">
                                Entfernen
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                      <form action={actions.addParticipant} className="participant-add">
                        <input name="conversation_id" type="hidden" value={active.id} />
                        <select name="user_id" required>
                          <option value="">Teilnehmer wahlen</option>
                          {data.users
                            .filter((u) => !active.participants.some((p) => p.id === u.id))
                            .map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                        </select>
                        <button className="button secondary" type="submit">
                          <UserPlus size={16} />
                          Hinzufugen
                        </button>
                      </form>
                    </div>
                  ) : null}
                </motion.section>
              ) : (
                <motion.div className="communication-empty-state chat-empty-state" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                  <MessageSquare size={34} />
                  <strong>Keine Konversation ausgewahlt</strong>
                  <p>Wahlen Sie links eine Unterhaltung aus oder starten Sie eine neue Nachricht.</p>
                  <NewDirect data={data} action={actions.createDirectConversation} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
