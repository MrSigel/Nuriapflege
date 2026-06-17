import { revalidatePath } from "next/cache";
import { requireCompanyManager } from "@/lib/current-user";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { companyId as currentCompanyId } from "@/lib/onboarding";

export type LocationType = "hauptstandort" | "nebenstandort" | "verwaltungsstandort" | "aussenstelle" | "einsatzgebiet";
export type LocationStatus = "active" | "inactive";

export type CompanyLocation = {
  id: string;
  company_id: string;
  name: string;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  contact_person: string | null;
  location_type: LocationType;
  is_primary: boolean;
  status: LocationStatus;
  notes: string | null;
  updated_at: string;
  client_count: number;
  employee_count: number;
};

export type LocationsData = {
  locations: CompanyLocation[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    employeesAssigned: number;
    clientsAssigned: number;
  };
  canWrite: boolean;
  exportPrepared: boolean;
};

const locationTypes = ["hauptstandort", "nebenstandort", "verwaltungsstandort", "aussenstelle", "einsatzgebiet"] as const;
const locationStatuses = ["active", "inactive"] as const;

type ActionResult = { ok: boolean; message?: string };

function sanitize(value: FormDataEntryValue | null) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function requireText(formData: FormData, key: string) {
  const value = sanitize(formData.get(key));

  if (!value) {
    throw new Error("Pflichtfeld fehlt.");
  }

  return value;
}

function validateEmail(email: string | null) {
  if (!email) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("E-Mail ist ungültig.");
  }

  return email;
}

function validateLocationType(value: string | null): LocationType {
  if (!value || !locationTypes.includes(value as LocationType)) {
    throw new Error("Standorttyp ist ungültig.");
  }

  return value as LocationType;
}

function validateStatus(value: string | null): LocationStatus {
  if (!value || !locationStatuses.includes(value as LocationStatus)) {
    throw new Error("Status ist ungültig.");
  }

  return value as LocationStatus;
}

function parseLocationPayload(formData: FormData, forceNonPrimary: boolean) {
  const locationType = validateLocationType(sanitize(formData.get("location_type")));
  const status = validateStatus(sanitize(formData.get("status")));

  return {
    name: requireText(formData, "name"),
    location_type: forceNonPrimary && locationType === "hauptstandort" ? "nebenstandort" : locationType,
    street: sanitize(formData.get("street")),
    house_number: sanitize(formData.get("house_number")),
    postal_code: requireText(formData, "postal_code"),
    city: requireText(formData, "city"),
    state: sanitize(formData.get("state")),
    phone: sanitize(formData.get("phone")),
    email: validateEmail(sanitize(formData.get("email"))),
    contact_person: sanitize(formData.get("contact_person")),
    status,
    notes: sanitize(formData.get("notes")),
  };
}

async function countRows(table: string, companyId: string, locationId: string) {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return 0;
  }

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("location_id", locationId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function getLocationsData(): Promise<LocationsData> {
  const supabase = getSupabaseServerClient();
  const companyId = await currentCompanyId();

  if (!supabase || !companyId) {
    return {
      locations: [],
      stats: { total: 0, active: 0, inactive: 0, employeesAssigned: 0, clientsAssigned: 0 },
      canWrite: Boolean(supabase && companyId),
      exportPrepared: false,
    };
  }

  const { data, error } = await supabase
    .from("company_locations")
    .select(
      "id, company_id, name, street, house_number, postal_code, city, state, phone, email, contact_person, location_type, is_primary, status, notes, updated_at",
    )
    .eq("company_id", companyId)
    .order("is_primary", { ascending: false })
    .order("name", { ascending: true });

  if (error || !data) {
    return {
      locations: [],
      stats: { total: 0, active: 0, inactive: 0, employeesAssigned: 0, clientsAssigned: 0 },
      canWrite: true,
      exportPrepared: false,
    };
  }

  const locations = await Promise.all(
    data.map(async (location) => {
      const clientCount = await countRows("clients", companyId, location.id);

      return {
        ...location,
        client_count: clientCount,
        employee_count: 0,
      } satisfies CompanyLocation;
    }),
  );

  return {
    locations,
    stats: {
      total: locations.length,
      active: locations.filter((location) => location.status === "active").length,
      inactive: locations.filter((location) => location.status === "inactive").length,
      employeesAssigned: locations.reduce((sum, location) => sum + location.employee_count, 0),
      clientsAssigned: locations.reduce((sum, location) => sum + location.client_count, 0),
    },
    canWrite: true,
    exportPrepared: false,
  };
}

export async function createLocation(formData: FormData): Promise<ActionResult> {
  "use server";

  const supabase = getSupabaseServerClient();
  const context = await requireCompanyManager().catch((error: Error) => ({ error }));

  if (!supabase || "error" in context) {
    return { ok: false, message: "Standort konnte nicht gespeichert werden." };
  }

  try {
    const payload = parseLocationPayload(formData, true);
    const { error } = await supabase.from("company_locations").insert({
      ...payload,
      company_id: context.companyId,
      is_primary: false,
      created_by: context.userId,
      updated_by: context.userId,
    });
    if (error) return { ok: false, message: "Standort konnte nicht gespeichert werden." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Standort konnte nicht gespeichert werden." };
  }

  revalidatePath("/dashboard/standorte");
  return { ok: true, message: "Standort wurde gespeichert." };
}

export async function updateLocation(formData: FormData): Promise<ActionResult> {
  "use server";

  const supabase = getSupabaseServerClient();
  const context = await requireCompanyManager().catch((error: Error) => ({ error }));

  if (!supabase || "error" in context) {
    return { ok: false, message: "Standort konnte nicht gespeichert werden." };
  }

  try {
    const id = requireText(formData, "id");
    const isPrimary = formData.get("is_primary") === "true";
    const payload = parseLocationPayload(formData, false);

    if (isPrimary) {
      payload.location_type = "hauptstandort";
      payload.status = "active";
    }

    const { error } = await supabase.from("company_locations").update({ ...payload, updated_by: context.userId }).eq("id", id).eq("company_id", context.companyId);
    if (error) return { ok: false, message: "Standort konnte nicht gespeichert werden." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Standort konnte nicht gespeichert werden." };
  }

  revalidatePath("/dashboard/standorte");
  return { ok: true, message: "Standort wurde gespeichert." };
}

export async function toggleLocationStatus(formData: FormData): Promise<ActionResult> {
  "use server";

  const supabase = getSupabaseServerClient();
  const context = await requireCompanyManager().catch((error: Error) => ({ error }));

  if (!supabase || "error" in context) {
    return { ok: false, message: "Status konnte nicht geändert werden." };
  }

  try {
    const id = requireText(formData, "id");
    const currentStatus = validateStatus(sanitize(formData.get("status")));
    const isPrimary = formData.get("is_primary") === "true";
    if (isPrimary) return { ok: false, message: "Der Hauptstandort kann nicht deaktiviert werden." };
    const { error } = await supabase
      .from("company_locations")
      .update({ status: currentStatus === "active" ? "inactive" : "active", updated_by: context.userId })
      .eq("id", id)
      .eq("company_id", context.companyId)
      .eq("is_primary", false);
    if (error) return { ok: false, message: "Status konnte nicht geändert werden." };
  } catch {
    return { ok: false, message: "Status konnte nicht geändert werden." };
  }

  revalidatePath("/dashboard/standorte");
  return { ok: true, message: "Status wurde geändert." };
}
