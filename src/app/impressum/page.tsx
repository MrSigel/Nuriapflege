import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("imprint");

export default function ImprintPage() {
  return (
    <>
      <PublicJsonLd page="imprint" />
      <PublicSite page="imprint" />
    </>
  );
}
