import { notFound } from "next/navigation";
import { DashboardPage } from "@/components/dashboard-page";
import { DashboardShell } from "@/components/dashboard-shell";
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

  return (
    <DashboardShell role="inhaber" title={route.title} routes={appRoutes}>
      <DashboardPage route={route} context="company" />
    </DashboardShell>
  );
}
