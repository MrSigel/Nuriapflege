import { PublicJsonLd } from "@/components/public-json-ld";
import { PublicSite } from "@/components/public-site";
import { createPublicMetadata } from "@/lib/public-seo";

export const metadata = createPublicMetadata("terms");

export default function TermsPage() {
  return (
    <>
      <PublicJsonLd page="terms" />
      <PublicSite page="terms" />
    </>
  );
}
