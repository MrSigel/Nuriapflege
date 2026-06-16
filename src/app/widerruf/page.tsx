import type { Metadata } from "next";
import { PublicSite } from "@/components/public-site";

export const metadata: Metadata = {
  title: "Widerruf | Nuria Pflege",
  description: "Hinweise zum Widerruf bei Nuria Pflege.",
  alternates: { canonical: "/widerruf" },
};

export default function WithdrawalPage() {
  return <PublicSite page="withdrawal" />;
}
