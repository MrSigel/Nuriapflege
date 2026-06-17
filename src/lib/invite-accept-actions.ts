"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashInviteToken } from "@/lib/invitations";
import { getSupabaseServerClient } from "@/lib/supabase-server";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

async function setDashboardCookies(userId: string, companyId: string) {
  const secure = process.env.NODE_ENV === "production";
  const options = { httpOnly: false, secure, sameSite: "lax" as const, path: "/", maxAge: 60 * 60 * 24 * 30 };
  const store = await cookies();
  store.set("nuria_user_id", userId, options);
  store.set("nuria_company_id", companyId, options);
}

export async function acceptEmployeeInvitation(formData: FormData) {
  const supabase = getSupabaseServerClient();
  const token = value(formData, "token");
  const password = value(formData, "password");
  const passwordRepeat = value(formData, "password_repeat");

  if (!supabase || !process.env.SUPABASE_SERVICE_ROLE_KEY || !token) {
    redirect(`/mitarbeiter/einladung/${token}?error=1`);
  }

  if (password.length < 8 || password !== passwordRepeat) {
    redirect(`/mitarbeiter/einladung/${token}?error=1`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,company_id,status,invitation_status,invitation_expires_at")
    .eq("invitation_token_hash", hashInviteToken(token))
    .eq("invitation_status", "invited")
    .maybeSingle();

  if (!profile?.id || !profile.company_id || (profile.invitation_expires_at && new Date(profile.invitation_expires_at).getTime() < Date.now())) {
    redirect(`/mitarbeiter/einladung/${token}?error=1`);
  }

  const authUpdate = await supabase.auth.admin.updateUserById(profile.id, { password, email_confirm: true });
  if (authUpdate.error) {
    redirect(`/mitarbeiter/einladung/${token}?error=1`);
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      status: "active",
      invitation_status: "accepted",
      accepted_at: new Date().toISOString(),
      invitation_token_hash: null,
      invitation_expires_at: null,
    })
    .eq("id", profile.id);

  if (error) {
    redirect(`/mitarbeiter/einladung/${token}?error=1`);
  }

  await setDashboardCookies(profile.id, profile.company_id);
  redirect("/mitarbeiter/dashboard");
}
