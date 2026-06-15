"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArrowLeft, Bell, FilterX, Inbox, MessageSquare, Paperclip, Search, Send, Users } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Profile = { userId: string; companyId: string };
type Participant = { conversation_id: string; user_id: string; role: string | null; last_read_at: string | null; is_muted: boolean | null };
type UserRef = { id: string; first_name: string | null; last_name: string | null; role: string | null; staff_code: string | null };
type Conversation = { id: string; company_id: string; title: string | null; conversation_type: string; status: string; created_by: string | null; last_message_at: string | null; created_at: string; updated_at: string; archived_at: string | null; participants: UserRef[]; messages: Message[]; unread: number; preview: string | null };
type Message = { id: string; company_id: string; conversation_id: string; sender_id: string | null; body: string; message_type: string; created_at: string; updated_at: string | null; deleted_at: string | null };
type TabKey = "all" | "unread" | "team" | "handover" | "support" | "archive";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "all", label: "Alle" },
  { key: "unread", label: "Ungelesen" },
  { key: "team", label: "Team" },
  { key: "handover", label: "Übergaben" },
  { key: "support", label: "Support" },
  { key: "archive", label: "Archiv" },
];

const typeLabels: Record<string, string> = {
  direct: "Direktchat",
  group: "Gruppe",
  team: "Team",
  support: "Support",
  handover: "Übergabe",
  tour: "Tour",
  client_related: "Patient/Klient",
  announcement: "Ankündigung",
};

