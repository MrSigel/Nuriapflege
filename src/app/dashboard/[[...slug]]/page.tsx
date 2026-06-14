import { notFound } from "next/navigation";
import { DashboardOverview } from "@/components/dashboard-overview";
import { DashboardPage } from "@/components/dashboard-page";
import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardOverview } from "@/lib/dashboard-overview";
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

  return (
    <DashboardShell
      role="inhaber"
      title={route.title}
      routes={appRoutes.map(({ path, title }) => ({ path, title }))}
    >
      {overview ? <DashboardOverview data={overview} role="inhaber" /> : <DashboardPage route={route} context="company" />}
    </DashboardShell>
  );
}
