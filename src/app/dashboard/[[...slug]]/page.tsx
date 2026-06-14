import { notFound } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard-overview";
import { DashboardPage } from "@/components/dashboard-page";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmployeesPage } from "@/components/employees-page";
import { LocationsPage } from "@/components/locations-page";
import { getDashboardOverview } from "@/lib/dashboard-overview";
import { createEmployee, inviteEmployee, toggleEmployeeStatus, updateEmployee } from "@/lib/employee-actions";
import { getEmployeesData } from "@/lib/employees";
import { getLocationsData } from "@/lib/locations";
import { appRoutes, routeByPath } from "@/lib/nuria-config";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function CompanyDashboardPage({ params }: PageProps) {
  const { slug = [] } = await params;
  const path = `/dashboard${slug.length ? `/${slug.join("/")}` : ""}`;
  const route = routeByPath(path);

  if (!route || !path.startsWith("/dashboard")) {
    notFound();
  }

  const overview = path === "/dashboard" ? await getDashboardOverview("inhaber") : null;
  const locations = path === "/dashboard/standorte" ? await getLocationsData() : null;
  const employees = path === "/dashboard/mitarbeiter" ? await getEmployeesData() : null;

  return (
    <DashboardShell
      role="inhaber"
      title={route.title}
      routes={appRoutes.map(({ path, title }) => ({ path, title }))}
    >
      {overview ? <DashboardOverview data={overview} role="inhaber" /> : null}
      {locations ? <LocationsPage data={locations} /> : null}
      {employees ? (
        <EmployeesPage
          data={employees}
          actions={{ inviteEmployee, createEmployee, updateEmployee, toggleEmployeeStatus }}
        />
      ) : null}
      {!overview && !locations && !employees ? <DashboardPage route={route} context="company" /> : null}
    </DashboardShell>
  );
}
