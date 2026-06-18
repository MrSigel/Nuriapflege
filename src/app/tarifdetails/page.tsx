import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("pricing");

export default function PricingPage() {
  return (
    <>
      <PublicJsonLd page="pricing" />
      <PublicSite page="pricing" />
    </>
  );
}
