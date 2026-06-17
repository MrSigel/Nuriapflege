import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function AdminDashboardPage({ params }: PageProps) {
  const { slug = [] } = await params;
  redirect(`/nuria-admin${slug.length ? `/${slug.join("/")}` : ""}`);
}
