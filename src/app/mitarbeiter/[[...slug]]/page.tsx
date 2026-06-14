import { redirect, notFound } from "next/navigation";
import { DashboardPage } from "@/components/dashboard-page";
import { DashboardShell } from "@/components/dashboard-shell";
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

  return (
    <DashboardShell role="mitarbeiter" title={route.title} routes={staffRoutes}>
      <DashboardPage route={route} context="staff" />
    </DashboardShell>
  );
}
