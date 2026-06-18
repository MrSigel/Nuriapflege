import { redirect } from "next/navigation";
import { privateRobotsMetadata } from "@/lib/public-seo";

export const metadata = privateRobotsMetadata;

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export default async function AdminDashboardPage({ params }: PageProps) {
  const { slug = [] } = await params;
  redirect(`/nuria-admin${slug.length ? `/${slug.join("/")}` : ""}`);
}
