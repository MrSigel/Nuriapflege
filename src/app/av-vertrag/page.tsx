import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("dpa");

export default function DataProcessingAgreementPage() {
  return (
    <>
      <PublicJsonLd page="dpa" />
      <PublicSite page="dpa" />
    </>
  );
}
