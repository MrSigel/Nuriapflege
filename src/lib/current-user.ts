import { cookies } from "next/headers";
import { getCompanyAccessStateForCompany } from "@/lib/onboarding";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Role } from "@/lib/nuria-config";

export type CurrentUserContext = {
  userId: string;
  companyId: string;
  role: Role;
};

export async function getCurrentUserContext(): Promise<CurrentUserContext | null> {
  const supabase = getSupabaseServerClient();
  const userId = (await cookies()).get("nuria_user_id")?.value ?? null;

  if (!supabase || !userId) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, company_id, role, status")
    .eq("id", userId)
    .maybeSingle();

  if (!data?.company_id || data.status !== "active") return null;

  return {
    userId: data.id,
    companyId: data.company_id,
    role: data.role,
  };
}

type RequireOptions = {
  write?: boolean;
};

async function requireWritableCompany(context: CurrentUserContext) {
  const access = await getCompanyAccessStateForCompany(context.companyId);
  if (!access.canWrite) throw new Error("Schreibzugriff ist aktuell gesperrt.");
  return context;
}

export async function requireCompanyManager(options: RequireOptions = { write: true }) {
  const context = await getCurrentUserContext();

  if (!context || !["inhaber", "pdl"].includes(context.role)) {
    throw new Error("Keine Berechtigung für diese Aktion.");
  }

  return options.write === false ? context : requireWritableCompany(context);
}

export async function requireCompanyRole(roles: Role[], options: RequireOptions = { write: true }) {
  const context = await getCurrentUserContext();

  if (!context || !roles.includes(context.role)) {
    throw new Error("Keine Berechtigung für diese Aktion.");
  }

  return options.write === false ? context : requireWritableCompany(context);
}
