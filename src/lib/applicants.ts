import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getCurrentUserContext } from "@/lib/current-user";

export type ApplicantStatus = "new" | "contacted" | "interview_planned" | "interview_done" | "offer_sent" | "hired" | "rejected" | "archived";
export type ApplicantRating = "none" | "interesting" | "strong" | "not_suitable";
export type ApplicantSource = "manual" | "website" | "facebook" | "instagram" | "recommendation" | "job_portal" | "phone" | "email" | "other";
export type ApplicantPosition = "pflegefachkraft" | "pflegehelfer" | "hauswirtschaft" | "betreuungskraft" | "verwaltung" | "pdl" | "azubi" | "quereinsteiger" | "sonstiges";

export type ApplicantLocation = {
  id: string;
  name: string;
};

export type ApplicantRecord = {
  id: string;
  company_id: string;
  location_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  desired_position: ApplicantPosition;
  qualification: string | null;
  availability: string | null;
  source: ApplicantSource;
  status: ApplicantStatus;
  rating: ApplicantRating;
  notes: string | null;
  last_contact_at: string | null;
  next_follow_up_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  location_name: string | null;
  created_by_name: string | null;
  updated_by_name: string | null;
};

export type ApplicantsData = {
  applicants: ApplicantRecord[];
  locations: ApplicantLocation[];
  stats: {
    total: number;
    new: number;
    interviews: number;
    offers: number;
    hired: number;
    rejected: number;
    openFollowUps: number;
    archived: number;
  };
  exportPrepared: boolean;
};

export async function getApplicantsData(): Promise<ApplicantsData> {
  const supabase = getSupabaseServerClient();
  const context = await getCurrentUserContext();
  const companyId = context?.companyId ?? null;

  if (!supabase || !companyId) {
    return {
      applicants: [],
      locations: [],
      stats: { total: 0, new: 0, interviews: 0, offers: 0, hired: 0, rejected: 0, openFollowUps: 0, archived: 0 },
      exportPrepared: false,
    };
  }

  const [{ data: applicants }, { data: locations }] = await Promise.all([
    supabase
      .from("applicants")
      .select("id, company_id, location_id, first_name, last_name, email, phone, desired_position, qualification, availability, source, status, rating, notes, last_contact_at, next_follow_up_at, created_by, updated_by, created_at, updated_at, archived_at, company_locations(name)")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false }),
    supabase.from("company_locations").select("id, name").eq("company_id", companyId).order("name", { ascending: true }),
  ]);

  const normalizedApplicants = (applicants ?? []).map((applicant) => ({
    ...applicant,
    desired_position: (applicant.desired_position ?? "sonstiges") as ApplicantPosition,
    source: (applicant.source ?? "manual") as ApplicantSource,
    status: (applicant.status ?? "new") as ApplicantStatus,
    rating: (applicant.rating ?? "none") as ApplicantRating,
    location_name: Array.isArray(applicant.company_locations)
      ? applicant.company_locations[0]?.name ?? null
      : (applicant.company_locations as { name?: string } | null)?.name ?? null,
    created_by_name: null,
    updated_by_name: null,
  })) as ApplicantRecord[];

  const now = Date.now();
  const openFollowUps = normalizedApplicants.filter((applicant) => {
    if (!applicant.next_follow_up_at || applicant.status === "archived") return false;
    return new Date(applicant.next_follow_up_at).getTime() <= now;
  }).length;

  return {
    applicants: normalizedApplicants,
    locations: (locations ?? []) as ApplicantLocation[],
    stats: {
      total: normalizedApplicants.filter((applicant) => applicant.status !== "archived").length,
      new: normalizedApplicants.filter((applicant) => applicant.status === "new").length,
      interviews: normalizedApplicants.filter((applicant) => applicant.status === "interview_planned").length,
      offers: normalizedApplicants.filter((applicant) => applicant.status === "offer_sent").length,
      hired: normalizedApplicants.filter((applicant) => applicant.status === "hired").length,
      rejected: normalizedApplicants.filter((applicant) => applicant.status === "rejected").length,
      openFollowUps,
      archived: normalizedApplicants.filter((applicant) => applicant.status === "archived").length,
    },
    exportPrepared: false,
  };
}
