import { redirect, notFound } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard-overview";
import { DashboardPage } from "@/components/dashboard-page";
import { DashboardShell } from "@/components/dashboard-shell";
import { StaffAbsencePage } from "@/components/staff-absence-page";
import { StaffClientsPage } from "@/components/staff-clients-page";
import { StaffCommunicationPage } from "@/components/staff-communication-page";
import { StaffDocumentsPage } from "@/components/staff-documents-page";
import { StaffNotesPage } from "@/components/staff-notes-page";
import { StaffProfilePage } from "@/components/staff-profile-page";
import { StaffSchedulePage } from "@/components/staff-schedule-page";
import { StaffTimePage } from "@/components/staff-time-page";
import { StaffTourPage } from "@/components/staff-tour-page";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { routeByPath, staffRoutes } from "@/lib/nuria-config";
import { getCurrentUserContext } from "@/lib/current-user";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function StaffDashboardPage({ params }: PageProps) {
  const { slug = [] } = await params;

  if (slug.length === 0) {
    redirect("/mitarbeiter/dashboard");
  }

  const path = `/mitarbeiter/${slug.join("/")}`;
  const route = routeByPath(path);

  if (!route || !path.startsWith("/mitarbeiter")) {
    notFound();
  }

  const userContext = await getCurrentUserContext();
  if (!userContext) {
    redirect("/login");
  }

  if (userContext.role !== "mitarbeiter" && userContext.role !== "pflegefachkraft") {
    redirect("/dashboard");
  }

  if (!route.roles.includes(userContext.role)) {
    redirect("/mitarbeiter/dashboard");
  }

  const overview = path === "/mitarbeiter/dashboard" ? await getDashboardOverview(userContext.role) : null;

  return (
    <DashboardShell
      role={userContext.role}
      title={route.title}
      routes={staffRoutes.filter((route) => route.roles.includes(userContext.role)).map(({ path, title }) => ({ path, title }))}
    >
      {path === "/mitarbeiter/dienstplan" ? <StaffSchedulePage /> : null}
      {path === "/mitarbeiter/tour" ? <StaffTourPage /> : null}
      {path === "/mitarbeiter/patienten" ? <StaffClientsPage /> : null}
      {path === "/mitarbeiter/notizen" ? <StaffNotesPage /> : null}
      {path === "/mitarbeiter/dokumente-hochladen" ? <StaffDocumentsPage /> : null}
      {path === "/mitarbeiter/zeiterfassung" ? <StaffTimePage /> : null}
      {path === "/mitarbeiter/kommunikation" ? <StaffCommunicationPage /> : null}
      {path === "/mitarbeiter/profil" ? <StaffProfilePage /> : null}
      {path === "/mitarbeiter/abwesenheiten" ? <StaffAbsencePage /> : null}
      {overview ? <DashboardOverview data={overview} role="mitarbeiter" /> : null}
      {!overview && path !== "/mitarbeiter/dienstplan" && path !== "/mitarbeiter/tour" && path !== "/mitarbeiter/patienten" && path !== "/mitarbeiter/notizen" && path !== "/mitarbeiter/dokumente-hochladen" && path !== "/mitarbeiter/zeiterfassung" && path !== "/mitarbeiter/kommunikation" && path !== "/mitarbeiter/profil" && path !== "/mitarbeiter/abwesenheiten" ? <DashboardPage route={route} context="staff" /> : null}
    </DashboardShell>
  );
}
