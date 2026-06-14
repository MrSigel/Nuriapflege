import { notFound } from "next/navigation";
import { DashboardPage } from "@/components/dashboard-page";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminRoutes, routeByPath } from "@/lib/nuria-config";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function AdminDashboardPage({ params }: PageProps) {
  const { slug = [] } = await params;
  const path = `/admin${slug.length ? `/${slug.join("/")}` : ""}`;
  const route = routeByPath(path);

  if (!route || !path.startsWith("/admin")) {
    notFound();
  }

  return (
    <DashboardShell role="admin" title={route.title} routes={adminRoutes}>
      <DashboardPage route={route} context="admin" />
    </DashboardShell>
  );
}
