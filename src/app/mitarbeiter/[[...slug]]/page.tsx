import { redirect, notFound } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard-overview";
import { DashboardPage } from "@/components/dashboard-page";
import { DashboardShell } from "@/components/dashboard-shell";
import { StaffSchedulePage } from "@/components/staff-schedule-page";
import { StaffTourPage } from "@/components/staff-tour-page";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { routeByPath, staffRoutes } from "@/lib/nuria-config";

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

  const overview = path === "/mitarbeiter/dashboard" ? await getDashboardOverview("mitarbeiter") : null;

  return (
    <DashboardShell
      role="mitarbeiter"
      title={route.title}
      routes={staffRoutes.map(({ path, title }) => ({ path, title }))}
    >
      {path === "/mitarbeiter/dienstplan" ? <StaffSchedulePage /> : null}
      {path === "/mitarbeiter/tour" ? <StaffTourPage /> : null}
      {overview ? <DashboardOverview data={overview} role="mitarbeiter" /> : null}
      {!overview && path !== "/mitarbeiter/dienstplan" && path !== "/mitarbeiter/tour" ? <DashboardPage route={route} context="staff" /> : null}
    </DashboardShell>
  );
}
