export type BillingInterval = "monthly" | "quarterly" | "half_yearly" | "yearly";
export type PaymentStatus = "pending_payment" | "payment_marked_as_sent" | "active" | "payment_overdue" | "locked";
export type SubscriptionStatus = "pending" | "payment_marked_as_sent" | "active" | "overdue" | "locked" | "cancelled";
export type PaymentLogStatus = "pending" | "marked_as_sent" | "confirmed" | "rejected" | "overdue";

export const plans: Record<BillingInterval, { label: string; packageId: string; months: number; discount: number }> = {
  monthly: { label: "Monatlich", packageId: "NP-START-89-MONTHLY", months: 1, discount: 0 },
  quarterly: { label: "3 Monate", packageId: "NP-START-89-QUARTERLY", months: 3, discount: 5 },
  half_yearly: { label: "6 Monate", packageId: "NP-START-89-HALFYEAR", months: 6, discount: 10 },
  yearly: { label: "Jaehrlich", packageId: "NP-START-89-YEARLY", months: 12, discount: 15 },
};
export const monthlyPrice = 89;

export type PaymentCompany = {
  id: string;
  name: string | null;
  legal_name: string | null;
  email: string | null;
  billing_email: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  payment_status: PaymentStatus | null;
  package_id: string | null;
  billing_interval: BillingInterval | null;
  payment_marked_at: string | null;
  payment_due_until: string | null;
  payment_due_check_at: string | null;
  admin_confirmed_at: string | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  company_id: string;
  package_id: string;
  package_name: string;
  monthly_price: number;
  billing_interval: BillingInterval;
  discount_percent: number;
  subtotal_amount: number;
  total_amount: number;
  currency: string;
  status: SubscriptionStatus;
  started_at: string;
  current_period_start: string | null;
  current_period_end: string | null;
  is_legacy_plan: boolean;
  plan_version: string;
  created_at: string;
  updated_at: string;
};

export type PaymentLog = {
  id: string;
  company_id: string;
  subscription_id: string | null;
  amount: number;
  currency: string;
  billing_interval: BillingInterval;
  payment_method: string;
  status: PaymentLogStatus;
  marked_by: string | null;
  marked_at: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  marked_by_name: string | null;
};

export type PaymentData = {
  company: PaymentCompany | null;
  subscription: Subscription | null;
  logs: PaymentLog[];
  bank: { recipient: string; iban: string; bic: string; bank: string; purpose: string };
  stats: { status: string; packageId: string; interval: string; nextCheck: string; amount: number; lastMarked: string };
};

export function calculatePlan(interval: BillingInterval) {
  const plan = plans[interval];
  const subtotal = monthlyPrice * plan.months;
  const total = Number((subtotal * (1 - plan.discount / 100)).toFixed(2));
  return { ...plan, billing_interval: interval, monthlyPrice, subtotal, total, currency: "EUR" };
}

export function intervalFromPackage(packageId?: string | null, billing?: string | null): BillingInterval {
  if (billing && billing in plans) return billing as BillingInterval;
  if (packageId?.includes("QUARTERLY")) return "quarterly";
  if (packageId?.includes("HALFYEAR")) return "half_yearly";
  if (packageId?.includes("YEARLY")) return "yearly";
  return "monthly";
}
