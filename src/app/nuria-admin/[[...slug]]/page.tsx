import { NuriaAdminDashboard } from "@/components/nuria-admin-dashboard";
import { privateRobotsMetadata } from "@/lib/public-seo";
import { getNuriaAdminData, resolveNuriaAdminSection } from "@/lib/nuria-admin";

export const metadata = privateRobotsMetadata;

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function NuriaAdminPage({ params }: PageProps) {
  const { slug } = await params;
  const section = resolveNuriaAdminSection(slug);
  const data = await getNuriaAdminData();

  return <NuriaAdminDashboard data={data} section={section} />;
}
