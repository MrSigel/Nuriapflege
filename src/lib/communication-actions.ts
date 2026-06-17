"use server";

import { revalidatePath } from "next/cache";
import { requireCompanyRole } from "@/lib/current-user";
import { getSupabaseServerClient } from "@/lib/supabase-server";

function text(value: FormDataEntryValue | null) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function required(formData: FormData, key: string) {
  const value = text(formData.get(key));
  if (!value) throw new Error("Pflichtfeld fehlt.");
  return value;
}

async function context() {
  return requireCompanyRole(["inhaber", "pdl", "verwaltung"]);
}

async function ownUser(companyId: string, id: string) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from("profiles").select("id,role").eq("company_id", companyId).eq("id", id).maybeSingle();
  if (!data) throw new Error("Teilnehmer ist ungueltig.");
  return data;
}

async function audit(companyId: string, userId: string, conversationId: string, action: string, row: unknown) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  await supabase.from("conversation_audit_logs").insert({
    company_id: companyId,
    conversation_id: conversationId,
    changed_by: userId,
    action,
    new_values: row,
  });
}

export async function createDirectConversation(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const recipient = required(formData, "recipient_id");
  const body = required(formData, "body");
  if (!supabase || !companyId || !userId) return;

  await ownUser(companyId, recipient);
  const { data: conversation } = await supabase
    .from("conversations")
    .insert({
      company_id: companyId,
      title: "Einzelchat",
      conversation_type: "direct",
      status: "active",
      created_by: userId,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (!conversation) return;

  await supabase.from("conversation_participants").insert([
    { company_id: companyId, conversation_id: conversation.id, user_id: userId, role: "owner", last_read_at: new Date().toISOString() },
    { company_id: companyId, conversation_id: conversation.id, user_id: recipient, role: "participant" },
  ]);
  await supabase.from("messages").insert({ company_id: companyId, conversation_id: conversation.id, sender_id: userId, body, message_type: "text" });
  await audit(companyId, userId, conversation.id, "created", { recipient });
  revalidatePath("/dashboard/kommunikation");
}

export async function createGroupConversation(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const title = required(formData, "title");
  const body = text(formData.get("body"));
  const ids = formData.getAll("participant_ids").map((value) => String(value)).filter(Boolean);
  if (!supabase || !companyId || !userId || ids.length === 0) return;

  for (const id of ids) await ownUser(companyId, id);
  const { data: conversation } = await supabase
    .from("conversations")
    .insert({
      company_id: companyId,
      title,
      conversation_type: "group",
      status: "active",
      created_by: userId,
      last_message_at: body ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (!conversation) return;

  await supabase.from("conversation_participants").insert([
    { company_id: companyId, conversation_id: conversation.id, user_id: userId, role: "owner", last_read_at: new Date().toISOString() },
    ...ids.map((id) => ({ company_id: companyId, conversation_id: conversation.id, user_id: id, role: "participant" })),
  ]);
  if (body) await supabase.from("messages").insert({ company_id: companyId, conversation_id: conversation.id, sender_id: userId, body, message_type: "text" });
  await audit(companyId, userId, conversation.id, "created", { title, ids });
  revalidatePath("/dashboard/kommunikation");
}

export async function sendMessage(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const conversationId = required(formData, "conversation_id");
  const body = required(formData, "body");
  if (!supabase || !companyId || !userId) return;

  const { data: conversation } = await supabase.from("conversations").select("id").eq("company_id", companyId).eq("id", conversationId).maybeSingle();
  if (!conversation) return;

  const now = new Date().toISOString();
  await supabase.from("messages").insert({ company_id: companyId, conversation_id: conversationId, sender_id: userId, body, message_type: "text" });
  await supabase.from("conversations").update({ last_message_at: now }).eq("id", conversationId).eq("company_id", companyId);
  await supabase
    .from("conversation_participants")
    .upsert({ company_id: companyId, conversation_id: conversationId, user_id: userId, last_read_at: now }, { onConflict: "conversation_id,user_id" });
  await audit(companyId, userId, conversationId, "message_sent", { body });
  revalidatePath("/dashboard/kommunikation");
}

export async function markConversationRead(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const conversationId = required(formData, "conversation_id");
  if (!supabase || !companyId || !userId) return;

  await supabase
    .from("conversation_participants")
    .upsert({ company_id: companyId, conversation_id: conversationId, user_id: userId, last_read_at: new Date().toISOString() }, { onConflict: "conversation_id,user_id" });
  revalidatePath("/dashboard/kommunikation");
}

export async function archiveConversation(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId } = await context();
  const id = required(formData, "conversation_id");
  if (!supabase || !companyId) return;

  await supabase.from("conversations").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", id).eq("company_id", companyId);
  await audit(companyId, userId, id, "archived", {});
  revalidatePath("/dashboard/kommunikation");
}

export async function addParticipant(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId: changedBy } = await context();
  const conversationId = required(formData, "conversation_id");
  const userId = required(formData, "user_id");
  if (!supabase || !companyId) return;

  const user = await ownUser(companyId, userId);
  if (!user) return;

  await supabase
    .from("conversation_participants")
    .upsert({ company_id: companyId, conversation_id: conversationId, user_id: userId, role: "participant" }, { onConflict: "conversation_id,user_id" });
  await audit(companyId, changedBy, conversationId, "participants_updated", { userId });
  revalidatePath("/dashboard/kommunikation");
}

export async function removeParticipant(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const { companyId, userId: changedBy } = await context();
  const conversationId = required(formData, "conversation_id");
  const userId = required(formData, "user_id");
  if (!supabase || !companyId || userId === changedBy) return;

  await supabase.from("conversation_participants").delete().eq("company_id", companyId).eq("conversation_id", conversationId).eq("user_id", userId);
  await audit(companyId, changedBy, conversationId, "participants_updated", { userId });
  revalidatePath("/dashboard/kommunikation");
}