function nameOf(user?: UserRef | null) {
  if (!user) return "System";
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || "Ohne Namen";
}
function initials(value: string) { return value.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "N"; }
function formatDateTime(value?: string | null) { return value ? new Intl.DateTimeFormat("de-DE", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Nicht hinterlegt"; }
function formatDay(value: string) { return new Intl.DateTimeFormat("de-DE", { dateStyle: "full" }).format(new Date(value)); }

export function StaffCommunicationPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [users, setUsers] = useState<UserRef[]>([]);
  const [activeId, setActiveId] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) { setError("Login ist aktuell nicht verfügbar."); setLoading(false); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.assign("/login"); return; }
    const { data: profileRow } = await supabase.from("profiles").select("company_id, role").eq("id", user.id).maybeSingle();
    if (!profileRow?.company_id || !["mitarbeiter", "pflegefachkraft"].includes(profileRow.role)) { setError("Diese Seite ist für Ihr Benutzerprofil nicht freigegeben."); setLoading(false); return; }

    const { data: ownParts } = await supabase.from("conversation_participants").select("conversation_id, user_id, role, last_read_at, is_muted").eq("company_id", profileRow.company_id).eq("user_id", user.id);
    const conversationIds = ((ownParts ?? []) as Participant[]).map((part) => part.conversation_id);
    if (conversationIds.length === 0) {
      setProfile({ companyId: profileRow.company_id, userId: user.id });
      setConversations([]);
      setUsers([]);
      setLoading(false);
      return;
    }
    const [{ data: convRows }, { data: partRows }, { data: messageRows }] = await Promise.all([
      supabase.from("conversations").select("id, company_id, title, conversation_type, status, created_by, last_message_at, created_at, updated_at, archived_at").eq("company_id", profileRow.company_id).in("id", conversationIds).order("last_message_at", { ascending: false, nullsFirst: false }),
      supabase.from("conversation_participants").select("conversation_id, user_id, role, last_read_at, is_muted").eq("company_id", profileRow.company_id).in("conversation_id", conversationIds),
      supabase.from("messages").select("id, company_id, conversation_id, sender_id, body, message_type, created_at, updated_at, deleted_at").eq("company_id", profileRow.company_id).in("conversation_id", conversationIds).is("deleted_at", null).order("created_at", { ascending: true }),
    ]);
    const participants = (partRows ?? []) as Participant[];
    const userIds = Array.from(new Set(participants.map((part) => part.user_id).filter(Boolean)));
    const { data: userRows } = userIds.length ? await supabase.from("profiles").select("id, first_name, last_name, role, staff_code").eq("company_id", profileRow.company_id).in("id", userIds) : { data: [] };
    const userMap = new Map(((userRows ?? []) as UserRef[]).map((item) => [item.id, item]));
    const ownRead = new Map(((ownParts ?? []) as Participant[]).map((part) => [part.conversation_id, part.last_read_at]));
    const messagesByConv = new Map<string, Message[]>();
    for (const message of (messageRows ?? []) as Message[]) messagesByConv.set(message.conversation_id, [...(messagesByConv.get(message.conversation_id) ?? []), message]);
    const participantsByConv = new Map<string, UserRef[]>();
    for (const part of participants) {
      const item = userMap.get(part.user_id);
      if (item) participantsByConv.set(part.conversation_id, [...(participantsByConv.get(part.conversation_id) ?? []), item]);
    }
    const normalized = ((convRows ?? []) as Omit<Conversation, "participants" | "messages" | "unread" | "preview">[]).map((conv) => {
      const messages = messagesByConv.get(conv.id) ?? [];
      const last = messages.at(-1) ?? null;
      const read = ownRead.get(conv.id);
      return { ...conv, participants: participantsByConv.get(conv.id) ?? [], messages, preview: last?.body ?? null, unread: messages.filter((message) => message.sender_id !== user.id && (!read || message.created_at > read)).length };
    });
    setProfile({ companyId: profileRow.company_id, userId: user.id });
    setUsers((userRows ?? []) as UserRef[]);
    setConversations(normalized);
    setActiveId((current) => current && normalized.some((item) => item.id === current) ? current : normalized[0]?.id ?? "");
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const active = conversations.find((item) => item.id === activeId) ?? null;
  const filtered = useMemo(() => conversations.filter((conv) => {
    if (tab === "unread" && conv.unread === 0) return false;
    if (tab === "team" && !["team", "group"].includes(conv.conversation_type)) return false;
    if (tab === "handover" && conv.conversation_type !== "handover") return false;
    if (tab === "support" && conv.conversation_type !== "support") return false;
    if (tab === "archive" && conv.status !== "archived") return false;
    if (tab !== "archive" && conv.status === "archived") return false;
    const haystack = [conv.title, conv.preview, typeLabels[conv.conversation_type], ...conv.participants.map(nameOf)].join(" ").toLowerCase();
    return !query || haystack.includes(query.toLowerCase());
  }), [conversations, query, tab]);

  const stats = [
    ["Ungelesen", conversations.reduce((sum, item) => sum + item.unread, 0), Bell],
    ["Aktive Chats", conversations.filter((item) => item.status !== "archived").length, MessageSquare],
    ["Teamnachrichten", conversations.filter((item) => ["team", "group"].includes(item.conversation_type)).length, Users],
    ["Übergaben", conversations.filter((item) => item.conversation_type === "handover").length, Inbox],
    ["Heute gesendet", conversations.reduce((sum, item) => sum + item.messages.filter((message) => message.sender_id === profile?.userId && message.created_at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length, 0), Send],
    ["Anhänge", conversations.reduce((sum, item) => sum + item.messages.filter((message) => ["image", "file"].includes(message.message_type)).length, 0), Paperclip],
  ] as const;

  async function openConversation(conv: Conversation) {
    setActiveId(conv.id);
    setMobileChatOpen(true);
    setDraft("");
    if (!profile) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.from("conversation_participants").update({ last_read_at: new Date().toISOString() }).eq("company_id", profile.companyId).eq("conversation_id", conv.id).eq("user_id", profile.userId);
    setConversations((current) => current.map((item) => item.id === conv.id ? { ...item, unread: 0 } : item));
  }

  async function sendMessage() {
    if (!profile || !active || !draft.trim()) return;
    const isParticipant = active.participants.some((participant) => participant.id === profile.userId);
    if (!isParticipant) { setNotice("Sie haben keinen Zugriff auf diese Konversation."); return; }
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setSending(true);
    const now = new Date().toISOString();
    const body = draft.trim();
    const { data, error: messageError } = await supabase.from("messages").insert({ company_id: profile.companyId, conversation_id: active.id, sender_id: profile.userId, body, message_type: "text" }).select("id, company_id, conversation_id, sender_id, body, message_type, created_at, updated_at, deleted_at").single();
    if (messageError) { setNotice("Nachricht konnte nicht gesendet werden."); setSending(false); return; }
    await supabase.from("conversations").update({ last_message_at: now }).eq("company_id", profile.companyId).eq("id", active.id);
    await supabase.from("conversation_participants").update({ last_read_at: now }).eq("company_id", profile.companyId).eq("conversation_id", active.id).eq("user_id", profile.userId);
    setConversations((current) => current.map((conv) => conv.id === active.id ? { ...conv, last_message_at: now, preview: body, messages: [...conv.messages, data as Message] } : conv));
    setDraft("");
    setSending(false);
  }

  return (
    <motion.section className="page communication-page staff-communication-page" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
      <div className="communication-header">
        <div><h1>Kommunikation</h1><p>Interne Nachrichten und Übergaben.</p></div>
        <div className="communication-header-actions"><button className="button secondary" disabled title="Neue Nachricht wird vorbereitet." type="button"><MessageSquare size={16} />Neue Nachricht wird vorbereitet.</button></div>
      </div>
      {notice ? <motion.div className="auth-message success" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>{notice}</motion.div> : null}
      <div className="communication-stats-grid">{stats.map(([label, value, Icon], index) => <motion.div className="stat-card communication-stat-card" key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.035 }}><div className="stat-icon"><Icon size={18} /></div><span>{label}</span><strong>{value}</strong></motion.div>)}</div>
      <div className="settings-tabs staff-tabs">{tabs.map((item) => <motion.button key={item.key} className={`settings-tab ${tab === item.key ? "active" : ""}`} type="button" onClick={() => setTab(item.key)} whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}>{item.label}</motion.button>)}</div>
      {error ? <motion.div className="empty-state"><strong>{error}</strong></motion.div> : loading ? <motion.div className="empty-state"><strong>Nachrichten werden geladen.</strong></motion.div> : conversations.length === 0 ? <motion.div className="empty-state" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><strong>Noch keine Nachrichten vorhanden.</strong><p>Sobald Sie an einer internen Konversation beteiligt sind, erscheint sie hier.</p></motion.div> : (
        <motion.div className="communication-shell" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <aside className={`conversation-column ${mobileChatOpen ? "mobile-hidden" : ""}`}>
            <motion.div className="conversation-tools" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <label className="conversation-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Suchen" /></label>
              <button className="conversation-reset" type="button" onClick={() => setQuery("")}><FilterX size={15} />Zurücksetzen</button>
            </motion.div>
            <div className="conversation-list"><AnimatePresence initial={false}>{filtered.map((conv) => {
              const title = conv.title || typeLabels[conv.conversation_type] || "Konversation";
              return <motion.button className={`conversation-item ${active?.id === conv.id ? "active" : ""} ${conv.unread > 0 ? "unread" : ""}`} key={conv.id} type="button" onClick={() => openConversation(conv)} whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} layout>
                <span className="conversation-avatar">{initials(conv.participants.find((item) => item.id !== profile?.userId) ? nameOf(conv.participants.find((item) => item.id !== profile?.userId)) : title)}</span>
                <span className="conversation-main"><span className="conversation-title-row"><strong>{title}</strong><small>{formatDateTime(conv.last_message_at)}</small></span><span className="conversation-preview">{conv.preview || "Keine Nachrichten"}</span><span className="conversation-meta-row"><span className={`conversation-type-badge type-${conv.conversation_type}`}>{typeLabels[conv.conversation_type] ?? conv.conversation_type}</span><span>{conv.participants.map(nameOf).join(", ")}</span></span></span>
                {conv.unread > 0 ? <b className="conversation-unread">{conv.unread}</b> : null}
              </motion.button>;
            })}</AnimatePresence>{filtered.length === 0 ? <motion.div className="conversation-list-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Keine Konversationen gefunden.</motion.div> : null}</div>
          </aside>
          <div className={`chat-column ${!mobileChatOpen ? "mobile-hidden" : ""}`}>
            <AnimatePresence mode="wait">{active ? <motion.section className="chat-panel" key={active.id} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.2 }}>
              <header className="chat-header"><button className="chat-back" type="button" onClick={() => setMobileChatOpen(false)}><ArrowLeft size={17} /></button><div className="chat-header-main"><div className="chat-title-row"><h2>{active.title || typeLabels[active.conversation_type]}</h2><span className={`conversation-type-badge type-${active.conversation_type}`}>{typeLabels[active.conversation_type] ?? active.conversation_type}</span></div><p>{active.participants.map(nameOf).join(", ")}</p></div><button className="button secondary archive-button" disabled type="button"><Archive size={16} />Archiv</button></header>
              <div className="message-list">{active.messages.length === 0 ? <motion.div className="chat-empty-note" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>Noch keine Nachrichten in dieser Unterhaltung.</motion.div> : null}{active.messages.map((message, index) => {
                const sender = users.find((item) => item.id === message.sender_id);
                const day = formatDay(message.created_at);
                const previous = active.messages[index - 1] ? formatDay(active.messages[index - 1].created_at) : "";
                return <Fragment key={message.id}>{day !== previous ? <div className="message-date-divider">{day}</div> : null}<motion.article className={`message-bubble ${message.sender_id === profile?.userId ? "own" : ""} ${message.message_type}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}><strong>{message.message_type === "system" ? "System" : nameOf(sender)}<span>{sender?.role ?? ""}</span></strong><p>{message.body}</p><small>{formatDateTime(message.created_at)}</small></motion.article></Fragment>;
              })}</div>
              <div className="message-form"><textarea placeholder="Nachricht schreiben" rows={3} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} /><button className="button secondary" disabled title="Anhänge werden vorbereitet." type="button"><Paperclip size={16} />Anhänge werden vorbereitet.</button><button className="button" type="button" disabled={!draft.trim() || sending} onClick={sendMessage}><Send size={16} />Senden</button></div>
            </motion.section> : <motion.div className="communication-empty-state chat-empty-state" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}><MessageSquare size={34} /><strong>Keine Konversation ausgewählt</strong><p>Wählen Sie links eine Unterhaltung aus.</p></motion.div>}</AnimatePresence>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
