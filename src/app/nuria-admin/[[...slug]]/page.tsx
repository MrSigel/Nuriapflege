import { NuriaAdminDashboard } from "@/components/nuria-admin-dashboard";
import { getNuriaAdminData, resolveNuriaAdminSection } from "@/lib/nuria-admin";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function NuriaAdminPage({ params }: PageProps) {
  const { slug } = await params;
  const section = resolveNuriaAdminSection(slug);
  const data = await getNuriaAdminData();

  return <NuriaAdminDashboard data={data} section={section} />;
}
