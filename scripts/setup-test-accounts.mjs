import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const TEST_PASSWORD = "Test123456!";
const COMPANY_NAME = "Nuria Test Pflegedienst";

const accounts = [
  { email: "inhaber@test.de", role: "inhaber", first_name: "Test", last_name: "Inhaber", staff_code: "INH" },
  { email: "pdl@test.de", role: "pdl", first_name: "Test", last_name: "PDL", staff_code: "PDL" },
  { email: "ma@test.de", role: "mitarbeiter", first_name: "Test", last_name: "Mitarbeiter", staff_code: "MA" },
];

const roles = [
  { key: "inhaber", name: "Inhaber", description: "Vollzugriff auf das eigene Unternehmen." },
  { key: "pdl", name: "Pflegedienstleitung", description: "Operative Pflege- und Planungsrechte." },
  { key: "mitarbeiter", name: "Mitarbeiter", description: "Eigene und zugewiesene operative Bereiche." },
];

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]]) {
      continue;
    }

    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

async function findAuthUserByEmail(supabase, email) {
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      throw error;
    }

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) {
      return user;
    }

    if (data.users.length < 1000) {
      return null;
    }

    page += 1;
  }
}

async function ensureAuthUser(supabase, account) {
  const existing = await findAuthUserByEmail(supabase, account.email);

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: account.first_name,
        last_name: account.last_name,
        role: account.role,
      },
    });

    if (error || !data.user) {
      throw error ?? new Error(`User konnte nicht aktualisiert werden: ${account.email}`);
    }

    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: account.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: {
      first_name: account.first_name,
      last_name: account.last_name,
      role: account.role,
    },
  });

  if (error || !data.user) {
    throw error ?? new Error(`User konnte nicht erstellt werden: ${account.email}`);
  }

  return data.user;
}

async function ensureCompany(supabase) {
  const { data: existing, error: existingError } = await supabase
    .from("companies")
    .select("id")
    .eq("name", COMPANY_NAME)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    const { error } = await supabase
      .from("companies")
      .update({
        status: "active",
        payment_status: "active",
        package_id: "NP-START-89-2026",
        billing_interval: "monthly",
        billing_email: "inhaber@test.de",
      })
      .eq("id", existing.id);

    if (error) {
      throw error;
    }

    return existing.id;
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: COMPANY_NAME,
      legal_name: COMPANY_NAME,
      email: "inhaber@test.de",
      billing_email: "inhaber@test.de",
      phone: "+49 000 000000",
      street: "Teststraße",
      house_number: "1",
      postal_code: "10115",
      city: "Berlin",
      country: "Deutschland",
      status: "active",
      package_id: "NP-START-89-2026",
      billing_interval: "monthly",
      payment_status: "active",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Test-Company konnte nicht erstellt werden.");
  }

  return data.id;
}

async function ensurePrimaryLocation(supabase, companyId) {
  const { data: existing, error: existingError } = await supabase
    .from("company_locations")
    .select("id")
    .eq("company_id", companyId)
    .eq("name", "Hauptstandort")
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("company_locations")
    .insert({
      company_id: companyId,
      name: "Hauptstandort",
      street: "Teststraße",
      house_number: "1",
      postal_code: "10115",
      city: "Berlin",
      location_type: "hauptstandort",
      status: "active",
      is_primary: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Test-Standort konnte nicht erstellt werden.");
  }

  return data.id;
}

async function ensureProfile(supabase, user, account, companyId) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      company_id: companyId,
      role: account.role,
      first_name: account.first_name,
      last_name: account.last_name,
      email: account.email,
      staff_code: account.staff_code,
      status: "active",
      invitation_status: "accepted",
      accepted_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

async function ensureLocationAssignment(supabase, companyId, employeeId, locationId) {
  const { error } = await supabase.from("employee_locations").upsert(
    {
      company_id: companyId,
      employee_id: employeeId,
      location_id: locationId,
    },
    { onConflict: "company_id,employee_id,location_id" },
  );

  if (error) {
    throw error;
  }
}

async function ensureRoles(supabase, companyId) {
  const { error } = await supabase.from("roles").upsert(
    roles.map((role) => ({
      company_id: companyId,
      key: role.key,
      name: role.name,
      description: role.description,
      is_system_role: true,
    })),
    { onConflict: "company_id,key" },
  );

  if (error) {
    throw error;
  }
}

async function ensureSubscription(supabase, companyId) {
  const { data: existing, error: existingError } = await supabase
    .from("company_subscriptions")
    .select("id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return;
  }

  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);

  const { error } = await supabase.from("company_subscriptions").insert({
    company_id: companyId,
    package_id: "NP-START-89-2026",
    package_name: "Nuria Pflege Start",
    monthly_price: 89,
    billing_interval: "monthly",
    discount_percent: 0,
    subtotal_amount: 89,
    total_amount: 89,
    currency: "EUR",
    status: "active",
    current_period_start: start.toISOString().slice(0, 10),
    current_period_end: end.toISOString().slice(0, 10),
  });

  if (error) {
    throw error;
  }
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase URL oder Service-Role-Key fehlt.");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const companyId = await ensureCompany(supabase);
  const locationId = await ensurePrimaryLocation(supabase, companyId);
  await ensureRoles(supabase, companyId);
  await ensureSubscription(supabase, companyId);

  for (const account of accounts) {
    const user = await ensureAuthUser(supabase, account);
    await ensureProfile(supabase, user, account, companyId);
    await ensureLocationAssignment(supabase, companyId, user.id, locationId);
  }

  console.log("Test-Accounts vorbereitet.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
