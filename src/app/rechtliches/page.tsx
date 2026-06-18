import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("legal");

export default function LegalOverviewPage() {
  return (
    <>
      <PublicJsonLd page="legal" />
      <PublicSite page="legal" />
    </>
  );
}
