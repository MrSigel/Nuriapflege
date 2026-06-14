import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase-server";

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

function getCompanyId() {
  return process.env.NURIA_DEV_COMPANY_ID ?? null;
}

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
  const companyId = getCompanyId();

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

export async function createLocation(formData: FormData) {
  "use server";

  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();

  if (!supabase || !companyId) {
    return;
  }

  const payload = parseLocationPayload(formData, true);

  await supabase.from("company_locations").insert({
    ...payload,
    company_id: companyId,
    is_primary: false,
  });

  revalidatePath("/dashboard/standorte");
}

export async function updateLocation(formData: FormData) {
  "use server";

  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const id = requireText(formData, "id");
  const isPrimary = formData.get("is_primary") === "true";

  if (!supabase || !companyId) {
    return;
  }

  const payload = parseLocationPayload(formData, false);

  if (isPrimary) {
    payload.location_type = "hauptstandort";
    payload.status = "active";
  }

  await supabase.from("company_locations").update(payload).eq("id", id).eq("company_id", companyId);

  revalidatePath("/dashboard/standorte");
}

export async function toggleLocationStatus(formData: FormData) {
  "use server";

  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();
  const id = requireText(formData, "id");
  const currentStatus = validateStatus(sanitize(formData.get("status")));
  const isPrimary = formData.get("is_primary") === "true";

  if (!supabase || !companyId || isPrimary) {
    return;
  }

  await supabase
    .from("company_locations")
    .update({ status: currentStatus === "active" ? "inactive" : "active" })
    .eq("id", id)
    .eq("company_id", companyId)
    .eq("is_primary", false);

  revalidatePath("/dashboard/standorte");
}
