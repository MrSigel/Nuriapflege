import { NextResponse } from "next/server";
import { calculatePlan, plans, type BillingInterval } from "@/lib/payment";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const blockedDomains = new Set([
  "gmail.com",
  "googlemail.com",
  "gmx.de",
  "gmx.net",
  "web.de",
  "outlook.com",
  "hotmail.com",
  "live.de",
  "yahoo.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
  "t-online.de",
]);

const requiredFields = [
  "firstName",
  "lastName",
  "email",
  "password",
  "passwordRepeat",
  "companyName",
  "phone",
  "street",
  "houseNumber",
  "postalCode",
  "city",
  "country",
  "billingInterval",
] as const;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function error(message: string, status = 400) {
  return NextResponse.json({ ok: false, message }, { status });
}

function currentPeriodEnd(interval: BillingInterval) {
  const end = new Date();
  end.setMonth(end.getMonth() + plans[interval].months);
  return end.toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();

  if (!supabase || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return error("Registrierung ist aktuell nicht verfügbar.", 503);
  }

  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return error("Bitte prüfen Sie Ihre Angaben.");
  }

  const values = Object.fromEntries(requiredFields.map((field) => [field, clean((body as Record<string, unknown>)[field])])) as Record<
    (typeof requiredFields)[number],
    string
  >;
  const legalForm = clean((body as Record<string, unknown>).legalForm);
  const state = clean((body as Record<string, unknown>).state);
  const ikNumber = clean((body as Record<string, unknown>).ikNumber);
  const interval = values.billingInterval as BillingInterval;

  if (requiredFields.some((field) => !values[field])) {
    return error("Bitte füllen Sie alle Pflichtfelder aus.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    return error("Bitte geben Sie eine gültige geschäftliche E-Mail-Adresse ein.");
  }

  const emailDomain = values.email.split("@").pop()?.toLowerCase() ?? "";
  if (blockedDomains.has(emailDomain)) {
    return error("Bitte verwenden Sie eine geschäftliche E-Mail-Adresse Ihres Pflegedienstes.");
  }

  if (values.password.length < 8) {
    return error("Das Passwort muss mindestens 8 Zeichen lang sein.");
  }

  if (values.password !== values.passwordRepeat) {
    return error("Passwort und Wiederholung stimmen nicht überein.");
  }

  if (!/^\d{4,5}$/.test(values.postalCode)) {
    return error("Bitte geben Sie eine plausible PLZ ein.");
  }

  if (!(interval in plans)) {
    return error("Bitte wählen Sie ein gültiges Zahlungsintervall aus.");
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: values.email,
    password: values.password,
    email_confirm: true,
    user_metadata: {
      first_name: values.firstName,
      last_name: values.lastName,
      role: "inhaber",
    },
  });

  if (authError || !authData.user) {
    const message = authError?.message?.toLowerCase().includes("already")
      ? "Diese E-Mail-Adresse ist bereits vergeben."
      : "Registrierung fehlgeschlagen. Bitte prüfen Sie Ihre Angaben.";
    return error(message);
  }

  const userId = authData.user.id;
  const plan = calculatePlan(interval);
  const nowDate = new Date().toISOString().slice(0, 10);

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      name: values.companyName,
      legal_name: legalForm || null,
      email: values.email,
      billing_email: values.email,
      phone: values.phone,
      street: values.street,
      house_number: values.houseNumber,
      postal_code: values.postalCode,
      city: values.city,
      state: state || null,
      country: values.country,
      ik_number: ikNumber || null,
      status: "active",
      package_id: plan.packageId,
      billing_interval: interval,
      onboarding_status: "in_progress",
      payment_status: "pending_payment",
    })
    .select("id")
    .single();

  if (companyError || !company) {
    await supabase.auth.admin.deleteUser(userId);
    return error("Pflegedienst konnte nicht erstellt werden.");
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    company_id: company.id,
    role: "inhaber",
    first_name: values.firstName,
    last_name: values.lastName,
    email: values.email,
    status: "active",
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from("companies").delete().eq("id", company.id);
    return error("Inhaber-Profil konnte nicht erstellt werden.");
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("company_subscriptions")
    .insert({
      company_id: company.id,
      package_id: plan.packageId,
      package_name: "Nuria Pflege Start",
      monthly_price: plan.monthlyPrice,
      billing_interval: interval,
      discount_percent: plan.discount,
      subtotal_amount: plan.subtotal,
      total_amount: plan.total,
      currency: "EUR",
      status: "pending",
      current_period_start: nowDate,
      current_period_end: currentPeriodEnd(interval),
    })
    .select("id")
    .single();

  if (subscriptionError || !subscription) {
    await supabase.auth.admin.deleteUser(userId);
    await supabase.from("companies").delete().eq("id", company.id);
    return error("Tarif konnte nicht angelegt werden.");
  }

  await supabase.from("company_payment_logs").insert({
    company_id: company.id,
    subscription_id: subscription.id,
    amount: plan.total,
    currency: "EUR",
    billing_interval: interval,
    payment_method: "bank_transfer",
    status: "pending",
    notes: "Registrierung erstellt. Zahlung per Banküberweisung ausstehend.",
  });

  return NextResponse.json({ ok: true });
}
