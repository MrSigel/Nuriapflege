import { getSupabaseServerClient } from "@/lib/supabase-server";

export type ClientStatus = "active" | "inactive" | "paused";
export type CareLevel = "none" | "1" | "2" | "3" | "4" | "5" | "applied" | "unknown";

export type ClientLocation = {
  id: string;
  name: string;
};

export type ClientRecord = {
  id: string;
  company_id: string;
  location_id: string | null;
  client_number: string | null;
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  care_level: CareLevel;
  insurance_provider: string | null;
  insurance_number: string | null;
  primary_contact_name: string | null;
  primary_contact_phone: string | null;
  primary_contact_email: string | null;
  primary_contact_relation: string | null;
  status: ClientStatus;
  notes: string | null;
  updated_at: string;
  location_name: string | null;
};

export type ClientsData = {
  clients: ClientRecord[];
  locations: ClientLocation[];
  stats: {
    total: number;
    active: number;
    paused: number;
    inactive: number;
    withoutLocation: number;
    withoutCareLevel: number;
  };
  exportPrepared: boolean;
};

function getCompanyId() {
  return process.env.NURIA_DEV_COMPANY_ID ?? null;
}

export async function getClientsData(): Promise<ClientsData> {
  const supabase = getSupabaseServerClient();
  const companyId = getCompanyId();

  if (!supabase || !companyId) {
    return {
      clients: [],
      locations: [],
      stats: { total: 0, active: 0, paused: 0, inactive: 0, withoutLocation: 0, withoutCareLevel: 0 },
      exportPrepared: false,
    };
  }

  const [{ data: clients }, { data: locations }] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, company_id, location_id, client_number, first_name, last_name, date_of_birth, gender, street, house_number, postal_code, city, phone, email, care_level, insurance_provider, insurance_number, primary_contact_name, primary_contact_phone, primary_contact_email, primary_contact_relation, status, notes, updated_at, company_locations(name)",
      )
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false }),
    supabase.from("company_locations").select("id, name").eq("company_id", companyId).order("name", { ascending: true }),
  ]);

  const normalizedClients = (clients ?? []).map((client) => ({
    ...client,
    location_name: Array.isArray(client.company_locations)
      ? client.company_locations[0]?.name ?? null
      : (client.company_locations as { name?: string } | null)?.name ?? null,
  })) as ClientRecord[];

  return {
    clients: normalizedClients,
    locations: (locations ?? []) as ClientLocation[],
    stats: {
      total: normalizedClients.length,
      active: normalizedClients.filter((client) => client.status === "active").length,
      paused: normalizedClients.filter((client) => client.status === "paused").length,
      inactive: normalizedClients.filter((client) => client.status === "inactive").length,
      withoutLocation: normalizedClients.filter((client) => !client.location_id).length,
      withoutCareLevel: normalizedClients.filter((client) => client.care_level === "none" || client.care_level === "unknown").length,
    },
    exportPrepared: false,
  };
}
